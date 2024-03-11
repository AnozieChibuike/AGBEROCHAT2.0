import os
from dotenv import load_dotenv
from google.cloud import storage
from google.oauth2 import service_account
import uuid
from app import app, db, socket
from flask_socketio import disconnect, join_room, leave_room, rooms
from flask import abort, request, flash, session, redirect, url_for, jsonify, abort
from flask import render_template as rd
from app.models import Users, Msg, Rooms
from flask_login import current_user, login_user, logout_user, login_required
from urllib.parse import urlsplit
from urllib.parse import urlencode
import requests
import secrets
import json
from werkzeug.utils import secure_filename
import logging
import boto3

logging.basicConfig(filename="app.log", level=logging.DEBUG)


load_dotenv()

base_url = os.getenv("base_url")

users = {}


def upload_blob(file,filename,bucket_name="agberochat"):
    """Uploads a file to the Google Cloud Storage bucket."""
    s3 = boto3.client('s3')
    # Instantiates a client

    id, extension = os.path.splitext(filename)
    object_name = f"{id}/{uuid.uuid4()}.{extension}"
    # Get the bucket
    try:
        response = s3.list_objects_v2(Bucket=bucket_name,Prefix=id)
        if 'Contents' not in response:
            pass
        else:
            delete_keys = {'Objects': []}
            delete_keys['Objects'] = [{'Key': obj['Key']} for obj in response['Contents']]
    
            # Delete the objects
            s3.delete_objects(Bucket=bucket_name, Delete=delete_keys)
        response = s3.upload_fileobj(file, bucket_name, object_name)
        s3.put_object_acl(Bucket=bucket_name, Key=object_name, ACL='public-read')
        logging.debug("DONE\n\n\n\n\n")
        return {'uri':f'https://agberochat.s3.amazonaws.com/{object_name}'}
    except Exception as e:
        logging.error(e)
        return {'error':0}
    # Extract file name without extension from source file path

    # Rename the destination blob (object) name

@app.post("/upload-img")
def uploadImg():
    file = request.files.get("pfp")
    user = Users.get(id=file.filename.split(".")[0])
    if not file:
        return jsonify({"error": "Image required"}), 400
    
    image_url = upload_blob(file,file.filename).get('uri',None)
    if image_url:
        user.image_url = image_url
        user.save()
    else:
        pass
    return jsonify({"data": user.image_url})


@app.route("/authorize/<provider>")
def authorize(provider):
    if not current_user.is_anonymous:
        return redirect(
            url_for("chatroom", room=Rooms.query.filter_by(name="General").first().id)
        )
    provider_data = app.config["OAUTH2_PROVIDERS"].get(provider)
    if provider_data is None:
        abort(404)
    # generate a random string for the state parameter
    session["oauth2_state"] = secrets.token_urlsafe(16)
    logging.debug(url_for("oauth2_callback", provider=provider, _external=True))
    # create a query string with all the OAuth2 parameters
    qs = urlencode(
        {
            "client_id": provider_data["client_id"],
            "redirect_uri": base_url+'/callback/'+provider,
            "response_type": "code",
            "scope": " ".join(provider_data["scopes"]),
            "state": session["oauth2_state"],
        }
    )
    # redirect the user to the OAuth2 provider authorization URL
    return redirect(provider_data["authorize_url"] + "?" + qs)


