import sqlite3
import os

def find_in_db(db_path):
    print(f"\nChecking {db_path}...")
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, email, profile_picture FROM users WHERE name LIKE "%Emma%"')
    results = cursor.fetchall()
    if results:
        for row in results:
            print(f"ID: {row[0]}, Name: {row[1]}, Email: {row[2]}, Profile Pic: {row[3]}")
    else:
        print("Emma not found. Listing all names...")
        cursor.execute('SELECT name FROM users')
        all_names = cursor.fetchall()
        for name in all_names:
            print(f" - {name[0]}")
    conn.close()

find_in_db('App/app/app.db')
find_in_db('App/app/dummy_app.db')
