from app import db,login
from flask import url_for
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.base import BaseModel, user_room_association
import os
from dotenv import load_dotenv


base_url = os.getenv('base_url')

class Users(UserMixin,BaseModel):
    email = db.Column(db.String(120), index=True, unique=True)
    username = db.Column(db.String(120), index=True,unique=True)
    bio = db.Column(db.String(500))
    password_hash = db.Column(db.String(1024))
    is_admin = db.Column(db.Boolean,default=False)
    msg = db.relationship('Msg', backref='author', lazy='dynamic')
    rooms = db.relationship('Rooms', secondary=user_room_association,backref='user')
    image_url = db.Column(db.String(120),default=f'{base_url}/static/assets/images/profile.jpg')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password,method="pbkdf2:sha256")
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'
    
@login.user_loader
def load_user(id):
    return Users.query.get(id)