@app.route("/callback/<provider>")
def oauth2_callback(provider):
    if not current_user.is_anonymous:
        return redirect(
            url_for("chatroom", room=Rooms.query.filter_by(name="General").first().id)
        )

    provider_data = app.config["OAUTH2_PROVIDERS"].get(provider)
    if provider_data is None:
        abort(404)

    # if there was an authentication error, flash the error messages and exit
    if "error" in request.args:
        for k, v in request.args.items():
            if k.startswith("error"):
                print(f"{k}: {v}")
        return redirect(url_for("index"))

    # make sure that the state parameter matches the one we created in the
    # authorization request
    if request.args["state"] != session.get("oauth2_state"):
        abort(401)

    # make sure that the authorization code is present
    if "code" not in request.args:
        abort(401)

    # exchange the authorization code for an access token
    response = requests.post(
        provider_data["token_url"],
        data={
            "client_id": provider_data["client_id"],
            "client_secret": provider_data["client_secret"],
            "code": request.args["code"],
            "grant_type": "authorization_code",
            "redirect_uri": base_url+'/callback/'+provider,
        },
        headers={"Accept": "application/json"},
    )
    if response.status_code != 200:
        abort(401)
    oauth2_token = response.json().get("access_token")
    if not oauth2_token:
        abort(401)

    # use the access token to get the user's email address
    response = requests.get(
        provider_data["userinfo"]["url"],
        headers={
            "Authorization": "Bearer " + oauth2_token,
            "Accept": "application/json",
        },
    )
    if response.status_code != 200:
        abort(401)
    user_data = provider_data["userinfo"]["data"](response.json())

    user = Users.get(email=user_data["email"])
    if user is None:
        general = Rooms.query.filter_by(name="General").first()
        user = Users(
            email=user_data["email"],
            image_url=user_data["picture"],
            username=user_data["email"].split("@")[0].strip().replace(" ","_"),
        )
        user.rooms.append(general)
        user.save()

    login_user(user)
    # log the user in
    return redirect(
        url_for("chatroom", room=Rooms.query.filter_by(name="General").first().id)
    )


@socket.on("typing")
def handleTyping(data):
    socket.emit(
        "handleTyping",
        {"isTyping": data["typing"]},
        to=data["room"],
        include_self=False,
    )


@socket.on("event")
def disev(data):
    _room = data["room"]
    join_room(data["room"])
    if data.get("username"):
        try:
            users[data["username"]]["rooms"].append(_room)
        except:
            users[data["username"]] = {"rooms": [_room], "sid": request.sid}
        users_in_room = [
            user for user, data in users.items() if _room in data.get("rooms", [])
        ]

        socket.emit(
            "len", {"len": len(users_in_room), "users": users_in_room}, to=_room
        )


@socket.on("disconnect")
def _disconnect():
    try:
        del users[current_user.username]
    except:
        pass


@socket.on("follow")
def follow(data):
    user = Users.get(id=data["user"])
    user2 = Users.get(id=data["user2"])
    user.follow(user2)
    user.save()


@socket.on("unfollow")
def unfollow(data):
    user = Users.get(id=data["user"])
    user2 = Users.get(id=data["user2"])
    user.unfollow(user2)
    user.save()


@socket.on("custom_message")
def handleMessage(data):
    # data["message"], data["room"],

    api_user = data.get("api_user")
    if api_user:
        u = Users.get(id=api_user)
    else:
        u = current_user
    room = Rooms.get(id=data["room"])
    p = Msg(body=data["message"], author=u, room=room)
    p.save()
    socket.emit(
        "mes",
        {
            "user": u.username,
            "imageUrl": u.image_url,
            "msg": data["message"],
            "api_message": {
                "createdAt": p.created_at.isoformat(),
                "text": p.body,
                "_id": p.id,
                "user": {
                    "_id": p.author.id,
                    "name": p.author.username,
                    "avatar": p.author.image_url,
                },
            },
        },
        to=data["room"],
    )


def get_admin_info():
    info = Users.query.filter_by(username="info").first()
    if info:
        return info
    else:
        info = Users(username="info")
        db.session.add(info)
        db.session.commit()
        info = Users.query.filter_by(username="info").first()
        return info


@app.route("/logout")
@login_required
def logout():
    try:
        disconnect(sid=users[current_user.username]["sid"], namespace="/chatbox")
        del users[current_user.username]
    except KeyError:
        pass
    socket.emit("len", {"len": len(users), "users": list(users.keys())})
    logout_user()
    return redirect(url_for('home'))


