from app import app, db, socket
from flask_socketio import disconnect, join_room, leave_room, rooms
from flask import request, flash, session, redirect, url_for,jsonify
from flask import render_template as rd
from app.models import Users, Msg, Rooms
from flask_login import current_user, login_user, logout_user, login_required
from urllib.parse import urlsplit

users = {}

# @socket.on('join')
# def join(data):
#     print(users)
    
#     print(rooms())
    

@socket.on('event')
def disev(data):
    _room = data['room']
    join_room(data['room'])
    try:
        users[data['username']]['rooms'].append(_room)
    except Exception as e:
        users[data['username']] = {'rooms':[_room],'sid':request.sid}
    users_in_room = [user for user, data in users.items() if _room in data.get('rooms',[])]
    
    socket.emit('len',{'len': len(users_in_room),'users': users_in_room},to=_room)    

def get_admin_info():
    info = Users.query.filter_by(username='info').first()
    if info:
        return info
    else:
        info = Users(username='info')
        db.session.add(info)
        db.session.commit()
        info = Users.query.filter_by(username='info').first()
        return info

@socket.on('disconnect')
def _disconnect():
    del users[current_user.username]

@app.route('/logout')
@login_required
def logout():
    try:
        disconnect(sid=users[current_user.username]['sid'],namespace='/chatbox')
        # print(users)
        del users[current_user.username]
    except KeyError:
       pass 
    socket.emit('len',{'len': len(users),'users': list(users.keys())})    
    logout_user()
    return redirect('/')


@app.route('/')
@app.route('/home')
def home():
    return rd("index.html.jinja")


@app.route('/signup', methods=["POST", "GET"])
def signup():
    if request.method == "POST":
        general = Rooms.query.filter_by(name='General').first()
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        if Users.query.filter_by(email=email).first() is None and Users.query.filter_by(username=username).first() is None:
            user = Users(username=username, email=email)
            user.rooms.append(general)
            user.set_password(password)
            user.save()
            return redirect('/login')
        else:
            flash('Users exists!')
            return redirect('/signup')
    return rd("signup.html.jinja")

@app.route('/login', methods=['POST', 'GET'])
def login():
    if current_user.is_authenticated:
        return redirect('/chatbox')
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        remember = bool(request.form.get('remember-me'))
        user = Users.query.filter_by(email=email).first()
        if user is None or not user.check_password(password):
            flash('Invalid login details')
            return redirect('/login')
        login_user(user, remember=remember)
        next_page = request.args.get('next')
        message = f'{user.username} joined the chat.'
        socket.emit('mes', {'user': 'info', 'msg': message})
        info = get_admin_info()
        p = Msg(body=message, author=info)
        db.session.add(p)
        db.session.commit()
        if not next_page or urlsplit(next_page).netloc != '':
            next_page = url_for('chatroom',room=Rooms.query.filter_by(name='General').first().id)
        return redirect(next_page)
    return rd("login.html.jinja")


# Handling socket frontend
# @socket.on('message')
# def message(message):
#     u = current_user
#     p = Msg(body=message, author=u)
#     db.session.add(p)
#     db.session.commit()
#     socket.emit('mes', {'user': u.username, 'msg': message},to=message['room'])


# @app.route('/chatbox', methods=['POST', 'GET'])
# @login_required
# def chatbox():
#     posts = Msg.query.all()
#     return rd("chat-demo.html", posts=posts,)

@socket.on('custom_message')
def handleMessage(data):
    u = current_user
    room = Rooms.get(id=data['room'])
    p = Msg(body=data['message'], author=u,room=room)
    p.save()
    socket.emit('mes', {'user': u.username, 'msg': data['message']},to=data['room'])
    
@app.get('/chatbox')
@login_required
def chatroom():
    room = request.args.get('room')
    user_rooms = current_user.rooms
    if not room:
        flash("Bad request",'error')
        return redirect(url_for('chatroom',room=Rooms.query.filter_by(name='General').first().id))
    Room = Rooms.get(id=room)
    if not Room:
        flash("Room does not exist",'error')
        return redirect(url_for('chatroom',room=Rooms.query.filter_by(name='General').first().id))
    if current_user not in Room.users:
        flash("Not a member of Room, request invite link from admin",'error')
        return redirect(url_for('chatroom',room=Rooms.query.filter_by(name='General').first().id))
    return rd('chat-demo.html', room_id=Room.id,room_name=Room.name,users=Room.users,messages=Room.messages.all(),user_rooms=user_rooms)

@app.post('/create_room')
@login_required
def create_room():
    name = request.form['room']
    owner = current_user
    room = Rooms(name=name)
    room.users.append(owner)
    room.save()
    flash('Chatroom created successfully','success')
    return redirect(url_for('chatroom',room=room.id))

@app.post('/join')
@login_required
def join():
    return 'Nice'

# API

# Get messages by user id
@app.route('/api/get-user-messages')
def getUserMessages():
    id = request.args.get('id')
    if not id:
        return jsonify({'message':'Params not found'}),301
    user = Users.query.get(id)
    if not user:
        return jsonify({'message':'Resource not found'}),406
    msg = Msg.query.filter_by(user_id=id).all()
    if not msg:
        return jsonify({'message':'User has no messages'})
    list_of_msg = [{'id':i.id,'body':i.body} for i in msg]
    data = {'user':user.username,'messages':list_of_msg}
    return jsonify(data)
# To get User by id
@app.route('/api/user')
def getuser():
    id = request.args.get('id')
    if not id:
        return jsonify({'message':'Params not found'}),301
    user = Users.query.get(id)
    if not user:
        return jsonify({'message':'No user found'}), 301
    list_of_user = {'id':user.id,'username':user.username}
    data = {'data':list_of_user,'message':'success'}
    return jsonify(data)
# to get all users no required param
@app.route('/api/get-all-user')
def getalluser():
    user = Users.query.all()
    if not user:
        return jsonify({'message':'No user found'}), 301
    list_of_user = [{'id':i.id,'username':i.username} for i in user]
    data = {'data':list_of_user,'message':'success'}
    return jsonify(data)

@app.route('/api/get-all-messages')
def getallmsg():
    msg = Msg.query.all()
    if not msg:
        return jsonify({'message':'No msg found'}), 301
    list_of_msg = [{'id':i.id,'msg':i.body,'author':i.author.username} for i in msg]
    data = {'data':list_of_msg,'message':'success'}
    return jsonify(data)
