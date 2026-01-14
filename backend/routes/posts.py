from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from datetime import datetime, timezone

from models.post import PostCreate, PostUpdate, PostInDB, PostResponse, PostPreviewResponse, generate_slug
from models.user import UserResponse
from routes.auth import get_current_user, require_admin, get_db

router = APIRouter(prefix="/posts", tags=["Posts"])


@router.get("", response_model=List[PostPreviewResponse])
async def get_all_posts(
    authorization: Optional[str] = Header(None)
):
    """Get all posts. Returns full content for subscribers, preview for others."""
    db = get_db()
    current_user = await get_current_user(authorization)
    is_subscribed = current_user and current_user.is_subscribed
    
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    result = []
    for post in posts:
        if is_subscribed or not post.get("is_premium", True):
            # Full access
            result.append(PostPreviewResponse(
                id=post["id"],
                title=post["title"],
                slug=post["slug"],
                excerpt=post["excerpt"],
                preview_content=post["content"],
                is_premium=post.get("is_premium", True),
                created_at=post["created_at"],
                updated_at=post["updated_at"]
            ))
        else:
            # Preview only
            preview = post["content"][:500] + "..." if len(post["content"]) > 500 else post["content"]
            result.append(PostPreviewResponse(
                id=post["id"],
                title=post["title"],
                slug=post["slug"],
                excerpt=post["excerpt"],
                preview_content=preview,
                is_premium=post.get("is_premium", True),
                created_at=post["created_at"],
                updated_at=post["updated_at"]
            ))
    
    return result


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    authorization: Optional[str] = Header(None)
):
    """Get a single post by ID or slug."""
    db = get_db()
    
    # Try to find by ID first, then by slug
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        post = await db.posts.find_one({"slug": post_id}, {"_id": 0})
    
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    current_user = await get_current_user(authorization)
    is_subscribed = current_user and current_user.is_subscribed
    
    # If premium content and user not subscribed, return preview
    if post.get("is_premium", True) and not is_subscribed:
        preview = post["content"][:500] + "..." if len(post["content"]) > 500 else post["content"]
        return PostResponse(
            id=post["id"],
            title=post["title"],
            slug=post["slug"],
            excerpt=post["excerpt"],
            content=preview,
            is_premium=post.get("is_premium", True),
            created_at=post["created_at"],
            updated_at=post["updated_at"]
        )
    
    return PostResponse(
        id=post["id"],
        title=post["title"],
        slug=post["slug"],
        excerpt=post["excerpt"],
        content=post["content"],
        is_premium=post.get("is_premium", True),
        created_at=post["created_at"],
        updated_at=post["updated_at"]
    )


# Admin endpoints
@router.post("", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    admin: UserResponse = Depends(require_admin)
):
    """Create a new post (admin only)."""
    db = get_db()
    
    # Generate slug from title
    base_slug = generate_slug(post_data.title)
    slug = base_slug
    
    # Ensure unique slug
    counter = 1
    while await db.posts.find_one({"slug": slug}):
        slug = f"{base_slug}-{counter}"
        counter += 1
    
    post = PostInDB(
        title=post_data.title,
        slug=slug,
        excerpt=post_data.excerpt,
        content=post_data.content,
        is_premium=post_data.is_premium
    )
    
    # Convert to dict for MongoDB
    post_dict = post.model_dump()
    post_dict["created_at"] = post_dict["created_at"].isoformat()
    post_dict["updated_at"] = post_dict["updated_at"].isoformat()
    
    await db.posts.insert_one(post_dict)
    
    return PostResponse(
        id=post.id,
        title=post.title,
        slug=post.slug,
        excerpt=post.excerpt,
        content=post.content,
        is_premium=post.is_premium,
        created_at=post_dict["created_at"],
        updated_at=post_dict["updated_at"]
    )


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    post_data: PostUpdate,
    admin: UserResponse = Depends(require_admin)
):
    """Update a post (admin only)."""
    db = get_db()
    
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Build update dict
    update_dict = {"updated_at": datetime.now(timezone.utc).isoformat()}
    
    if post_data.title is not None:
        update_dict["title"] = post_data.title
        # Update slug if title changes
        base_slug = generate_slug(post_data.title)
        slug = base_slug
        counter = 1
        while True:
            existing = await db.posts.find_one({"slug": slug, "id": {"$ne": post_id}})
            if not existing:
                break
            slug = f"{base_slug}-{counter}"
            counter += 1
        update_dict["slug"] = slug
    
    if post_data.excerpt is not None:
        update_dict["excerpt"] = post_data.excerpt
    
    if post_data.content is not None:
        update_dict["content"] = post_data.content
    
    if post_data.is_premium is not None:
        update_dict["is_premium"] = post_data.is_premium
    
    await db.posts.update_one({"id": post_id}, {"$set": update_dict})
    
    # Fetch updated post
    updated_post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    
    return PostResponse(
        id=updated_post["id"],
        title=updated_post["title"],
        slug=updated_post["slug"],
        excerpt=updated_post["excerpt"],
        content=updated_post["content"],
        is_premium=updated_post.get("is_premium", True),
        created_at=updated_post["created_at"],
        updated_at=updated_post["updated_at"]
    )


@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    admin: UserResponse = Depends(require_admin)
):
    """Delete a post (admin only)."""
    db = get_db()
    
    result = await db.posts.delete_one({"id": post_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    return {"message": "Post deleted successfully"}