@app.route("/")
@app.route("/home")
def home():
    return rd("index.html", base_url=base_url)


@app.route("/signup", methods=["POST", "GET"])
def signup():
    if request.method == "POST":
        general = Rooms.query.filter_by(name="General").first()
        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]
        if (
            Users.query.filter_by(email=email).first() is None
            and Users.query.filter_by(username=username).first() is None
        ):
            user = Users(username=username, email=email)
            user.rooms.append(general)
            user.set_password(password)
            user.save()
            return redirect(url_for('login'))
        else:
            flash("Users exists!")
            return redirect(url_for('signup'))
    return rd("signup.html", base_url=base_url)


@app.route("/login", methods=["POST", "GET"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('chatroom'))
    if request.method == "POST":
        logging.debug(base_url)
        email = request.form.get("email")
        password = request.form.get("password")
        remember = bool(request.form.get("remember-me"))
        user = Users.query.filter_by(email=email).first()
        if user is None or not user.check_password(password):
            flash("Invalid login details")
            logging.debug(url_for('login'))
            return redirect(url_for('login'))
        login_user(user, remember=remember)
        next_page = request.args.get("next")
        message = f"{user.username} joined the chat."
        # socket.emit("mes", {"user": "info", "msg": message})
        info = get_admin_info()
        p = Msg(body=message, author=info)
        db.session.add(p)
        db.session.commit()
        if not next_page or urlsplit(next_page).netloc != "":
            next_page = url_for(
                "chatroom", room=Rooms.query.filter_by(name="General").first().id
            )
        return redirect(next_page)
    return rd("login.html", base_url=base_url)


@app.route("/profile/<usern>", methods=["POST", "GET"])
@login_required
def profile(usern):
    query_user = usern
    general = Rooms.query.filter_by(name="General").first().id
    prev_url = request.args.get("prev_url", url_for("chatroom", room=general))
    if not Users.query.filter_by(username=query_user).first():
        abort(404)
    query_user = Users.query.filter_by(username=query_user).first()
    isFollowing = current_user in query_user.get_followers()
    followers = query_user.get_followers()
    following = query_user.get_following()
    if request.method == "POST":
        if request.form.get("bio"):
            if len(request.form.get("bio")) >=500:
                flash(
                    f'Bio should not be more than 500 characters - {len(request.form.get("bio"))}/500'
                )
            else:
                current_user.bio = request.form.get("bio")
        if request.form.get("username", None):
            user = Users.query.filter_by(username=request.form.get("username")).first()
            if user == current_user:
                pass
            elif user:
                flash("Username already taken")
            else:

                room = current_user.rooms
                for rooms in room:
                    p = Msg(
                        body=f"(AUTO) {current_user.username} changed their username to: {request.form.get('username')}",
                        author=current_user,
                        room=rooms,
                    )
                    p.save()
                    socket.emit(
                        "mes",
                        {
                            "user": current_user.username,
                            "imageUrl": current_user.image_url,
                            "msg": f"(AUTO) {current_user.username} changed their username to: {request.form.get('username')}",
                            "api_message": {
                                "createdAt": p.created_at.isoformat(),
                                "text": p.body,
                                "_id": p.id,
                                "user": {
                                    "_id": p.author.id,
                                    "name": p.author.username,
                                    "avatar": p.author.image_url,
                                },
                            },
                        },
                        to=rooms.id,
                    )
                current_user.username = request.form.get("username")
        if request.files.get("pfp"):
            file = request.files.get("pfp")
            if file.filename == "":
                flash("No file selected")
            else:
                filename = secure_filename(file.filename)
                _, ext = os.path.splitext(filename)
                filename = current_user.id + ext
                image_url = upload_blob(file,file.filename).get('uri',None)
                if image_url:
                    current_user.image_url = image_url
                else:
                    pass
        current_user.save()
        return redirect(f"/profile/{current_user.username}?prev_url={prev_url}")

    user_rooms = current_user.rooms
    return rd(
        "profile.html",
        isFollowing=isFollowing,
        user=query_user,
        base_url=base_url,
        user_rooms=user_rooms,
        prev_url=prev_url,
        general=general,
        followers=followers,
        following=following,
    )


@app.route("/profile/<usern>/<query>")
@login_required
def following(usern, query):
    query_user = usern
    if not Users.query.filter_by(username=query_user).first():
        abort(404)
    if query.lower() not in ["followers", "following"]:
        abort(404)
    query_user = Users.query.filter_by(username=query_user).first()
    if query.lower() == "following":
        query = query_user.get_following()
        title = "Following"
    else:
        query = query_user.get_followers()
        title = "Followers"
    return rd(
        "user_page.html", query=query, user=query_user, base_url=base_url, title=title
    )


@app.errorhandler(404)
def page_not_found(error):
    # You can customize the response here
    return rd("error.html", error="404"), 404


@app.errorhandler(500)
def page_not_found(error):
    # You can customize the response here
    return rd("error.html", error="500"), 500


@app.get("/chatbox")
@login_required
def chatroom():
    room = request.args.get("room")
    user_rooms = current_user.rooms
    general = Rooms.query.filter_by(name="General").first().id
    if not room:
        flash("Bad request", "error")
        return redirect(
            url_for("chatroom", room=Rooms.query.filter_by(name="General").first().id)
        )
    Room = Rooms.get(id=room)
    if not Room:
        flash("Room does not exist", "error")
        return redirect(
            url_for("chatroom", room=Rooms.query.filter_by(name="General").first().id)
        )
    if current_user not in Room.users:
        flash("Not a member of Room, request invite link from admin", "error")
        return redirect(
            url_for("chatroom", room=Rooms.query.filter_by(name="General").first().id)
        )
    is_admin = Room.users[0] == current_user
    room_name = Room.name if len(Room.name) < 8 else Room.name[:7] + "..."
    return rd(
        "chat-demo.html",
        base_url=base_url,
        room_id=Room.id,
        room_name=room_name,
        users=Room.users,
        messages=Room.messages.order_by(Msg.created_at.asc()).all(),
        user_rooms=user_rooms,
        is_admin=is_admin,
        general=general,
    )


@app.post("/create_room")
@login_required
def create_room():
    name = request.form["room"]
    if name.lower() == "general":
        flash("Sensored name, Cannot create Room", "error")
    owner = current_user
    room = Rooms(name=name)
    room.users.append(owner)
    room.save()
    flash("Chatroom created successfully", "success")
    return redirect(url_for("chatroom", room=room.id))


@app.get("/join")
@login_required
def join():
    room_name = request.args.get("room")
    if not room_name:
        flash("Invalid param", "error")
        return redirect(
            url_for("chatroom", room=Rooms.query.filter_by(name="General").first().id)
        )
    room = Rooms.get(id=room_name)
    if not room:
        flash("Room does not exist, check the invite link again", "error")
        return redirect(
            url_for("chatroom", room=Rooms.query.filter_by(name="General").first().id)
        )
    if current_user in room.users:
        flash("Already a member of this room", "error")
        return redirect(url_for("chatroom", room=room.id))
    room.users.append(current_user)
    room.save()
    flash(f"Welcome to {room.name} room, please be nice", "success")
    return redirect(url_for("chatroom", room=room.id))


# API
@app.post("/api/users")
def apiUsers():
    data = request.json
    id = data.get("id")
    email = data.get("email")
    users = [i.to_dict() for i in Users.all()]
    if id:
        value = list(filter(lambda x: x["id"] == id, users))

        return jsonify({"data": value})
    if email:
        value = list(filter(lambda x: x["email"] == email, users))
        return jsonify({"data": value})
    return jsonify({"data": users})


@app.post("/api/login")
def apiLogin():
    data = request.json
    try:
        email, password = data["email"], data["password"]
        user = Users.get(email=email)
        if not user:
            return jsonify({"error": "User does not exist", "from": "email"}), 404
        if not user.check_password(password):
            return jsonify({"error": "Incorrect Password", "from": "password"}), 404
        return {"data": user.to_dict(), "success": "Logged in"}
    except:
        return jsonify({"error": "Parameters missing"}), 404


@app.post("/api/signup")
def apiSignUp():
    data = request.json
    general = Rooms.query.filter_by(name="General").first()
    try:
        username = data["username"]
        email = data["email"]
        password = data["password"]
        user = Users.get(email=email)
        usern = Users.get(username=username)
        if usern:
            return (
                jsonify(
                    {"error": "user exists with supplied username", "from": "username"}
                ),
                404,
            )
        if user:
            return (
                jsonify({"error": "user exists with supplied email", "from": "email"}),
                404,
            )
        user = Users(email=email, username=username)
        user.set_password(password)
        user.rooms.append(general)
        user.save()
        return {"data": user.to_dict(), "success": "Signed up"}
    except:
        return jsonify({"error": "Parameters missing"}), 404


@app.post("/api/user/room")
def apiRooms():
    data = request.json
    try:
        id = data["id"]
        user = Users.get(id=id)
        room_id = data.get("room_id")
        if not user:
            return jsonify({"error": "User does not exist"}), 404
        if room_id:
            room = Rooms.get(id=room_id)
            room_messages = [
                {
                    "createdAt": k.created_at.isoformat(),
                    "text": k.body,
                    "_id": k.id,
                    "user": {
                        "_id": k.author.id,
                        "name": k.author.username,
                        "avatar": k.author.image_url,
                    },
                }
                for k in room.messages.order_by(Msg.created_at.desc()).all()
            ]
            return {"data": room_messages, "user": user.to_dict()}
        users_rooms = [
            {
                "id": i.id,
                "name": i.name,
                "user_id": id,
                "username": user.username,
                "messages": [
                    {
                        "createdAt": k.created_at.isoformat(),
                        "text": k.body,
                        "_id": k.id,
                        "user": {
                            "_id": k.author.id,
                            "name": k.author.username,
                            "avatar": k.author.image_url,
                        },
                    }
                    for k in i.messages.order_by(Msg.created_at.desc()).all()
                ],
            }
            for i in user.rooms
        ]
        return {"data": users_rooms, "user": user.to_dict()}
    except Exception as e:

        return jsonify({"error": "Parameters missing"}), 404


@app.post("/api/room/members")
def room_members():
    data = request.json
    try:
        id = data["id"]
        room = Rooms.get(id=id)
        if not room:
            return jsonify({"error": "Room does not exist"}), 404
        room_members = [i.to_dict() for i in room.users]
        return {"data": room_members, "room": room.to_dict()}
    except:
        return jsonify({"error": "Parameters missing"}), 404


@app.post("/api/create_room")
def api_create_room():
    data = request.json
    try:
        name = data["name"]
        if name.lower() == "general":
            return jsonify({"error": "Cannot create room with such name"}), 404
        user = Users.get(id=data["user_id"])
        if not user:
            return jsonify({"error": "User does not exist"}), 404
        room = Rooms(name=name)
        room.users.append(user)
        room.save()
        return {"user": user.to_dict(), "success": "Created", "room": room.to_dict()}
    except:
        return jsonify({"error": "Parameters missing"}), 404


@app.post("/api/join")
def api_join():
    data = request.json
    try:
        room = Rooms.get(id=data["room_id"])
        if not room:
            return jsonify({"error": "Room does not exist"}), 404
        user = Users.get(id=data["user_id"])
        if not user:
            return jsonify({"error": "User does not exist"}), 404
        if user in room.users:
            return jsonify({"error": "Already a member of room"}), 404
        room.users.append(current_user)
        room.save()
        return {"user": user.to_dict(), "success": "Joined", "room": room.to_dict()}
    except:
        return jsonify({"error": "Parameters missing"}), 404
