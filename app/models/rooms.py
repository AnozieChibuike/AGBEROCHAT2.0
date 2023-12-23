from datetime import datetime
from app import db
from app.models.base import BaseModel
from sqlalchemy import JSON

class Rooms(BaseModel):
    name = db.Column(db.String(100))
    messages = db.relationship('Msg', backref='room', lazy='dynamic')
    users = db.relationship('Users', backref='room', lazy='dynamic')