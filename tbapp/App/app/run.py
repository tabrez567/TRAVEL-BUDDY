import sys
import os
import argparse

# Add the parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from __init__ import create_app
from extensions import socketio

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Run Travel Buddy app (Flask-SocketIO).')
    parser.add_argument('--dummy', action='store_true', help='Run with dummy database config')
    parser.add_argument('--host', default=os.getenv('HOST', '0.0.0.0'), help='Host to bind (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=int(os.getenv('PORT', '5000')), help='Port to bind (default: 5000)')

    args = parser.parse_args()

    app = create_app(use_dummy_db=args.dummy)

    if args.dummy:
        print('\nRunning with dummy database!')
        print('Dummy profiles will be used for testing without affecting the real database.')

    socketio.run(
        app,
        debug=True,
        host=args.host,
        port=args.port,
        allow_unsafe_werkzeug=True,
    )
