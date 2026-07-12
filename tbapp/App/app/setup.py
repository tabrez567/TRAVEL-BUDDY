#!/usr/bin/env python3
"""
Connectify Dating App Setup Script
This script helps set up the Connectify dating application.
"""

import os
import sys
import subprocess
import sqlite3
from pathlib import Path

def print_banner():
    """Print the application banner."""
    print("=" * 60)
    print("🎉 Welcome to Connectify Dating App Setup! 🎉")
    print("=" * 60)
    print()

def check_python_version():
    """Check if Python version is compatible."""
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8 or higher is required.")
        print(f"   Current version: {sys.version}")
        sys.exit(1)
    print(f"✅ Python version: {sys.version.split()[0]}")

def check_dependencies():
    """Check if required dependencies are installed."""
    print("\n📦 Checking dependencies...")
    
    required_packages = [
        'flask',
        'flask-sqlalchemy',
        'flask-login',
        'flask-socketio',
        'werkzeug'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} - Missing")
            missing_packages.append(package)
    
    if missing_packages:
        print(f"\n⚠️  Missing packages: {', '.join(missing_packages)}")
        print("   Run: pip install -r requirement.txt")
        return False
    
    return True

def install_dependencies():
    """Install required dependencies."""
    print("\n📦 Installing dependencies...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirement.txt'])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing dependencies: {e}")
        return False

def create_database():
    """Create and initialize the database."""
    print("\n🗄️  Setting up database...")
    
    try:
        # Import the app to create database tables
        from __init__ import create_app, db
        
        app = create_app()
        with app.app_context():
            db.create_all()
            print("✅ Database tables created successfully!")
            
            # Add sample data
            add_sample_data()
            
        return True
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return False

def add_sample_data():
    """Add sample data to the database."""
    print("📝 Adding sample data...")
    
    try:
        from models import User
        from werkzeug.security import generate_password_hash
        from datetime import datetime
        
        # Check if users already exist
        if User.query.first():
            print("✅ Sample data already exists!")
            return
        
        # Create sample users
        sample_users = [
            {
                'name': 'Alice Johnson',
                'email': 'alice@example.com',
                'password': 'password123',
                'age': 25,
                'gender': 'Female',
                'location': 'New York, NY',
                'bio': 'Love traveling, photography, and trying new restaurants!',
                'interests': 'Travel,Photography,Food,Art,Music'
            },
            {
                'name': 'Bob Smith',
                'email': 'bob@example.com',
                'password': 'password123',
                'age': 28,
                'gender': 'Male',
                'location': 'San Francisco, CA',
                'bio': 'Tech enthusiast, fitness lover, and coffee addict!',
                'interests': 'Technology,Fitness,Coffee,Gaming,Movies'
            },
            {
                'name': 'Carol Davis',
                'email': 'carol@example.com',
                'password': 'password123',
                'age': 23,
                'gender': 'Female',
                'location': 'Los Angeles, CA',
                'bio': 'Artist, yoga instructor, and nature lover.',
                'interests': 'Art,Yoga,Nature,Meditation,Reading'
            }
        ]
        
        for user_data in sample_users:
            user = User(
                name=user_data['name'],
                email=user_data['email'],
                password=generate_password_hash(user_data['password']),
                age=user_data['age'],
                gender=user_data['gender'],
                location=user_data['location'],
                bio=user_data['bio'],
                interests=user_data['interests'],
                created_at=datetime.now(),
                last_login=datetime.now(),
                is_verified=True,
                profile_complete=True
            )
            db.session.add(user)
        
        db.session.commit()
        print("✅ Sample users created successfully!")
        
    except Exception as e:
        print(f"⚠️  Warning: Could not add sample data: {e}")

def create_directories():
    """Create necessary directories."""
    print("\n📁 Creating directories...")
    
    directories = [
        'static/uploads',
        'static/uploads/profiles',
        'static/uploads/avatars',
        'logs'
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"✅ Created: {directory}")

def create_env_file():
    """Create environment configuration file."""
    print("\n⚙️  Creating environment configuration...")
    
    env_content = """# Connectify Environment Configuration
SECRET_KEY=dev-key-please-change-in-production
DATABASE_URL=sqlite:///app.db
FLASK_ENV=development
FLASK_DEBUG=True

# Email Configuration (Optional)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379/0

# File Upload Configuration
MAX_CONTENT_LENGTH=16777216  # 16MB
UPLOAD_FOLDER=static/uploads
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif,webp

# Chat Configuration
CHAT_MESSAGES_PER_PAGE=50

# Matching Algorithm Configuration
MATCH_THRESHOLD=0.7
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ Created: .env file")
    except Exception as e:
        print(f"⚠️  Warning: Could not create .env file: {e}")

def run_tests():
    """Run basic tests to verify setup."""
    print("\n🧪 Running basic tests...")
    
    try:
        # Test app creation
        from __init__ import create_app
        app = create_app()
        print("✅ App creation test passed")
        
        # Test database connection
        with app.app_context():
            from models import User
            user_count = User.query.count()
            print(f"✅ Database connection test passed ({user_count} users)")
        
        return True
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def print_success_message():
    """Print success message with next steps."""
    print("\n" + "=" * 60)
    print("🎉 Setup completed successfully! 🎉")
    print("=" * 60)
    print()
    print("📋 Next steps:")
    print("1. Run the application:")
    print("   python run.py")
    print()
    print("2. Open your browser and go to:")
    print("   http://localhost:5000")
    print()
    print("3. Login with sample accounts:")
    print("   Email: alice@example.com, Password: password123")
    print("   Email: bob@example.com, Password: password123")
    print("   Email: carol@example.com, Password: password123")
    print()
    print("4. Explore the features:")
    print("   - Create your profile")
    print("   - Discover matches")
    print("   - Start chatting")
    print("   - View analytics")
    print()
    print("📚 Documentation: README.md")
    print("🐛 Issues: Check the logs/ directory")
    print()
    print("Happy dating! 💕")

def main():
    """Main setup function."""
    print_banner()
    
    # Check Python version
    check_python_version()
    
    # Check dependencies
    if not check_dependencies():
        print("\n📦 Installing missing dependencies...")
        if not install_dependencies():
            print("❌ Setup failed: Could not install dependencies")
            sys.exit(1)
    
    # Create directories
    create_directories()
    
    # Create environment file
    create_env_file()
    
    # Create database
    if not create_database():
        print("❌ Setup failed: Could not create database")
        sys.exit(1)
    
    # Run tests
    if not run_tests():
        print("❌ Setup failed: Tests failed")
        sys.exit(1)
    
    # Print success message
    print_success_message()

if __name__ == "__main__":
    main()
