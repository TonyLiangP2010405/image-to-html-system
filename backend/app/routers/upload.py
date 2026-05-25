import os
import logging
from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import HTMLResponse, FileResponse
from PIL import Image
import io

from app.models.schemas import UploadResponse
from app.services.pipeline import PipelineService
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()
pipeline = PipelineService()
settings = get_settings()


def validate_image(file: UploadFile):
    """Validate uploaded file"""
    # Check extension
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(settings.allowed_extensions)}"
        )
    
    return ext


@router.post("/upload", response_model=UploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload image and convert to HTML"""
    
    logger.info(f"Received upload: {file.filename}")
    
    # Validate
    validate_image(file)
    
    # Read image
    try:
        contents = await file.read()
        if len(contents) > settings.max_file_size:
            raise HTTPException(status_code=400, detail="File too large (max 10MB)")
        
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if needed
        if image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        
    except Exception as e:
        logger.error(f"Image processing error: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid image: {str(e)}")
    
    # Process through pipeline
    try:
        result = await pipeline.process(image, file.filename)
    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")
    
    return UploadResponse(
        html=result["html"],
        layout_json=result["layout_json"],
        preview_url=result["preview_url"],
    )


@router.get("/preview/{job_id}", response_class=HTMLResponse)
async def preview_html(job_id: str):
    """Preview generated HTML"""
    html = pipeline.get_html(job_id)
    if not html:
        raise HTTPException(status_code=404, detail="Preview not found")
    return html


@router.get("/download/{job_id}")
async def download_html(job_id: str):
    """Download generated HTML file"""
    html = pipeline.get_html(job_id)
    if not html:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Create temp file for download
    download_path = os.path.join(settings.upload_dir, f"{job_id}_download.html")
    with open(download_path, "w", encoding="utf-8") as f:
        f.write(html)
    
    return FileResponse(
        download_path,
        media_type="text/html",
        filename=f"generated_{job_id}.html"
    )


@router.get("/layout/{job_id}")
async def get_layout(job_id: str):
    """Get layout JSON"""
    layout = pipeline.get_layout(job_id)
    if not layout:
        raise HTTPException(status_code=404, detail="Layout not found")
    return layout
