from app import app, db
from utils.faker_data import populate_database, export_dummy_data_to_json
import os

def integrate_faker_data():
    """Integrate Faker data into the application"""
    with app.app_context():
        # First export the data to JSON for reference
        export_dummy_data_to_json()
        
        # Then populate the database
        populate_database()
        
        print("Faker data integration complete!")

if __name__ == "__main__":
    integrate_faker_data()