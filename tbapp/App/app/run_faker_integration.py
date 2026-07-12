import sys
import os

# Add the parent directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from app.utils.faker_data import populate_database, export_dummy_data_to_json

app = create_app()

def run_faker_integration():
    """Run the faker data integration"""
    with app.app_context():
        # First export the data to JSON for reference
        export_dummy_data_to_json()
        
        # Then populate the database
        populate_database()
        
        print("Faker data integration complete!")

if __name__ == "__main__":
    run_faker_integration()