from app import app, db, socket
from flask_socketio import disconnect, join_room, leave_room, rooms
from flask import abort, request, flash, session, redirect, url_for, jsonify
from flask import render_template as rd
from app.models import Users, Msg, Rooms
from flask_login import current_user, login_user, logout_user, login_required
from urllib.parse import urlsplit
from urllib.parse import urlencode
import requests
import secrets
import json

users = {}


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

    # create a query string with all the OAuth2 parameters
    qs = urlencode(
        {
            "client_id": provider_data["client_id"],
            "redirect_uri": url_for(
                "oauth2_callback", provider=provider, _external=True
            ),
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
            "redirect_uri": url_for(
                "oauth2_callback", provider=provider, _external=True
            ),
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
            username=user_data["email"].split("@")[0],
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
    socket.emit("handleTyping", {"isTyping": data["typing"]},to=data['room'],include_self=False)


@socket.on("event")
def disev(data):
    _room = data["room"]
    join_room(data["room"])
    if data.get("username"):
        try:
            users[data["username"]]["rooms"].append(_room)
        except Exception as e:
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
                    "avatar": f"http://172.20.10.4:5000{p.author.image_url}",
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
    return redirect("/")


@app.route("/")
@app.route("/home")
def home():
    return rd("index.html.jinja")


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
            return redirect("/login")
        else:
            flash("Users exists!")
            return redirect("/signup")
    return rd("signup.html.jinja")


@app.route("/login", methods=["POST", "GET"])
def login():
    if current_user.is_authenticated:
        return redirect("/chatbox")
    if request.method == "POST":
        email = request.form.get("email")
        password = request.form.get("password")
        remember = bool(request.form.get("remember-me"))
        user = Users.query.filter_by(email=email).first()
        if user is None or not user.check_password(password):
            flash("Invalid login details")
            return redirect("/login")
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
    return rd("login.html.jinja")


@app.get("/chatbox")
@login_required
def chatroom():
    room = request.args.get("room")
    user_rooms = current_user.rooms
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
    return rd(
        "chat-demo.html",
        room_id=Room.id,
        room_name=Room.name,
        users=Room.users,
        messages=Room.messages.all(),
        user_rooms=user_rooms,
        is_admin=is_admin,
    )


@app.post("/create_room")
@login_required
def create_room():
    name = request.form["room"]
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
        flash("Invalid", "error")
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
        if not user:
            return jsonify({"error": "User does not exist"}), 404
        users_rooms = [
            {
                "id": i.id,
                "name": i.name,
                "user_id": id,
                "username": user.username,
                "messages": [
                    {
                        "createdAt": k.created_at,
                        "text": k.body,
                        "_id": k.id,
                        "user": {
                            "_id": k.author.id,
                            "name": k.author.username,
                            "avatar": f"http://172.20.10.4:5000{k.author.image_url}",
                        },
                    }
                    for k in list(reversed(i.messages.all()))
                ],
            }
            for i in user.rooms
        ]
        return {"data": users_rooms, "user": user.to_dict()}
    except:
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
