# Profile Blueprint Package
from flask import Blueprint

# Create the blueprint instance
profile_bp = Blueprint('profile', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes