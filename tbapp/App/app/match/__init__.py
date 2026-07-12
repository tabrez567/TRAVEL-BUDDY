# Match Blueprint Package
from flask import Blueprint

# Create the blueprint instance
match_bp = Blueprint('match', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes