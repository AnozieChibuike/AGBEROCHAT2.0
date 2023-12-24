from datetime import datetime
from app import db
from app.models.base import BaseModel, user_room_association
from sqlalchemy import JSON


class Rooms(BaseModel):
    name = db.Column(db.String(100))
    messages = db.relationship('Msg', backref='room', lazy='dynamic')
    users = db.relationship('Users',secondary=user_room_association, backref='room')