from flask import Blueprint, request, jsonify
from controllers.member_controller import add_member

member_bp = Blueprint('member_bp', __name__)

@member_bp.route('/members', methods=['POST'])
def create():
    data = request.get_json()
    response, status = add_member(data)
    return jsonify(response), status