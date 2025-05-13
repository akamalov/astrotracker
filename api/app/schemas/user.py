# /app/schemas/user.py
from uuid import UUID
from typing import Optional

# Import base schemas from fastapi_users. BaseUser, BaseUserCreate, BaseUserUpdate
from fastapi_users import schemas

# Schema for reading user data
class UserRead(schemas.BaseUser[UUID]):
    pass

# Schema for creating a new user
class UserCreate(schemas.BaseUserCreate):
    pass

# Schema for updating user data (e.g., password, email)
class UserUpdate(schemas.BaseUserUpdate):
    pass 