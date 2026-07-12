from flask import Blueprint

discover_bp = Blueprint('discover', __name__, url_prefix='/discover')

# Import routes
from . import routes