# Chatbot Blueprint Package
from flask import Blueprint

# Create the blueprint instance
chatbot_bp = Blueprint('chatbot', __name__)

# Import routes after creating the blueprint to avoid circular imports
from . import routes