#!/usr/bin/env python3
"""
Script to reset admin password in MongoDB.
Usage: python reset_admin_password.py <new_password>
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from pymongo import MongoClient
from utils.auth import hash_password

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "faith_db")
ADMIN_EMAIL = "admin@faithbyexperiments.com"


def reset_admin_password(new_password: str):
    """Reset admin password in MongoDB."""
    if not MONGODB_URI:
        print("Error: MONGODB_URI not found in .env file")
        sys.exit(1)
    
    if not new_password:
        print("Error: Please provide a new password")
        print("Usage: python reset_admin_password.py <new_password>")
        sys.exit(1)
    
    try:
        # Connect to MongoDB
        print("Connecting to MongoDB...")
        client = MongoClient(MONGODB_URI)
        db = client[DB_NAME]
        
        # Hash the new password
        print("Hashing new password...")
        password_hash = hash_password(new_password)
        
        # Update admin password
        print(f"Updating password for {ADMIN_EMAIL}...")
        result = db.users.update_one(
            {"email": ADMIN_EMAIL},
            {
                "$set": {
                    "password_hash": password_hash,
                    "updated_at": "2024-06-24T00:00:00+00:00"
                }
            }
        )
        
        if result.modified_count > 0:
            print("✓ Admin password updated successfully!")
            print(f"  Email: {ADMIN_EMAIL}")
            print(f"  New password: {new_password}")
        else:
            print(f"✗ Admin user not found with email: {ADMIN_EMAIL}")
            print("  Make sure the admin user exists in the database.")
        
        client.close()
        
    except Exception as e:
        print(f"✗ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python reset_admin_password.py <new_password>")
        sys.exit(1)
    
    new_password = sys.argv[1]
    reset_admin_password(new_password)
