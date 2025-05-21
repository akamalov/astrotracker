from typing import Dict, Any
from app.models.user import User # Assuming your User model path
from app.core.config import settings # To get FRONTEND_URL

async def send_password_reset_email(user: User, token: str):
    reset_url = f"{settings.FRONTEND_URL}/auth/reset-password?token={token}"
    email_content = f"""
    Hello {user.email},

    Someone requested a password reset for your account.
    If this was you, please click the link below to reset your password:
    {reset_url}

    If you did not request this, please ignore this email.

    This token will expire shortly.

    Thanks,
    The {settings.PROJECT_NAME} Team
    """
    print("---- PASSWORD RESET EMAIL ----")
    print(f"To: {user.email}")
    print(f"Subject: Reset Your Password - {settings.PROJECT_NAME}")
    print(f"Body:\n{email_content}")
    print(f"Token to use in reset URL: {token}") # For easier testing
    print("---------------------------")

async def send_verification_email(user: User, token: str):
    verify_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"
    email_content = f"""
    Hello {user.email},

    Thank you for registering with {settings.PROJECT_NAME}!
    Please click the link below to verify your email address:
    {verify_url}

    If you did not register for this account, please ignore this email.

    Thanks,
    The {settings.PROJECT_NAME} Team
    """
    print("---- EMAIL VERIFICATION EMAIL ----")
    print(f"To: {user.email}")
    print(f"Subject: Verify Your Email - {settings.PROJECT_NAME}")
    print(f"Body:\n{email_content}")
    print(f"Token to use in verification URL: {token}") # For easier testing
    print("-------------------------------")

# In a real application, replace print with actual email sending logic 