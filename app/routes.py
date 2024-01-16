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


@socket.on("event")
def disev(data):
    _room = data["room"]
    join_room(data["room"])
    try:
        users[data["username"]]["rooms"].append(_room)
    except Exception as e:
        users[data["username"]] = {"rooms": [_room], "sid": request.sid}
    users_in_room = [
        user for user, data in users.items() if _room in data.get("rooms", [])
    ]

    socket.emit("len", {"len": len(users_in_room), "users": users_in_room}, to=_room)


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


@socket.on("disconnect")
def _disconnect():
    del users[current_user.username]


@app.route("/logout")
@login_required
def logout():
    try:
        disconnect(sid=users[current_user.username]["sid"], namespace="/chatbox")
        # print(users)
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
        socket.emit("mes", {"user": "info", "msg": message})
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


@socket.on("custom_message")
def handleMessage(data):
    u = current_user
    room = Rooms.get(id=data["room"])
    p = Msg(body=data["message"], author=u, room=room)
    p.save()
    socket.emit(
        "mes",
        {"user": u.username, "imageUrl": u.image_url, "msg": data["message"]},
        to=data["room"],
    )


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


# Get messages by user id
@app.route("/api/get-user-messages")
def getUserMessages():
    id = request.args.get("id")
    if not id:
        return jsonify({"message": "Params not found"}), 301
    user = Users.query.get(id)
    if not user:
        return jsonify({"message": "Resource not found"}), 406
    msg = Msg.query.filter_by(user_id=id).all()
    if not msg:
        return jsonify({"message": "User has no messages"})
    list_of_msg = [{"id": i.id, "body": i.body} for i in msg]
    data = {"user": user.username, "messages": list_of_msg}
    return jsonify(data)


# To get User by id
@app.route("/api/user")
def getuser():
    id = request.args.get("id")
    if not id:
        return jsonify({"message": "Params not found"}), 301
    user = Users.query.get(id)
    if not user:
        return jsonify({"message": "No user found"}), 301
    list_of_user = {"id": user.id, "username": user.username}
    data = {"data": list_of_user, "message": "success"}
    return jsonify(data)


# to get all users no required param
@app.route("/api/get-all-user")
def getalluser():
    user = Users.query.all()
    if not user:
        return jsonify({"message": "No user found"}), 301
    list_of_user = [{"id": i.id, "username": i.username} for i in user]
    data = {"data": list_of_user, "message": "success"}
    return jsonify(data)


@app.route("/api/get-all-messages")
def getallmsg():
    msg = Msg.query.all()
    if not msg:
        return jsonify({"message": "No msg found"}), 301
    list_of_msg = [
        {"id": i.id, "msg": i.body, "author": i.author.username} for i in msg
    ]
    data = {"data": list_of_msg, "message": "success"}
    return jsonify(data)
