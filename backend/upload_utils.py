import os
from fastapi import UploadFile
from uuid import uuid4
import aiofiles

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def save_upload_file(upload_file: UploadFile) -> str:
    ext = os.path.splitext(upload_file.filename)[-1]
    filename = f"{uuid4().hex}{ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    async with aiofiles.open(file_path, "wb") as buffer:
        content = await upload_file.read()
        await buffer.write(content)
    
    return filename
