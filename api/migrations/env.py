from logging.config import fileConfig
import os
import sys
from pathlib import Path

# Use standard SQLAlchemy imports
from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Add project root to sys.path
# Assuming migrations directory is directly inside api/ directory
project_root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(project_root))

# Import Base from app.db.base AFTER adding project root to path
try:
    from app.db.base import Base
except ImportError as e:
    print(f"Error: Could not import Base from app.db.base: {e}")
    sys.exit(1)

# Import models AFTER Base definition and AFTER adding path
# This ensures they are registered with Base.metadata
try:
    from app.models.user import User
    # Import other models here if they exist and inherit from Base
    from app.models.chart import Chart
except ImportError as e:
    print(f"Error importing models: {e}")
    sys.exit(1)

# Import settings AFTER adding project root to path
try:
    from app.core.config import settings
except ImportError as e:
    print(f"Error: Could not import settings from app.core.config: {e}")
    sys.exit(1)

# this is the Alembic Config object
config = context.config

# Set the sqlalchemy.url from the application settings
if settings.DATABASE_URL:
    # Ensure the URL string is compatible with standard SQLAlchemy (e.g., postgresql://...)
    db_url = str(settings.DATABASE_URL)
    # Replace postgresql+asyncpg:// with postgresql:// if present
    if db_url.startswith("postgresql+asyncpg://"):
        db_url = db_url.replace("postgresql+asyncpg://", "postgresql://", 1)
    config.set_main_option("sqlalchemy.url", db_url)
else:
    print("Error: DATABASE_URL not found in settings.")
    sys.exit(1)

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata to the SQLAlchemy Base metadata
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
