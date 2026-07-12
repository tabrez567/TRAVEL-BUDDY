from flask import Blueprint, render_template

# Create the blueprint instance
theme_test_bp = Blueprint('theme_test', __name__)

@theme_test_bp.route('/test')
def theme_test():
    """Theme test page"""
    return render_template('theme_test.html')