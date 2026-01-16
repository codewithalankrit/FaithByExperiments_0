from fastapi import APIRouter, HTTPException, Depends, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional
from datetime import datetime, timezone

from models.user import UserCreate, UserLogin, UserInDB, UserResponse, TokenResponse
from utils.auth import hash_password, verify_password, create_access_token, decode_token

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Admin email - users with this email get admin privileges
ADMIN_EMAIL = "admin@faithbyexperiments.com"

# Database will be injected from server.py
_db = None

def set_db(database):
    global _db
    _db = database

def get_db() -> AsyncIOMotorDatabase:
    return _db


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> Optional[UserResponse]:
    """Get current user from JWT token."""
    if not authorization:
        return None
    
    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
    except ValueError:
        return None
    
    payload = decode_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    db = get_db()
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user_doc:
        return None
    
    return UserResponse(
        id=user_doc["id"],
        email=user_doc["email"],
        name=user_doc["name"],
        is_admin=user_doc.get("is_admin", False),
        is_subscribed=user_doc.get("is_subscribed", False),
        subscription_type=user_doc.get("subscription_type")
    )


async def require_auth(
    authorization: Optional[str] = Header(None)
) -> UserResponse:
    """Require authenticated user."""
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(
    authorization: Optional[str] = Header(None)
) -> UserResponse:
    """Require admin user."""
    user = await get_current_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate):
    """Register a new user."""
    db = get_db()
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    is_admin = user_data.email.lower() == ADMIN_EMAIL.lower()
    
    user = UserInDB(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        is_admin=is_admin,
        is_subscribed=False
    )
    
    # Convert to dict for MongoDB
    user_dict = user.model_dump()
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    user_dict["updated_at"] = user_dict["updated_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user.id, "email": user.email})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            is_admin=user.is_admin,
            is_subscribed=user.is_subscribed,
            subscription_type=user.subscription_type
        )
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user and return JWT token."""
    db = get_db()
    
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    access_token = create_access_token(data={"sub": user_doc["id"], "email": user_doc["email"]})
    
    return TokenResponse(
        access_token=access_token,
        user=UserResponse(
            id=user_doc["id"],
            email=user_doc["email"],
            name=user_doc["name"],
            is_admin=user_doc.get("is_admin", False),
            is_subscribed=user_doc.get("is_subscribed", False),
            subscription_type=user_doc.get("subscription_type")
        )
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(require_auth)):
    """Get current user info."""
    return current_user


@router.get("/check-user/{email}")
async def check_user_by_email(email: str, admin_user: UserResponse = Depends(require_admin)):
    """Check user details by email (admin only)."""
    db = get_db()
    user_doc = await db.users.find_one({"email": email}, {"_id": 0, "password_hash": 0})
    
    if not user_doc:
        raise HTTPException(status_code=404, detail=f"User with email '{email}' not found")
    
    return user_doc


@router.post("/subscribe")
async def mock_subscribe(
    current_user: UserResponse = Depends(require_auth)
):
    """Mock subscription endpoint - marks user as subscribed."""
    db = get_db()
    
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$set": {
                "is_subscribed": True,
                "subscription_type": "monthly",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    return {"message": "Subscription activated", "is_subscribed": True}
