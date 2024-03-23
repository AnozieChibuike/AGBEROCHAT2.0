from app import app, db, socket
from app.models.users import Users

@app.shell_context_processor
def make_shell_context():
    return {'db': db,'Users':Users}


if not app.config['DEPLOYMENT']:
    if __name__ == "__main__":
        socket.run(app=app,host='0.0.0.0',debug=True)