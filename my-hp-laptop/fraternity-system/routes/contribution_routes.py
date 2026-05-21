from flask import Blueprint, request, jsonify
from controllers.contribution_controller import create_contribution, filter_contributions

contribution_bp = Blueprint('contribution_bp', __name__)

# CREATE contribution
@contribution_bp.route('/contributions', methods=['POST'])
def add():
    data = request.get_json()
    response, status = create_contribution(data)
    return jsonify(response), status

# FILTER contribution (GET with query params)
@contribution_bp.route('/contributions', methods=['GET'])
def filter_data():
    date_from = request.args.get("date_from")
    date_to = request.args.get("date_to")

    response, status = filter_contributions(date_from, date_to)
    return jsonify(response), status