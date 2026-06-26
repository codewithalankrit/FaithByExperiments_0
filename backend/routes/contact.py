from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter(prefix="/contact", tags=["Contact"])


class ContactFormRequest(BaseModel):
    name: str
    email: EmailStr
    whatsapp: Optional[str] = None
    message: str


@router.post("/send")
async def send_contact_form(data: ContactFormRequest):
    """Contact form is now handled by EmailJS on the frontend. This endpoint is deprecated."""
    raise HTTPException(
        status_code=410,
        detail="Contact form is now handled by EmailJS. Please use the frontend contact form directly."
    )
