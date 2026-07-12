# Notifications Blueprint Package
from flask import Blueprint

# Create the blueprint instance
notifications_bp = Blueprint('notifications', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes