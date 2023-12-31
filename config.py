import os


class Config(object):
    SECRET_KEY = "shjhfgdskhjd"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL") or "sqlite:///app.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    OAUTH2_PROVIDERS = {
        "google": {
            "client_id": "86746551156-h24fjrqt31t7cfmj7ofv6e10nafkhcr4.apps.googleusercontent.com",
            "client_secret": "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",
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
