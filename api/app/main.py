import uuid
from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from contextlib import asynccontextmanager
import sentry_sdk
from starlette.datastructures import URL
from starlette.responses import HTMLResponse
# Removed unused imports

from app.core.config import settings
from app.db.session import async_engine

# Import the fastapi_users instance from its new location
from app.db.user_manager import fastapi_users
# Import the auth_backend and google_oauth_client here
from app.core.security import auth_backend, jwt_auth_backend, google_oauth_client # Import google_oauth_client
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
# Remove the separate logout router code - logout is included in the auth router above
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

# Include FastAPI Users OAuth routes if Google OAuth is configured
if google_oauth_client: # Only include router if client is configured
    
    @app.get("/api/v1/auth/google/authorize")
    async def google_authorize():
        """Generate Google OAuth authorization URL that redirects to frontend."""
        # Generate the authorization URL pointing to frontend callback
        authorization_url = await google_oauth_client.get_authorization_url(
            redirect_uri=f"{settings.FRONTEND_URL}/auth/callback",
        )
        
        return {"authorization_url": authorization_url}
    
    @app.post("/api/v1/auth/google/callback")
    async def google_callback(request: Request, user_manager = Depends(get_user_manager)):
        """Handle OAuth code from frontend and authenticate user."""
        try:
            # Get the JSON body with the authorization code
            body = await request.json()
            code = body.get("code")
            redirect_uri = body.get("redirect_uri")
            
            if not code:
                raise HTTPException(status_code=400, detail="Authorization code missing")
            
            # Exchange the code for an access token using Google OAuth client
            access_token = await google_oauth_client.get_access_token(code, redirect_uri)
            
            # Get user info from Google using the access token
            user_info = await google_oauth_client.get_id_email(access_token["access_token"])
            user_email = user_info[1]  # email is the second element
            
            # Get or create user via FastAPI Users user manager
            try:
                # Try to get existing user
                user = await user_manager.get_by_email(user_email)
            except Exception:
                # User doesn't exist, create new user
                user_create = UserCreate(
                    email=user_email,
                    password="",  # OAuth users don't need password
                    is_verified=True  # Google OAuth users are pre-verified
                )
                user = await user_manager.create(user_create, safe=False)
            
            # Login the user (set cookie)
            response = await auth_backend.login(auth_backend.get_strategy(), user)
            
            return response
            
        except Exception as e:
            print(f"OAuth callback error: {e}")
            raise HTTPException(status_code=400, detail=f"OAuth authentication failed: {str(e)}")

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
