from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import asyncio
import resend

router = APIRouter(prefix="/contact", tags=["Contact"])

# Resend API setup
resend.api_key = os.environ.get("RESEND_API_KEY", "")
RECIPIENT_EMAIL = "ajitkumar.faithbyexperiments@gmail.com"
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")


class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    whatsapp: Optional[str] = None
    message: str


async def send_contact_email(data: ContactFormRequest):
    """Send contact form email using Resend."""
    whatsapp_section = f"<p><strong>WhatsApp:</strong> {data.whatsapp}</p>" if data.whatsapp else ""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
            .header {{ border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }}
            .content {{ background: #f9fafb; padding: 32px; border-radius: 8px; }}
            .field {{ margin-bottom: 16px; }}
            .field strong {{ color: #374151; }}
            .message {{ background: white; padding: 20px; border-left: 3px solid #1a1a1a; margin-top: 20px; }}
            .footer {{ text-align: center; margin-top: 40px; font-size: 14px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="font-size: 24px; margin: 0;">New Contact Inquiry</h1>
                <p style="margin: 8px 0 0 0; color: #6b7280;">Faith by Experiments - In-Person Meeting Request</p>
            </div>
            <div class="content">
                <div class="field">
                    <p><strong>Name:</strong> {data.name}</p>
                </div>
                <div class="field">
                    <p><strong>Email:</strong> <a href="mailto:{data.email}">{data.email}</a></p>
                </div>
                {whatsapp_section}
                <div class="message">
                    <p><strong>Message:</strong></p>
                    <p style="white-space: pre-wrap;">{data.message}</p>
                </div>
            </div>
            <div class="footer">
                <p>This inquiry was submitted via the Faith by Experiments website.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    params = {
        "from": SENDER_EMAIL,
        "to": [RECIPIENT_EMAIL],
        "subject": f"New Inquiry from {data.name} - Faith by Experiments",
        "html": html_content,
        "reply_to": data.email
    }
    
    try:
        email_response = await asyncio.to_thread(resend.Emails.send, params)
        return email_response
    except Exception as e:
        raise Exception(f"Failed to send email: {str(e)}")


@router.post("/send")
async def send_contact_form(data: ContactFormRequest):
    """Send contact form inquiry."""
    
    # Check if Resend is configured
    if not resend.api_key:
        # Store locally for testing when email is not configured
        print(f"[DEV MODE] Contact form received:")
        print(f"  Name: {data.name}")
        print(f"  Email: {data.email}")
        print(f"  WhatsApp: {data.whatsapp or 'Not provided'}")
        print(f"  Message: {data.message}")
        return {
            "success": True,
            "message": "Thank you for your inquiry. We will contact you soon.",
            "dev_mode": True
        }
    
    # Send email via Resend
    try:
        await send_contact_email(data)
        return {
            "success": True,
            "message": "Thank you for your inquiry. We will contact you soon."
        }
    except Exception as e:
        print(f"Email send error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send inquiry. Please try again later.")
