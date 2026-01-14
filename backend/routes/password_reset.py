from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, timezone, timedelta
import secrets
import asyncio
import os
import resend

router = APIRouter(prefix="/password-reset", tags=["Password Reset"])

# Resend API setup
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

# Database will be injected from server.py
_db = None

def set_db(database):
    global _db
    _db = database

def get_db():
    return _db


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


def generate_reset_token():
    """Generate a secure random token."""
    return secrets.token_urlsafe(32)


async def send_reset_email(email: str, token: str, name: str):
    """Send password reset email using Resend."""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
            .header {{ text-align: center; margin-bottom: 40px; }}
            .content {{ background: #f9fafb; padding: 32px; border-radius: 8px; }}
            .button {{ display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 40px; font-size: 14px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="font-size: 24px; margin: 0;">Faith by Experiments</h1>
            </div>
            <div class="content">
                <p>Hello {name},</p>
                <p>We received a request to reset your password. Click the button below to create a new password:</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </p>
                <p>Or copy and paste this link into your browser:</p>
                <p style="word-break: break-all; font-size: 14px; color: #6b7280;">{reset_link}</p>
                <p>This link will expire in 1 hour.</p>
                <p>If you didn't request this password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>Faith by Experiments<br>Faith, tested in real life.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [email],
        "subject": "Reset Your Password - Faith by Experiments",
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        return email_response
    except Exception as e:
        raise Exception(f"Failed to send email: {str(e)}")


@router.post("/request")
async def request_password_reset(request: PasswordResetRequest):
    """Request a password reset email."""
    db = get_db()
    
    # Find user by email
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    
    if not user:
        # Don't reveal if email exists - return success anyway
        return {"message": "If an account with that email exists, we've sent a password reset link."}
    
    # Generate reset token
    token = generate_reset_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token in database
    reset_doc = {
        "user_id": user["id"],
        "email": request.email,
        "token": token,
        "expires_at": expires_at.isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.password_resets.insert_one(reset_doc)
    
    # Check if Resend API key is configured
    if not resend.api_key:
        # Return token for manual testing (development mode)
        return {
            "message": "Password reset requested. (Email service not configured - token provided for testing)",
            "dev_token": token
        }
    
    # Send reset email
    try:
        await send_reset_email(request.email, token, user.get("name", "User"))
        return {"message": "If an account with that email exists, we've sent a password reset link."}
    except Exception as e:
        # Log error but don't expose to user
        print(f"Email send error: {e}")
        return {"message": "If an account with that email exists, we've sent a password reset link."}


@router.post("/confirm")
async def confirm_password_reset(request: PasswordResetConfirm):
    """Confirm password reset with token and new password."""
    db = get_db()
    
    # Find valid reset token
    reset_doc = await db.password_resets.find_one({
        "token": request.token,
        "used": False
    }, {"_id": 0})
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check if token has expired
    expires_at = datetime.fromisoformat(reset_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Hash new password
    from utils.auth import hash_password
    new_password_hash = hash_password(request.new_password)
    
    # Update user password
    await db.users.update_one(
        {"id": reset_doc["user_id"]},
        {
            "$set": {
                "password_hash": new_password_hash,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password has been reset successfully. You can now log in with your new password."}


@router.get("/validate/{token}")
async def validate_reset_token(token: str):
    """Validate if a reset token is still valid."""
    db = get_db()
    
    reset_doc = await db.password_resets.find_one({
        "token": token,
        "used": False
    }, {"_id": 0})
    
    if not reset_doc:
        return {"valid": False, "message": "Invalid or expired reset token"}
    
    # Check if token has expired
    expires_at = datetime.fromisoformat(reset_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        return {"valid": False, "message": "Reset token has expired"}
    
    return {"valid": True, "email": reset_doc["email"]}
