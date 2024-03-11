import os
from dotenv import load_dotenv

load_dotenv()

class Config(object):
    SECRET_KEY = "shjhfgdskhjd"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or "sqlite:///app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    OAUTH2_PROVIDERS = {
        "google": {
            "client_id": os.getenv('CLIENT_ID'),
            "client_secret": os.getenv('CLIENT_SECRET'),
            "authorize_url": "https://accounts.google.com/o/oauth2/auth",
            "token_url": "https://accounts.google.com/o/oauth2/token",
            "userinfo": {
                "url": "https://www.googleapis.com/oauth2/v3/userinfo",
                "data": lambda json: {
                    "email": json["email"],
                    "picture": json["picture"],
                },
            },
            "scopes": ["https://www.googleapis.com/auth/userinfo.email"],
        }
    }
    DEPLOYMENT = bool(os.getenv("DEPLOYMENT")) or False
