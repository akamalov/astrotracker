from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from fastapi import Depends

# Need the User model for SQLAlchemyUserDatabase
from app.models.user import User, OAuthAccount
from fastapi_users.db import SQLAlchemyUserDatabase
from typing import AsyncGenerator

from app.core.config import settings

# --- Asynchronous Engine/Session --- 
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True,
    pool_pre_ping=True
)

AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# --- Dependencies --- 

# Async session dependency
async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

# Optional: Function to create tables based on SQLModel metadata 
# async def create_db_and_tables():
#     async with async_engine.begin() as conn:
#         await conn.run_sync(Base.metadata.create_all) # Use SQLAlchemy Base here 