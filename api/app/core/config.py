from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import PostgresDsn, computed_field, Field, SecretStr, EmailStr
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "AstroTracker API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development") # e.g., development, staging, production
    APP_VERSION: str = Field(default="0.1.0") # Optional: Set app version

    # --- CORS ---
    BACKEND_CORS_ORIGINS: List[str] = Field(default=[
        "http://localhost:4321", # Astro dev server default
        "http://localhost",
        "http://127.0.0.1",
        # Add production frontend origin here later
    ])
    FRONTEND_URL: str = Field(default="http://localhost:4321") # Add Frontend URL setting

    # --- Database Settings ---
    # Define individual components or load full DSN
    POSTGRES_SERVER: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_USER: str = Field(default="postgres")
    POSTGRES_PASSWORD: SecretStr = Field(default="password")
    POSTGRES_DB: str = Field(default="astrotracker_db")
    # Set test DB to the correct existing database name
    POSTGRES_TEST_DB: str = Field(default="astrotracker_db")

    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        # Return as string, not PostgresDsn, for broader compatibility (e.g., Alembic)
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD.get_secret_value()}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )

    # Add computed field for the test database URL
    @computed_field
    @property
    def TEST_DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD.get_secret_value()}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_TEST_DB}"
        )

    # --- Security Settings ---
    # Generate a strong secret key, e.g., using: openssl rand -hex 32
    SECRET_KEY: SecretStr = Field(...)

    # --- Google OAuth Settings ---
    GOOGLE_OAUTH_CLIENT_ID: str | None = None
    GOOGLE_OAUTH_CLIENT_SECRET: str | None = None

    # --- Monitoring Settings ---
    SENTRY_DSN: SecretStr | None = Field(default=None)

    # --- Email Settings ---
    JWT_AUDIENCE: str = "fastapi-users:auth"
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: EmailStr | None = None
    EMAILS_FROM_NAME: str | None = None

    # Kerykeion settings
    KERYKEION_API_KEY: str | None = None

    # Configure Pydantic Settings to load from .env file
    # Case sensitivity matters for environment variables
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=True)

# Create a single instance of the settings
settings = Settings() 