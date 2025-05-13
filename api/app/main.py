import uuid
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from contextlib import asynccontextmanager
import sentry_sdk
from starlette.datastructures import URL
# Removed unused imports

from app.core.config import settings
from app.db.session import async_engine

# Import the fastapi_users instance from its new location
from app.db.user_manager import fastapi_users
# Import the auth_backend and google_oauth_client here
from app.core.security import auth_backend, jwt_auth_backend # Import both auth backends
# Import User schemas here, before they are used
from app.models.user import UserRead, UserCreate, UserUpdate

# Import API endpoint routers
from app.api.v1.endpoints import health
from app.api.v1.endpoints import charts # <<< REVERTED IMPORT STYLE

# Imports for state/error utils and user manager dep
from fastapi_users.exceptions import UserAlreadyExists
# from httpx_oauth.errors import OAuth2Error, InvalidOAuth2StateError # Still commented out
from app.db.user_manager import get_user_manager

# Define lifespan manager for startup/shutdown events
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    print("Starting up...")
    # --- Sentry Initialization ---
    if settings.SENTRY_DSN:
        print(f"Initializing Sentry for project: {settings.PROJECT_NAME}")
        sentry_sdk.init(
            dsn=str(settings.SENTRY_DSN.get_secret_value()),
            traces_sample_rate=1.0,
            integrations=[
                sentry_sdk.integrations.fastapi.FastAPIIntegration(),
                sentry_sdk.integrations.sqlalchemy.SqlalchemyIntegration(),
            ],
            environment=settings.ENVIRONMENT,
            release=settings.APP_VERSION,
            enable_tracing=True,
        )
    else:
        print("Sentry DSN not found, skipping Sentry initialization.")
    # --- End Sentry ---

    yield
    # Shutdown logic
    print("Shutting down...")
    await async_engine.dispose()
    print("Database connection pool closed.")

# Create FastAPI app instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan # Enable the lifespan manager
)

# Add ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin).strip("/") for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# --- API Routers ---
app.include_router(health.router, prefix="/api/v1", tags=["Health Check"])

# Include FastAPI Users authentication routes (JWT and cookie)
app.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/api/v1/auth/cookie",
    tags=["Authentication"],
)
app.include_router(
    fastapi_users.get_auth_router(jwt_auth_backend),
    prefix="/api/v1/auth/jwt",
    tags=["Authentication"],
)

# Include FastAPI Users registration routes
app.include_router(
    fastapi_users.get_register_router(UserRead, UserCreate),
    prefix="/api/v1/auth",
    tags=["Authentication"],
)

# Include chart endpoints using the imported module
app.include_router(
    charts.router, # <<< USE THE IMPORTED MODULE
    prefix="/api/v1/charts",
    tags=["Charts"],
)

# Include FastAPI Users user management routes (e.g., /users/me)
app.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/api/v1/users",
    tags=["Users"],
)

@app.get("/", tags=["Root"])
async def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME}"}

# Add other routers as they are created
