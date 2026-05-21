from models.member_model import create_member
import bcrypt

def add_member(data):
    try:
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return {"status": "error", "message": "Missing fields"}, 400

        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        create_member(name, email, hashed)

        return {"status": "success", "message": "Member created"}, 200

    except Exception as e:
        return {"status": "error", "message": str(e)}, 500