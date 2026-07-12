# SQLite Database Setup and Management

This document provides instructions for setting up, optimizing, and managing the SQLite database for the Dating System application.

## Database Configuration

The application uses SQLite as its database, which is built into Python. The database configuration is defined in `config.py`:

```python
SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
    'sqlite:///' + os.path.join(basedir, 'app.db')
```

The database file is located at `app/app.db`.

## Database Setup

To set up the database for the first time, run:

```bash
python -m app.setup_db
```

This script will:
1. Create the database tables if they don't exist
2. Initialize database migrations
3. Apply SQLite optimizations
4. Create indexes for better query performance
5. Create a database backup

## Database Migrations

The application uses Flask-Migrate (based on Alembic) to manage database schema changes. Here are the common migration commands:

### Initialize Migrations

```bash
python -m app.migrations init
```

### Create a New Migration

```bash
python -m app.migrations create "description of changes"
```

### Upgrade Database to Latest Migration

```bash
python -m app.migrations upgrade
```

### Downgrade Database

```bash
python -m app.migrations downgrade
```

## Database Optimization

The application includes scripts to optimize SQLite performance:

### Apply All Optimizations

```bash
python -m app.db_optimize all
```

### Apply Specific Optimizations

```bash
python -m app.db_optimize optimize  # Apply SQLite PRAGMA optimizations
python -m app.db_optimize indexes   # Create indexes for better performance
python -m app.db_optimize backup    # Create a database backup
```

## Database Models

The application's database models are defined in the following files:

- `app/models/base.py`: Core models (User, Match, Message, Conversation)
- `app/models/discover.py`: Discovery-related models (UserPreference, UserAction)

All models are imported and made available through `app/models/__init__.py`.

## SQLite Benefits

1. **Zero Configuration**: SQLite requires no setup or administration
2. **Built into Python**: No need for external database servers
3. **File-Based**: The entire database is stored in a single file
4. **Cross-Platform**: Works on all platforms that support Python
5. **Reliable**: ACID-compliant with full transaction support
6. **Efficient**: Fast for most small to medium-sized applications

## Backup and Recovery

The application automatically creates backups when you run the optimization script. Backups are stored in the `app/backups` directory with timestamps.

To manually create a backup:

```bash
python -m app.db_optimize backup
```

To restore from a backup, simply replace the `app.db` file with the backup file.

## Performance Considerations

SQLite performs well for most use cases, but keep these points in mind:

1. **Concurrent Access**: SQLite has limitations with multiple concurrent writes
2. **Database Size**: Performance may degrade with very large databases (>1GB)
3. **Write-Heavy Applications**: Consider using WAL mode (enabled by default in our setup)

For most dating application use cases with moderate user loads, SQLite will perform excellently.