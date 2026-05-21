from models.contribution_model import add_contribution, get_contributions

def create_contribution(data):
    try:
        member_id = data.get("member_id")
        amount = float(data.get("amount"))
        date = data.get("date")

        if not member_id or not amount or not date:
            return {"status": "error", "message": "Missing fields"}, 400

        add_contribution(member_id, amount, date)

        return {"status": "success", "message": "Contribution added"}, 200

    except Exception as e:
        return {"status": "error", "message": str(e)}, 500


def filter_contributions(date_from, date_to):
    try:
        data = get_contributions(date_from, date_to)
        return {"status": "success", "data": data}, 200

    except Exception as e:
        return {"status": "error", "message": str(e)}, 500