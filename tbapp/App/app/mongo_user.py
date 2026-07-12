from flask_login import UserMixin
from mongodb_models import mongo_get_user_by_id

class MongoUser(UserMixin):
    """
    A User class that works with Flask-Login and uses MongoDB for storage.
    """
    def __init__(self, user_data):
        self.user_data = user_data
        self.id = str(user_data.get('_id'))
        self.email = user_data.get('email')
        self.name = user_data.get('name')
        self.password = user_data.get('password')
        self.profile_complete = user_data.get('profile_complete', False)
        # Add other fields as needed for the UI
        self.age = user_data.get('age')
        self.gender = user_data.get('gender')
        self.bio = user_data.get('bio')
        self.location = user_data.get('location')
        self.profile_picture = user_data.get('profile_picture')

    @staticmethod
    def get(user_id):
        """Fetch user by ID from MongoDB and return a MongoUser instance"""
        user_data = mongo_get_user_by_id(user_id)
        if user_data:
            return MongoUser(user_data)
        return None

    def get_id(self):
        return self.id
