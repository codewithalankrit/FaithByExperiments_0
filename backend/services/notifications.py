"""
Notification service for email and SMS
Supports subscription purchase and expiration notifications
"""
import os
import asyncio
from typing import Optional
import resend
from twilio.rest import Client as TwilioClient
from twilio.base.exceptions import TwilioRestException

# Email setup (Resend)
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://faithbyexperiments.com")

# SMS setup (Twilio)
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")

# Initialize Twilio client if configured
twilio_client = None
if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN:
    try:
        twilio_client = TwilioClient(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    except Exception as e:
        print(f"Twilio initialization error: {e}")


async def send_email(to: str, subject: str, html_content: str) -> bool:
    """Send email using Resend."""
    if not resend.api_key:
        print(f"[DEV MODE] Email would be sent to {to}")
        print(f"Subject: {subject}")
        print(f"Content: {html_content[:200]}...")
        return True
    
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html_content
        }
        await asyncio.to_thread(resend.Emails.send, params)
        return True
    except Exception as e:
        print(f"Email send error: {e}")
        return False


async def send_sms(to: str, message: str) -> bool:
    """Send SMS using Twilio."""
    if not twilio_client or not TWILIO_PHONE_NUMBER:
        print(f"[DEV MODE] SMS would be sent to {to}")
        print(f"Message: {message}")
        return True
    
    # Ensure phone number has country code format
    if not to.startswith('+'):
        # Assume Indian number if no country code
        if to.startswith('0'):
            to = '+91' + to[1:]
        else:
            to = '+91' + to
    
    try:
        message_obj = twilio_client.messages.create(
            body=message,
            from_=TWILIO_PHONE_NUMBER,
            to=to
        )
        print(f"SMS sent successfully. SID: {message_obj.sid}")
        return True
    except TwilioRestException as e:
        print(f"Twilio SMS error: {e}")
        return False
    except Exception as e:
        print(f"SMS send error: {e}")
        return False


async def send_subscription_purchase_notification(
    user_name: str,
    user_email: str,
    user_mobile: Optional[str],
    subscription_type: str,
    amount: str
) -> dict:
    """Send email and SMS notifications when subscription is purchased."""
    results = {"email_sent": False, "sms_sent": False}
    
    # Email content
    period_text = "monthly" if subscription_type == "monthly" else "yearly"
    email_subject = f"Welcome! Your {period_text.capitalize()} Subscription is Active - Faith by Experiments"
    
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
            .header {{ border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }}
            .content {{ background: #f9fafb; padding: 32px; border-radius: 8px; }}
            .highlight {{ background: white; padding: 20px; border-left: 3px solid #1a1a1a; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 40px; font-size: 14px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="font-size: 24px; margin: 0;">Subscription Confirmed</h1>
                <p style="margin: 8px 0 0 0; color: #6b7280;">Faith by Experiments</p>
            </div>
            <div class="content">
                <p>Dear {user_name},</p>
                <p>Thank you for subscribing to Faith by Experiments!</p>
                <div class="highlight">
                    <p style="margin: 0;"><strong>Subscription Details:</strong></p>
                    <p style="margin: 8px 0 0 0;">Plan: {period_text.capitalize()} Subscription</p>
                    <p style="margin: 8px 0 0 0;">Amount: ₹{amount}</p>
                    <p style="margin: 8px 0 0 0;">Status: Active</p>
                </div>
                <p>Your subscription is now active, and you have full access to all premium content, including:</p>
                <ul>
                    <li>Complete experimental frameworks</li>
                    <li>Structured practices designed to be tested over time</li>
                    <li>All current and newly published premium content</li>
                </ul>
                <p>You can access your content anytime by <a href="{FRONTEND_URL}">logging into your account</a>.</p>
                <p>If you have any questions, please don't hesitate to reach out.</p>
            </div>
            <div class="footer">
                <p>Faith by Experiments<br>Faith, tested in real life.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Send email
    results["email_sent"] = await send_email(user_email, email_subject, email_html)
    
    # SMS content
    if user_mobile:
        website_domain = FRONTEND_URL.replace("https://", "").replace("http://", "")
        sms_message = (
            f"Hi {user_name}, your {period_text} subscription to Faith by Experiments "
            f"is now active! Amount: ₹{amount}. Access all premium content at {website_domain}"
        )
        results["sms_sent"] = await send_sms(user_mobile, sms_message)
    
    return results


async def send_subscription_expiry_notification(
    user_name: str,
    user_email: str,
    user_mobile: Optional[str],
    subscription_type: str
) -> dict:
    """Send email and SMS notifications when subscription expires."""
    results = {"email_sent": False, "sms_sent": False}
    
    # Email content
    period_text = "monthly" if subscription_type == "monthly" else "yearly"
    email_subject = f"Your {period_text.capitalize()} Subscription Has Expired - Faith by Experiments"
    
    email_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #1a1a1a; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 40px 20px; }}
            .header {{ border-bottom: 2px solid #1a1a1a; padding-bottom: 20px; margin-bottom: 30px; }}
            .content {{ background: #f9fafb; padding: 32px; border-radius: 8px; }}
            .highlight {{ background: white; padding: 20px; border-left: 3px solid #dc2626; margin: 20px 0; }}
            .cta {{ text-align: center; margin: 30px 0; }}
            .cta-button {{ display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; }}
            .footer {{ text-align: center; margin-top: 40px; font-size: 14px; color: #6b7280; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="font-size: 24px; margin: 0;">Subscription Expired</h1>
                <p style="margin: 8px 0 0 0; color: #6b7280;">Faith by Experiments</p>
            </div>
            <div class="content">
                <p>Dear {user_name},</p>
                <p>We wanted to let you know that your {period_text} subscription to Faith by Experiments has expired.</p>
                <div class="highlight">
                    <p style="margin: 0;"><strong>Subscription Status:</strong></p>
                    <p style="margin: 8px 0 0 0;">Plan: {period_text.capitalize()} Subscription</p>
                    <p style="margin: 8px 0 0 0;">Status: Expired</p>
                </div>
                <p>Your access to premium content has been temporarily suspended. To continue your journey of faith through experimentation, please renew your subscription.</p>
                <div class="cta">
                    <a href="{FRONTEND_URL}/subscribe" class="cta-button">Renew Subscription</a>
                </div>
                <p>If you have any questions or need assistance, please don't hesitate to reach out.</p>
            </div>
            <div class="footer">
                <p>Faith by Experiments<br>Faith, tested in real life.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Send email
    results["email_sent"] = await send_email(user_email, email_subject, email_html)
    
    # SMS content
    if user_mobile:
        website_domain = FRONTEND_URL.replace("https://", "").replace("http://", "")
        sms_message = (
            f"Hi {user_name}, your {period_text} subscription to Faith by Experiments "
            f"has expired. Renew now to continue accessing premium content. Visit {website_domain}/subscribe"
        )
        results["sms_sent"] = await send_sms(user_mobile, sms_message)
    
    return results
