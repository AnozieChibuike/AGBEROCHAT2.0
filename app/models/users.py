from app import db, login
from flask import url_for
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from app.models.base import BaseModel, user_room_association
import os
from dotenv import load_dotenv


base_url = os.getenv("base_url")

followers = db.Table(
    "followers",
    db.Column(
        "follower_email",
        db.String(120),
        db.ForeignKey("users.email"),
        primary_key=True,
    ),
    db.Column(
        "followed_email",
        db.String(120),
        db.ForeignKey("users.email"),
        primary_key=True,
    ),
)


class Users(UserMixin, BaseModel):
    email = db.Column(db.String(120), index=True, unique=True)
    username = db.Column(db.String(120), index=True, unique=True)
    bio = db.Column(db.String(500),default='')
    password_hash = db.Column(db.String(1024))
    is_admin = db.Column(db.Boolean, default=False)
    msg = db.relationship("Msg", backref="author", lazy="dynamic")
    rooms = db.relationship("Rooms", secondary=user_room_association, backref="user")
    image_url = db.Column(
        db.String(120), default=f"{base_url}/static/assets/images/profile.jpg"
    )
    followed = db.relationship(
        "Users",
        secondary=followers,
        primaryjoin=(followers.c.follower_email == email),
        secondaryjoin=(followers.c.followed_email == email),
        backref=db.backref("followers", lazy="dynamic"),
        lazy="dynamic",
    )

    def follow(self, user):
        if user.username == self.username:
            return f'Cannot follow self'
        if user in self.followed:
            return f"{self.username} already following {user.username}"
        self.followed.append(user)
        return f"{self.username} followed {user.username}"

    def unfollow(self, user):
        if user not in self.followed:
            return f"{self.username} not following {user.username}"
        self.followed.remove(user)
        return f"{self.username} unfollowed {user.username}"

    def get_followers(self):
        return self.followers.all()

    def get_following(self):
        return self.followed.all()

    def get_mutual_followers(self,user):
        return list(filter(lambda x: x in self.get_followers(),user.get_followers()))
    
    def get_mutual_following(self,user):
        return list(filter(lambda x: x in self.get_following(),user.get_following()))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.username}>"


@login.user_loader
def load_user(id):
    return Users.query.get(id)
