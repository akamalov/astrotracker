from typing import Generator, AsyncGenerator

# Remove unused SQLModel import
# from sqlmodel import Session
# Import the CORRECT get_session dependency if needed here, OR import it directly in endpoints
# For clarity, let's assume endpoints will import get_session from app.db.session directly.

# Import fastapi_users instance from its new location in user_manager
from app.db.user_manager import fastapi_users
from app.models.user import User

# Remove the incorrect redefinition of get_session
# def get_session() -> Generator[Session, None, None]:
#     """Dependency that provides a database session."""
#     with Session(engine) as session:
#         yield session

# Re-export the dependency to get the current active user
# This now relies on the fastapi_users instance imported from user_manager.py
# It ensures the user is active and verified (depending on fastapi-users config)
# Use get_current_active_user for endpoints requiring verified users
# Use get_current_user for endpoints allowing any logged-in user (active or not)
current_active_user = fastapi_users.current_user(active=True)

# Optional: Dependency for any logged-in user (not necessarily active/verified)
# current_user = fastapi_users.current_user()

# Optional: Dependency for superuser (if needed)
# current_superuser = fastapi_users.current_user(active=True, superuser=True) 