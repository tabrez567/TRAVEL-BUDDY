# Safety Blueprint Package
from flask import Blueprint

# Create the blueprint instance
safety_bp = Blueprint('safety', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes