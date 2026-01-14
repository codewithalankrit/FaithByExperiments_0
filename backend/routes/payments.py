"""
Razorpay Payment Integration for Faith by Experiments

IMPORTANT: This module requires Razorpay API keys to function.
Set these environment variables in /app/backend/.env:
- RAZORPAY_KEY_ID=your_key_id
- RAZORPAY_KEY_SECRET=your_key_secret

Get your keys from: https://dashboard.razorpay.com/app/keys
"""

from fastapi import APIRouter, HTTPException, Depends, Header, BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
import os
import uuid

router = APIRouter(prefix="/payments", tags=["Payments"])

# Razorpay configuration
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")

# Check if Razorpay is configured
RAZORPAY_CONFIGURED = bool(RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)

# Initialize Razorpay client only if configured
razorpay_client = None
if RAZORPAY_CONFIGURED:
    try:
        import razorpay
        razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    except ImportError:
        print("Razorpay SDK not installed. Run: pip install razorpay")

# Database will be injected from server.py
_db = None

def set_db(database):
    global _db
    _db = database

def get_db():
    return _db


# Subscription plans (amounts in paise - multiply by 100)
PLANS = {
    "monthly": {
        "name": "Monthly Subscription",
        "amount": 49900,  # ₹499.00
        "currency": "INR",
        "period": "month"
    },
    "yearly": {
        "name": "Yearly Subscription",
        "amount": 499900,  # ₹4,999.00
        "currency": "INR",
        "period": "year"
    }
}


def calculate_subscription_end_date(subscription_type: str, start_date: datetime = None) -> datetime:
    """Calculate subscription end date based on subscription type."""
    if start_date is None:
        start_date = datetime.now(timezone.utc)
    
    if subscription_type == "monthly":
        return start_date + timedelta(days=30)
    elif subscription_type == "yearly":
        return start_date + timedelta(days=365)
    else:
        # Default to 30 days if unknown
        return start_date + timedelta(days=30)


class CreateOrderRequest(BaseModel):
    plan_id: str  # "monthly" or "yearly"


class CreatePendingSignupOrderRequest(BaseModel):
    plan_id: str
    name: str
    email: str
    password: str
    mobile: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.get("/config")
async def get_payment_config():
    """Get Razorpay configuration for frontend."""
    return {
        "configured": RAZORPAY_CONFIGURED,
        "key_id": RAZORPAY_KEY_ID if RAZORPAY_CONFIGURED else None,
        "plans": PLANS
    }


