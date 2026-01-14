from fastapi import FastAPI, APIRouter, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
uri = os.getenv("MONGODB_URI") + "&tls=true"
client = AsyncIOMotorClient(uri)
db = client[os.getenv("DB_NAME", "faith_db")]

# Create the main app
app = FastAPI(title="Faith by Experiments API")

# Serve uploads directory as static files
from fastapi.staticfiles import StaticFiles
from pathlib import Path
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS middleware - MUST be added before routers
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routes and set database
from routes import auth, posts, password_reset, payments, contact, subscription_expiry

# Set database for route modules
auth.set_db(db)
posts.get_db = auth.get_db  # Share the same db getter
password_reset.set_db(db)
payments.set_db(db)
subscription_expiry.set_db(db)

# Create API router
api_router = APIRouter(prefix="/api")

# Include route modules
api_router.include_router(auth.router)
api_router.include_router(posts.router)
api_router.include_router(password_reset.router)
api_router.include_router(payments.router)
api_router.include_router(contact.router)
api_router.include_router(subscription_expiry.router)


@api_router.get("/")
async def root():
    return {"message": "Faith by Experiments API", "status": "running"}

# Image upload endpoint
from fastapi import HTTPException
from upload_utils import save_upload_file

@api_router.post("/upload-image")
async def upload_image(image: UploadFile = File(...)):
    try:
        filename = await save_upload_file(image)
        file_url = f"/uploads/{filename}"
        return {"success": True, "url": file_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")



@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}


@api_router.post("/seed")
async def seed_database():
    """Seed the database with initial data."""
    from datetime import datetime, timezone
    from utils.auth import hash_password
    import uuid
    
    # Check if already seeded
    admin_exists = await db.users.find_one({"email": "admin@faithbyexperiments.com"})
    
    if not admin_exists:
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "email": "admin@faithbyexperiments.com",
            "name": "Admin",
            "password_hash": hash_password("admin123"),
            "is_admin": True,
            "is_subscribed": True,
            "subscription_type": "yearly",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
    
    # Check if posts exist
    posts_exist = await db.posts.find_one({})
    
    if not posts_exist:
        # Create initial post
        initial_post = {
            "id": "faith-experiments-intro",
            "title": "Introduction to Faith by Experiments",
            "slug": "introduction-to-faith-by-experiments",
            "excerpt": "Understanding the experimental approach to faith. This foundational piece explores why traditional belief systems fail educated minds and how treating faith as a hypothesis opens new possibilities.",
            "content": """Faith by Experiments is not about abandoning reason for belief, nor is it about dismissing the transcendent in favor of cold rationality. It is about finding a third path—one that honors both the rigor of scientific inquiry and the depth of spiritual experience.

For too long, we have been told that faith and reason are incompatible. That to believe is to suspend critical thinking, and to think critically is to abandon belief. This false dichotomy has left countless educated, thoughtful people spiritually homeless—unable to accept the simplistic narratives of traditional religion, yet unsatisfied with the flatness of pure materialism.

What if there were another way? What if we could approach faith the way a scientist approaches a hypothesis—with curiosity, rigor, and openness to revision? What if we could treat spiritual practices not as arbitrary rituals, but as experiments in consciousness, worthy of careful observation and honest evaluation?

This is the invitation of Faith by Experiments. We propose a framework where belief is not demanded but discovered, where practices are tested not just inherited, and where the measure of any spiritual claim is not its antiquity or authority, but its actual effect on the quality of our awareness and the depth of our engagement with life.

The methodology is simple but demanding: treat every spiritual proposition as a hypothesis. Design experiments to test it. Observe the results with honesty. Revise your understanding based on evidence. This is not skepticism masquerading as spirituality—it is genuine inquiry that takes both reason and experience seriously.""",
            "is_premium": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.posts.insert_one(initial_post)
    
    return {"message": "Database seeded successfully"}


# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    """Initialize database indexes on startup."""
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.posts.create_index("id", unique=True)
    await db.posts.create_index("slug", unique=True)
    logger.info("Database indexes created")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
