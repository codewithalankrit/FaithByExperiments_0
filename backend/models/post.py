from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid
import re


def generate_slug(title: str) -> str:
    """Generate a URL-friendly slug from a title."""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


class PostBase(BaseModel):
    title: str
    excerpt: str
    content: str
    is_premium: bool = True


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    is_premium: Optional[bool] = None


class PostInDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    slug: str
    excerpt: str
    content: str
    is_premium: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PostResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    title: str
    slug: str
    excerpt: str
    content: str
    is_premium: bool
    created_at: str
    updated_at: str


class PostPreviewResponse(BaseModel):
    """Response for non-subscribed users - limited content"""
    model_config = ConfigDict(extra="ignore")
    
    id: str
    title: str
    slug: str
    excerpt: str
    preview_content: str  # First 500 chars
    is_premium: bool
    created_at: str
    updated_at: str
