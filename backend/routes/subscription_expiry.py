"""
Subscription expiry checking and notification service
Run this as a background task or scheduled job to check for expired subscriptions
"""
from fastapi import APIRouter, BackgroundTasks
from datetime import datetime, timezone
# Database getter will be set by server.py
_db = None

def set_db(database):
    global _db
    _db = database

def get_db():
    return _db

from services.notifications import send_subscription_expiry_notification

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


async def check_and_notify_expired_subscriptions():
    """Check for expired subscriptions and send notifications."""
    db = get_db()
    
    # Find all users with active subscriptions that have expired
    current_time = datetime.now(timezone.utc)
    
    # Find users where subscription_end_at is in the past and is_subscribed is still True
    expired_users = await db.users.find({
        "is_subscribed": True,
        "subscription_end_at": {"$lt": current_time.isoformat()}
    }).to_list(length=None)
    
    notification_results = []
    
    for user in expired_users:
        try:
            # Update user subscription status
            await db.users.update_one(
                {"id": user["id"]},
                {
                    "$set": {
                        "is_subscribed": False,
                        "updated_at": current_time.isoformat()
                    }
                }
            )
            
            # Send notification
            result = await send_subscription_expiry_notification(
                user.get("name", "User"),
                user.get("email", ""),
                user.get("mobile"),
                user.get("subscription_type", "monthly")
            )
            
            notification_results.append({
                "user_id": user["id"],
                "email": user.get("email"),
                "email_sent": result.get("email_sent", False),
                "sms_sent": result.get("sms_sent", False)
            })
            
        except Exception as e:
            print(f"Error processing expired subscription for user {user.get('id')}: {e}")
            notification_results.append({
                "user_id": user.get("id"),
                "error": str(e)
            })
    
    return {
        "checked_at": current_time.isoformat(),
        "expired_count": len(expired_users),
        "notifications": notification_results
    }


@router.post("/check-expiry")
async def check_expiry_endpoint(background_tasks: BackgroundTasks):
    """Endpoint to manually trigger expiry check (can be called by cron job)."""
    background_tasks.add_task(check_and_notify_expired_subscriptions)
    return {"message": "Expiry check initiated", "status": "processing"}


@router.get("/check-expiry-sync")
async def check_expiry_sync():
    """Synchronous endpoint to check expiry (for testing or direct calls)."""
    result = await check_and_notify_expired_subscriptions()
    return result
