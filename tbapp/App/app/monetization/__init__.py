# Monetization Blueprint Package
from flask import Blueprint

# Create the blueprint instance
monetization_bp = Blueprint('monetization', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes