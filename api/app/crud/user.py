import uuid
from typing import Optional

from fastapi import Depends
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_async_session
from app.models.user import User # Assuming your user model is here


async def get_user_db_context():
    async for session in get_async_session():
        yield SQLAlchemyUserDatabase(session, User)

# Define crud_user based on the async context manager
# Note: Direct instantiation might be needed depending on usage context
# For dependency injection in FastAPI routes, use `Depends(get_user_db_context)`

# If you need a direct instance (e.g., for scripts or specific non-route logic),
# managing the session scope carefully is crucial.
# However, for typical FastAPI endpoint usage, dependency injection is preferred.

# Let's create an awaitable dependency function for FastAPI
async def get_crud_user(session: AsyncSession = Depends(get_async_session)):
    return SQLAlchemyUserDatabase(session, User)

# If you need a globally accessible object (use with caution regarding session scope):
# async def initialize_crud_user():
#     async for session in get_async_session():
#          # This creates a new session per call, which might not be intended
#          # Need a singleton or scoped session pattern if used globally
#         return SQLAlchemyUserDatabase(session, User)
# crud_user = # Need to await or manage async context appropriately

# For now, let's focus on the dependency injection pattern via get_crud_user
# The import in charts.py likely expected a direct object named crud_user.
# Let's provide a simple placeholder or adapt charts.py to use Depends.

# Simpler approach for now, assuming charts.py needs *an* object named crud_user
# We will need to adjust how the session is handled in charts.py later if this is used directly.
# THIS IS LIKELY NOT THE FINAL CORRECT IMPLEMENTATION FOR SESSION MANAGEMENT

# Placeholder: This won't work correctly without a session.
# crud_user = None # Needs proper async session handling

# Reverting to the dependency pattern as it's the most robust
# We will need to adjust charts.py to use Depends(get_crud_user) instead of importing crud_user directly. 