from services.db import get_connection

def create_member(name, email, password):
    conn = get_connection()
    cursor = conn.cursor()

    query = "INSERT INTO members (name, email, password) VALUES (%s, %s, %s)"
    cursor.execute(query, (name, email, password))

    conn.commit()
    cursor.close()
    conn.close()