@router.post("/create-order")
async def create_order(
    request: CreateOrderRequest,
    authorization: Optional[str] = Header(None)
):
    """Create a Razorpay order for subscription payment (for existing users)."""
    if not RAZORPAY_CONFIGURED:
        raise HTTPException(
            status_code=503, 
            detail="Payment system not configured. Please contact support."
        )
    
    if request.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    
    plan = PLANS[request.plan_id]
    
    # Get current user
    from routes.auth import get_current_user
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    
    try:
        # Create Razorpay order
        order_data = {
            "amount": plan["amount"],
            "currency": plan["currency"],
            "receipt": f"sub_{user.id}_{request.plan_id}",
            "payment_capture": 1,
            "notes": {
                "user_id": user.id,
                "plan_id": request.plan_id,
                "user_email": user.email
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Store order in database
        order_doc = {
            "id": str(uuid.uuid4()),
            "razorpay_order_id": razorpay_order["id"],
            "user_id": user.id,
            "plan_id": request.plan_id,
            "amount": plan["amount"],
            "currency": plan["currency"],
            "status": "created",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.orders.insert_one(order_doc)
        
        return {
            "order_id": razorpay_order["id"],
            "amount": plan["amount"],
            "currency": plan["currency"],
            "key_id": RAZORPAY_KEY_ID,
            "plan_name": plan["name"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.post("/create-pending-signup-order")
async def create_pending_signup_order(request: CreatePendingSignupOrderRequest):
    """Create a Razorpay order for new user signup (before account creation)."""
    if not RAZORPAY_CONFIGURED:
        raise HTTPException(
            status_code=503, 
            detail="Payment system not configured. Please contact support."
        )
    
    if request.plan_id not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan selected")
    
    plan = PLANS[request.plan_id]
    db = get_db()
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": request.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    try:
        # Create temporary order ID for pending signup
        pending_order_id = str(uuid.uuid4())
        
        # Create Razorpay order
        order_data = {
            "amount": plan["amount"],
            "currency": plan["currency"],
            "receipt": f"pending_signup_{pending_order_id}",
            "payment_capture": 1,
            "notes": {
                "pending_signup": True,
                "name": request.name,
                "email": request.email,
                "plan_id": request.plan_id
            }
        }
        
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        # Store pending signup order in database (with encrypted password)
        from routes.auth import hash_password
        order_doc = {
            "id": pending_order_id,
            "razorpay_order_id": razorpay_order["id"],
            "user_id": None,  # Will be set after account creation
            "plan_id": request.plan_id,
            "amount": plan["amount"],
            "currency": plan["currency"],
            "status": "pending_signup",
            "pending_user_data": {
                "name": request.name,
                "email": request.email,
                "password_hash": hash_password(request.password),
                "mobile": request.mobile
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.orders.insert_one(order_doc)
        
        return {
            "order_id": razorpay_order["id"],
            "amount": plan["amount"],
            "currency": plan["currency"],
            "key_id": RAZORPAY_KEY_ID,
            "plan_name": plan["name"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create order: {str(e)}")


@router.post("/verify")
async def verify_payment(
    request: VerifyPaymentRequest,
    background_tasks: BackgroundTasks,
    authorization: Optional[str] = Header(None)
):
    """Verify Razorpay payment signature and activate subscription. Creates user account if pending signup."""
    if not RAZORPAY_CONFIGURED:
        raise HTTPException(status_code=503, detail="Payment system not configured")
    
    db = get_db()
    
    try:
        # Verify signature
        params_dict = {
            'razorpay_order_id': request.razorpay_order_id,
            'razorpay_payment_id': request.razorpay_payment_id,
            'razorpay_signature': request.razorpay_signature
        }
        
        razorpay_client.utility.verify_payment_signature(params_dict)
        
        # Get order from database
        order = await db.orders.find_one(
            {"razorpay_order_id": request.razorpay_order_id},
            {"_id": 0}
        )
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Check if this is a pending signup (new user registration)
        if order.get("status") == "pending_signup" and order.get("pending_user_data"):
            # Create user account after payment verification
            from routes.auth import ADMIN_EMAIL, create_access_token
            from models.user import UserInDB, UserResponse
            import uuid as uuid_lib
            
            pending_data = order["pending_user_data"]
            is_admin = pending_data["email"].lower() == ADMIN_EMAIL.lower()
            
            user_id = str(uuid_lib.uuid4())
            subscription_started_at = datetime.now(timezone.utc)
            subscription_end_at = calculate_subscription_end_date(order["plan_id"], subscription_started_at)
            
            user = UserInDB(
                id=user_id,
                email=pending_data["email"],
                name=pending_data["name"],
                password_hash=pending_data["password_hash"],
                is_admin=is_admin,
                is_subscribed=True,  # Set to True since payment is verified
                subscription_type=order["plan_id"],
                mobile=pending_data.get("mobile"),
                subscription_started_at=subscription_started_at,
                subscription_end_at=subscription_end_at
            )
            
            # Convert to dict for MongoDB
            user_dict = user.model_dump()
            user_dict["created_at"] = user_dict["created_at"].isoformat()
            user_dict["updated_at"] = user_dict["updated_at"].isoformat()
            user_dict["subscription_started_at"] = subscription_started_at.isoformat()
            user_dict["subscription_end_at"] = subscription_end_at.isoformat()
            
            await db.users.insert_one(user_dict)
            
            # Send notification in background
            from services.notifications import send_subscription_purchase_notification
            plan = PLANS[order["plan_id"]]
            amount_str = str(plan["amount"] // 100)  # Convert paise to rupees
            background_tasks.add_task(
                send_subscription_purchase_notification,
                user.name,
                user.email,
                user.mobile,
                order["plan_id"],
                amount_str
            )
            
            # Update order with user_id
            await db.orders.update_one(
                {"razorpay_order_id": request.razorpay_order_id},
                {
                    "$set": {
                        "status": "paid",
                        "user_id": user_id,
                        "razorpay_payment_id": request.razorpay_payment_id,
                        "paid_at": datetime.now(timezone.utc).isoformat()
                    },
                    "$unset": {"pending_user_data": ""}
                }
            )
            
            # Create token for new user
            access_token = create_access_token(data={"sub": user_id, "email": user.email})
            
            return {
                "success": True,
                "message": "Payment verified and account created!",
                "subscription_type": order["plan_id"],
                "access_token": access_token,
                "user": UserResponse(
                    id=user_id,
                    email=user.email,
                    name=user.name,
                    is_admin=user.is_admin,
                    is_subscribed=user.is_subscribed,
                    subscription_type=user.subscription_type
                ).model_dump()
            }
        
        else:
            # Existing user - verify they own this order
            from routes.auth import get_current_user
            user = await get_current_user(authorization)
            if not user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            if order.get("user_id") and order["user_id"] != user.id:
                raise HTTPException(status_code=403, detail="Order does not belong to user")
            
            # Update order status
            await db.orders.update_one(
                {"razorpay_order_id": request.razorpay_order_id},
                {
                    "$set": {
                        "status": "paid",
                        "razorpay_payment_id": request.razorpay_payment_id,
                        "paid_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Calculate subscription end date
            subscription_started_at = datetime.now(timezone.utc)
            subscription_end_at = calculate_subscription_end_date(order["plan_id"], subscription_started_at)
            
            # Activate user subscription
            await db.users.update_one(
                {"id": user.id},
                {
                    "$set": {
                        "is_subscribed": True,
                        "subscription_type": order["plan_id"],
                        "subscription_started_at": subscription_started_at.isoformat(),
                        "subscription_end_at": subscription_end_at.isoformat(),
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
            
            # Get updated user data for notification
            updated_user = await db.users.find_one({"id": user.id}, {"_id": 0})
            
            # Send notification in background
            from services.notifications import send_subscription_purchase_notification
            plan = PLANS[order["plan_id"]]
            amount_str = str(plan["amount"] // 100)  # Convert paise to rupees
            background_tasks.add_task(
                send_subscription_purchase_notification,
                updated_user.get("name", user.name),
                updated_user.get("email", user.email),
                updated_user.get("mobile"),
                order["plan_id"],
                amount_str
            )
            
            return {
                "success": True,
                "message": "Payment verified and subscription activated!",
                "subscription_type": order["plan_id"]
            }
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment verification failed: {str(e)}")


@router.get("/orders")
async def get_user_orders(
    authorization: Optional[str] = Header(None)
):
    """Get all orders for the current user."""
    from routes.auth import get_current_user
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    db = get_db()
    orders = await db.orders.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return orders
