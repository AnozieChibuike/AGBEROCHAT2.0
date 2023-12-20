from app import app, db, socket
from app.models.users import Users

@app.shell_context_processor
def make_shell_context():
    return {'db': db,'Users':Users}

if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0')