# Authentication Blueprint Package
from flask import Blueprint

# Create the blueprint instance
auth_bp = Blueprint('auth', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes