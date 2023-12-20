from app import db
from datetime import datetime
import uuid
import pytz

class BaseModel(db.Model):
    """
    BaseModel class
    Args:
        id: Random id for each table
        created_at: Represents the time each class was created
        updated_at: Represents the time each class was updated
    """
    __abstract__ = True
    id = db.Column(db.String(126), primary_key=True, unique=True, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)
    updated_at = db.Column(db.DateTime, nullable=False)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.id = str(uuid.uuid4())
        self.created_at = datetime.now(pytz.timezone('Africa/Lagos'))
        self.updated_at = datetime.now(pytz.timezone('Africa/Lagos'))

    def save(self):
        """
        Saves the current session into the database
        """
        self.updated_at = datetime.now(pytz.timezone('Africa/Lagos'))
        db.session.add(self)
        db.session.commit()

    def delete(self):
        """
        Deletes the current session from the database
        """
        db.session.delete(self)
        db.session.commit()
    def close(self):
        db.session.remove()
    
    def to_dict(self):
        """
        Returns a dictionary representation of the object.
        """
        attributes = {}
        for column in self.__table__.columns:
            attribute_name = column.name
            attribute_value = getattr(self, attribute_name)
            attributes[attribute_name] = attribute_value
        return attributes
    
    @classmethod
    def all(cls):
        """
        Retrieves all objects of the current model
        """
        return cls.query.all()
    
    @classmethod
    def get(cls,**kwargs):
        """
        Retrieve an object by its id or name or email or username.
        Returns the object if found, None otherwise.
        Usage:
            cls.get(name=<name>)
        """
        id = kwargs.get('id')
        name = kwargs.get('name')
        email = kwargs.get('email')
        username = kwargs.get('username') 
        reference = kwargs.get('reference') 
        if id:
            return cls.query.get(id)
        if name:
            return cls.query.filter_by(name=name).first()
        if email:
            return cls.query.filter_by(email=email).first()
        if reference:
            return cls.query.filter_by(reference=reference).first()
