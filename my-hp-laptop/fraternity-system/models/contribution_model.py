from services.db import get_connection

def add_contribution(member_id, amount, date):
    conn = get_connection()
    cursor = conn.cursor()

    query = """
        INSERT INTO contributions (member_id, amount, date)
        VALUES (%s, %s, %s)
    """
    cursor.execute(query, (member_id, amount, date))

    conn.commit()
    cursor.close()
    conn.close()


def get_contributions(date_from, date_to):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT * FROM contributions
        WHERE date BETWEEN %s AND %s
    """
    cursor.execute(query, (date_from, date_to))

    result = cursor.fetchall()

    cursor.close()
    conn.close()
    return result