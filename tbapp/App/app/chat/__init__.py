# Chat Blueprint Package
from flask import Blueprint

# Create the blueprint instance
chat_bp = Blueprint('chat', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes