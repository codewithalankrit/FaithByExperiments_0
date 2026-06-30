"""Recover a paid Razorpay order in the production faith_db database."""
import os
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

RAZORPAY_ORDER_ID = "order_T7os6ijTXfj1Nm"
RAZORPAY_PAYMENT_ID = "pay_T7osPeHa8ifgm2"
PRODUCTION_DB = "faith_db"

client = MongoClient(os.getenv("MONGODB_URI"))
db = client[PRODUCTION_DB]

order = db.orders.find_one({"razorpay_order_id": RAZORPAY_ORDER_ID})
if not order:
    raise SystemExit(f"Order {RAZORPAY_ORDER_ID} not found in {PRODUCTION_DB}")

pending = order["pending_user_data"]
existing = db.users.find_one({"email": pending["email"]})

if existing:
    user_id = existing["id"]
    print(f"User already exists: {user_id}")
    db.users.update_one(
        {"id": user_id},
        {
            "$set": {
                "is_subscribed": True,
                "subscription_type": order["plan_id"],
                "subscription_started_at": datetime.now(timezone.utc).isoformat(),
                "subscription_end_at": (
                    datetime.now(timezone.utc) + timedelta(days=365)
                ).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
        },
    )
else:
    user_id = str(uuid.uuid4())
    started = datetime.now(timezone.utc)
    end = started + timedelta(days=365)
    user_doc = {
        "id": user_id,
        "email": pending["email"],
        "name": pending["name"],
        "password_hash": pending["password_hash"],
        "is_admin": False,
        "is_subscribed": True,
        "subscription_type": order["plan_id"],
        "mobile": pending.get("mobile"),
        "subscription_started_at": started.isoformat(),
        "subscription_end_at": end.isoformat(),
        "created_at": started.isoformat(),
        "updated_at": started.isoformat(),
    }
    db.users.insert_one(user_doc)
    print(f"User created: {user_id}")

db.orders.update_one(
    {"razorpay_order_id": RAZORPAY_ORDER_ID},
    {
        "$set": {
            "status": "paid",
            "user_id": user_id,
            "razorpay_payment_id": RAZORPAY_PAYMENT_ID,
            "paid_at": datetime.now(timezone.utc).isoformat(),
        },
        "$unset": {"pending_user_data": ""},
    },
)

user = db.users.find_one({"id": user_id}, {"_id": 0, "email": 1, "is_subscribed": 1, "subscription_end_at": 1})
print("Production recovery complete:", user)
client.close()
