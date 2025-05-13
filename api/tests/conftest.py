import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
# Import Base from where models inherit to ensure metadata is collected
from app.db.base import Base
import asyncio
from typing import AsyncGenerator, Generator, Dict
from uuid import uuid4

# Import app instance, settings, and dependencies
from app.main import app
from app.core.config import settings
from app.db.session import get_async_session, AsyncSessionLocal
from app.models.user import User
# UserCreate schema might not be needed here anymore
# from app.schemas.user import UserCreate
# get_user_manager might not be needed here anymore
# from app.db.user_manager import get_user_manager
from pwdlib import PasswordHash
from httpx import AsyncClient
from sqlalchemy.future import select
import types
from app.crud.chart import get_crud_chart  # <-- Add this import
from unittest.mock import MagicMock


# --- Per-test DB Engine/Session Factory --- #
@pytest.fixture(scope="function")
def test_engine_and_session():
    """Create a new engine and session factory for each test function."""
    test_db_url = settings.TEST_DATABASE_URL
    engine = create_async_engine(test_db_url, echo=False, future=True)
    AsyncTestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
    )
    yield engine, AsyncTestingSessionLocal
    # Cleanup
    asyncio.get_event_loop().run_until_complete(engine.dispose())

@pytest.fixture(scope="function", autouse=True)
async def setup_db(test_engine_and_session):
    engine, _ = test_engine_and_session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()

async def override_get_async_session(test_engine_and_session) -> AsyncGenerator[AsyncSession, None]:
    _, AsyncTestingSessionLocal = test_engine_and_session
    async with AsyncTestingSessionLocal() as session:
        yield session

def make_async_session_override(test_engine_and_session):
    async def _override():
        async for session in override_get_async_session(test_engine_and_session):
            yield session
    return _override

@pytest.fixture(scope="function")
def override_dependencies(test_engine_and_session):
    original_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_async_session] = make_async_session_override(test_engine_and_session)
    yield
    app.dependency_overrides = original_overrides

@pytest.fixture(scope="function")
def crud_chart_override():
    """Fixture to allow tests to override get_crud_chart dependency with a mock or test double."""
    return MagicMock()

@pytest.fixture(scope="function")
async def client(override_dependencies, crud_chart_override) -> AsyncGenerator[AsyncClient, None]:
    # If the test provides a mock/test double for get_crud_chart, override it
    if crud_chart_override is not None:
        app.dependency_overrides[get_crud_chart] = lambda: crud_chart_override
    async with AsyncClient(app=app, base_url="http://test") as c:
        yield c
    # Clean up after test
    if crud_chart_override is not None:
        app.dependency_overrides.pop(get_crud_chart, None)

@pytest.fixture(scope="function")
async def db_session(test_engine_and_session) -> AsyncGenerator[AsyncSession, None]:
    _, AsyncTestingSessionLocal = test_engine_and_session
    async with AsyncTestingSessionLocal() as session:
        yield session
        await session.rollback()

# --- Helper Function for User Creation --- #
# WARNING: Do NOT use this helper in API (client) tests.
# Only use for direct DB/service tests.
# For API tests, create users via the API endpoints to avoid async session conflicts.
async def create_test_user(
    session: AsyncSession,
    email: str = f"testuser_{uuid4()}@example.com",
    password: str = "password123",
    is_active: bool = True,
    is_superuser: bool = False,
    is_verified: bool = True,
) -> User:
    password_hasher = PasswordHash.recommended()
    hashed_password = password_hasher.hash(password)
    user_data = {
        "email": email,
        "hashed_password": hashed_password,
        "is_active": is_active,
        "is_superuser": is_superuser,
        "is_verified": is_verified,
    }
    user = User(**user_data)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    print(f"DEBUG (create_test_user): Created test user in provided session: {user.email}")
    return user

@pytest.fixture(scope="function")
def auth_headers() -> Dict[str, str]:
    print("DEBUG (auth_headers): Returning placeholder headers. Test needs to login.")
    return {"Authorization": "Bearer PLACEHOLDER_TOKEN_LOGIN_IN_TEST"}

