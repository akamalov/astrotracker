import configparser
import os
import sys
from pathlib import Path

# Add the project root to the Python path to allow importing 'app'
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

try:
    # Import the settings object from your app's config module
    # Adjust the import path if your config file is located differently
    from app.core.config import settings
except ImportError as e:
    print(f"Error importing settings: {e}")
    print("Ensure the script is run from the correct directory or PYTHONPATH is set.")
    sys.exit(1)

# Path to alembic.ini relative to this script's location might be fragile.
# It's better to assume alembic.ini is in the project root (where alembic is usually run)
# or pass the path if needed. Let's assume project root for now.
alembic_ini_path = project_root / "alembic.ini"

if not alembic_ini_path.exists():
    print(f"Error: alembic.ini not found at {alembic_ini_path}")
    sys.exit(1)

# Load the actual database URL from settings
# Ensure your settings object has the DATABASE_URL attribute correctly configured
database_url = str(settings.DATABASE_URL)

if not database_url:
    print("Error: DATABASE_URL not found in settings.")
    sys.exit(1)

# Read alembic.ini
config = configparser.ConfigParser()
try:
    config.read(alembic_ini_path)
except configparser.Error as e:
    print(f"Error reading {alembic_ini_path}: {e}")
    sys.exit(1)

# Update the sqlalchemy.url value
if 'alembic' in config:
    print(f"Updating sqlalchemy.url in {alembic_ini_path}...")
    config['alembic']['sqlalchemy.url'] = database_url
else:
    print("Error: [alembic] section not found in alembic.ini")
    sys.exit(1)

# Write the changes back to alembic.ini
try:
    with open(alembic_ini_path, 'w') as configfile:
        config.write(configfile)
    print("Successfully updated sqlalchemy.url.")
except IOError as e:
    print(f"Error writing to {alembic_ini_path}: {e}")
    sys.exit(1)

sys.exit(0) 