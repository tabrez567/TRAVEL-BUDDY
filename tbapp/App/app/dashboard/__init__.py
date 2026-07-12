# Dashboard Blueprint Package
from flask import Blueprint

# Create the blueprint instance
dashboard_bp = Blueprint('dashboard', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes, analytics