import uuid
from typing import AsyncGenerator, Optional

from fastapi import Depends
from fastapi_users.manager import BaseUserManager, UserManagerDependency, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase
from fastapi_users import FastAPIUsers
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select # Import select
from sqlalchemy.orm import joinedload # Import joinedload for eager loading

from app.db.session import get_async_session # Import async session dependency
from app.models.user import User, OAuthAccount # Import User and OAuthAccount
from app.core.config import settings # Import settings for SECRET_KEY
from app.core.security import auth_backends # Import both auth backends

# Define the Custom User Database Adapter
class CustomSQLAlchemyUserDatabase(SQLAlchemyUserDatabase):
    async def get_by_oauth_account(self, oauth: str, account_id: str) -> Optional[User]:
        """Get a user by OAuth account."""
        statement = (
            select(self.user_table)
            .options(joinedload(self.user_table.oauth_accounts)) # Eager load OAuth accounts
            .join(self.oauth_account_table, self.user_table.id == self.oauth_account_table.user_id)
            .where(
                self.oauth_account_table.oauth_name == oauth,
                self.oauth_account_table.account_id == account_id,
            )
        )
        return await self._get_user(statement)

# --- Existing UserManager Setup ---

SECRET = settings.SECRET_KEY.get_secret_value()

class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_register(self, user: User, request: Optional[dict] = None):
        print(f"User {user.id} has registered.")
        # Add logic here if needed after user registration (e.g., sending welcome email)

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[dict] = None
    ):
        print(f"User {user.id} has forgot their password. Reset token: {token}")
        # Add logic here to send password reset email

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[dict] = None
    ):
        print(f"Verification requested for user {user.id}. Verification token: {token}")
        # Add logic here to send verification email

    # Override create method if you need custom logic before/after user creation
    # async def create(
    #     self, user_create: UserCreate, safe: bool = False, request: Optional[Request] = None
    # ) -> User:
    #     # Custom logic before creation
    #     created_user = await super().create(user_create, safe, request)
    #     # Custom logic after creation
    #     print(f"User created with custom logic: {created_user.id}")
    #     return created_user

# Dependency to get the custom user DB instance
async def get_user_db(
    session: AsyncSession = Depends(get_async_session),
) -> AsyncGenerator[CustomSQLAlchemyUserDatabase, None]: # Return custom type
    yield CustomSQLAlchemyUserDatabase(session, User, OAuthAccount)

# Dependency to get the user manager instance
async def get_user_manager(user_db: CustomSQLAlchemyUserDatabase = Depends(get_user_db)) -> AsyncGenerator[UserManager, None]: # Depend on custom type
    yield UserManager(user_db)

# --- FastAPIUsers Instance ---
# Create FastAPIUsers instance here, importing necessary components
fastapi_users = FastAPIUsers[User, uuid.UUID](
    get_user_manager, # Dependency to get the user manager
    auth_backends,    # List of authentication backends (cookie and jwt)
) 