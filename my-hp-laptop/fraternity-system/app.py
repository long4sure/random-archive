from flask import Flask
from routes.member_routes import member_bp
from routes.contribution_routes import contribution_bp  # 👈 ADD THIS

app = Flask(__name__)

app.register_blueprint(member_bp)
app.register_blueprint(contribution_bp)  # 👈 ADD THIS

if __name__ == "__main__":
    app.run(debug=True)