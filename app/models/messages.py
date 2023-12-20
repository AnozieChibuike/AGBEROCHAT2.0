from datetime import datetime
import pytz
from app import db
from app.models.base import BaseModel


class Msg(BaseModel):
    body = db.Column(db.String(140))
    timestamp = db.Column(db.DateTime, index=True, default=datetime.now(pytz.timezone('Africa/Lagos')))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    def __repr__(self):
        return '<Msg {}>'.format(self.body)