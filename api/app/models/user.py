import uuid
from typing import TYPE_CHECKING, List, Optional

# Imports for FastAPI Users DB and OAuth
from fastapi_users.db import (
    SQLAlchemyBaseUserTableUUID,
    SQLAlchemyBaseOAuthAccountTableUUID,
)
# Import the mixin from the correct package/module
# from fastapi_users_db_sqlalchemy import SQLAlchemyOAuthAccountMixin # <--- REMOVE THIS LINE
from fastapi_users import schemas
# from sqlmodel import Field, SQLModel # <<< REMOVE SQLModel imports
# from pydantic import ConfigDict 

# <<< Import the new SQLAlchemy Base >>>
from app.db.base import Base

# Import SQLAlchemy types for relationships
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

# Define a base model with UUID if not already existing globally
# If you have a shared base model, import it instead.
# class UUIDModel(SQLModel):
#     id: uuid.UUID = Field(
#         default_factory=uuid.uuid4,
#         primary_key=True,
#         index=True,
#         nullable=False,
#     )

# --- OAuth Account Model ---
class OAuthAccount(SQLAlchemyBaseOAuthAccountTableUUID, Base):
    # Define the relationship back to the User model
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user.id", ondelete="cascade"))
    user: Mapped["User"] = relationship(back_populates="oauth_accounts")

# --- User Model ---
# Remove SQLAlchemyOAuthAccountMixin from inheritance
class User(SQLAlchemyBaseUserTableUUID, Base):
    # Define the relationship to the OAuthAccount model
    # Set lazy='joined' to ensure accounts are always loaded with the user
    oauth_accounts: Mapped[List[OAuthAccount]] = relationship(
        "OAuthAccount", back_populates="user", lazy="joined"
    )

    # Remove model_config
    # model_config = ConfigDict(arbitrary_types_allowed=True)
    
    # Rely entirely on fields inherited from SQLAlchemyBaseUserTableUUID
    # Remove all explicit Field definitions
    # id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True, index=True, nullable=False)
    # email: str = Field(unique=True, index=True, max_length=255, nullable=False)
    # hashed_password: str = Field(nullable=False, max_length=1024)
    # is_active: bool = Field(default=True, nullable=False)
    # is_superuser: bool = Field(default=False, nullable=False)
    # is_verified: bool = Field(default=False, nullable=False)
    
    # Add any *additional* user fields here if needed, using SQLAlchemy Column syntax
    # e.g., full_name: Optional[str] = Column(String(length=255), index=True, nullable=True)

    # Define relationships if needed using SQLAlchemy Relationship
    # Example:
    # from sqlalchemy.orm import relationship
    # from sqlalchemy import Column, ForeignKey, UUID
    # charts: List["Chart"] = relationship("Chart", back_populates="user")
    pass # No additional fields or relationships for now

# --- FastAPI Users Pydantic Schemas --- 

class UserRead(schemas.BaseUser[uuid.UUID]):
    id: uuid.UUID
    email: str
    is_active: bool
    is_superuser: bool
    is_verified: bool
    # Make sure to add from_attributes=True (or orm_mode=True in Pydantic v1)
    # model_config = ConfigDict(from_attributes=True) # Already exists, keep it

class UserCreate(schemas.BaseUserCreate):
    pass

class UserUpdate(schemas.BaseUserUpdate):
    pass 