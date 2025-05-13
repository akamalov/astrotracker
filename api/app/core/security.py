# Note: AccessTokenDatabase and related imports are commented out as we are using JWT strategy
# from fastapi_users.authentication.strategy.db import AccessTokenDatabase, DatabaseStrategy
# from app.db.models import AccessToken # Will be created later
# from app.db.user_manager import get_access_token_db # Will be created later

from fastapi_users.authentication import (
    BearerTransport, JWTStrategy, AuthenticationBackend, CookieTransport
)
from fastapi_users.jwt import SecretType
from httpx_oauth.clients.google import GoogleOAuth2

from app.core.config import settings

# --- Secret Key --- 
# Load from environment variables via settings
# Ensure SECRET_KEY is set in your .env file
if not hasattr(settings, 'SECRET_KEY') or not settings.SECRET_KEY:
    raise ValueError("SECRET_KEY not configured in environment variables.")

SECRET: SecretType = settings.SECRET_KEY.get_secret_value() # Use .get_secret_value() for SecretStr

# --- Google OAuth Client --- 
# Ensure GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are set in .env
google_oauth_client = None

# Define the BACKEND callback URL that Google MUST redirect to
# This MUST match exactly what is in Google Cloud Console
# BACKEND_CALLBACK_URL = "http://localhost:8000/api/v1/auth/google/callback"

# Define the FRONTEND callback URL (where backend redirects user AFTER success)
FRONTEND_CALLBACK_URL = f"{settings.FRONTEND_URL}/auth/google/callback"

if settings.GOOGLE_OAUTH_CLIENT_ID and settings.GOOGLE_OAUTH_CLIENT_SECRET:
    google_oauth_client = GoogleOAuth2(
        settings.GOOGLE_OAUTH_CLIENT_ID,
        settings.GOOGLE_OAUTH_CLIENT_SECRET.get_secret_value(),
        # Explicitly tell httpx-oauth what redirect_uri to use when talking to Google
        # This MUST match the one registered in Google Cloud Console
        # REMOVED AGAIN: redirect_uri=BACKEND_CALLBACK_URL 
    )
else:
    print("Warning: Google OAuth credentials not configured, Google login will be disabled.")

# --- JWT Strategy --- 
def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=3600) # Example: 1 hour token lifetime

# --- Cookie Transport --- 
# Define cookie name (optional, defaults to fastapiusersauth)
# Set secure=False for HTTP during development if needed (not recommended for prod)
# Ensure samesite='lax' or 'none' (with secure=True) if frontend/backend are different domains
cookie_transport = CookieTransport(
    cookie_name="fastapiusersauth", 
    cookie_max_age=3600, 
    cookie_secure=False, # Set False for localhost HTTP
    cookie_domain="localhost" # Explicitly set domain for cross-port access
)

# --- Bearer Transport (for JWT login endpoint) ---
bearer_transport = BearerTransport(tokenUrl="/api/v1/auth/jwt/login")

# --- Authentication Backends ---
auth_backend = AuthenticationBackend(
    name="cookie",
    transport=cookie_transport,
    get_strategy=get_jwt_strategy,
)

jwt_auth_backend = AuthenticationBackend(
    name="jwt",
    transport=bearer_transport,
    get_strategy=get_jwt_strategy,
)

auth_backends = [auth_backend, jwt_auth_backend]

# --- FastAPI Users Instance (To be created in main or user endpoint module) ---
# Example (do not place here, but shows usage of auth_backend):
# fastapi_users = FastAPIUsers[
#     User, uuid.UUID
# ](
#     get_user_manager, # This dependency needs to be created
#     [auth_backend], 
# )

# --- Database Strategy (Optional, if storing access tokens) ---
# This is more complex and often not needed if using stateless JWT.
# Uncomment and adapt if you choose to store tokens in the DB.

# def get_database_strategy(
#     access_token_db: AccessTokenDatabase[AccessToken] = Depends(get_access_token_db),
# ) -> DatabaseStrategy:
#     return DatabaseStrategy(access_token_db, lifetime_seconds=3600)
# 
# auth_db_backend = AuthenticationBackend(
#     name="db",
#     transport=bearer_transport,
#     get_strategy=get_database_strategy,
# ) 