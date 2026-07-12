import sqlite3
import os

def list_users(db_path):
    print(f"\n--- {db_path} ---")
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, profile_picture FROM users')
    users = cursor.fetchall()
    for user in users:
        print(f"ID: {user[0]}, Name: {user[1]}, Pic: {user[2]}")
    conn.close()

db_paths = ['App/app/app.db', 'App/app/dummy_app.db']
for db_path in db_paths:
    list_users(db_path)
