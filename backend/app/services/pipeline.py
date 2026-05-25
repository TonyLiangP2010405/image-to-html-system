import os
import json
import logging
import uuid
from typing import Dict, Any
from datetime import datetime
from PIL import Image

from app.config import get_settings
from app.services.ocr_service import OCRService
from app.services.layout_service import LayoutService
from app.services.html_generator import HTMLGenerator

logger = logging.getLogger(__name__)

class PipelineService:
    """Main pipeline: Image -> OCR -> Layout -> HTML"""
    
    def __init__(self):
        self.settings = get_settings()
        self.ocr = OCRService()
        self.layout = LayoutService()
        self.html_gen = HTMLGenerator(
            ollama_host=self.settings.ollama_host,
            model=self.settings.ollama_model
        )
        os.makedirs(self.settings.upload_dir, exist_ok=True)
    
    async def process(self, image: Image.Image, filename: str) -> Dict[str, Any]:
        """Run full pipeline on image"""
        
        # Generate unique ID
        job_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        logger.info(f"[{job_id}] Starting pipeline for {filename}")
        
        # Step 1: Save original
        original_path = os.path.join(self.settings.upload_dir, f"{job_id}_original.png")
        image.save(original_path)
        
        # Step 2: OCR
        logger.info(f"[{job_id}] Running OCR...")
        ocr_results = self.ocr.extract_text(image)
        
        # Step 3: Layout Analysis
        logger.info(f"[{job_id}] Analyzing layout...")
        elements = self.layout.analyze(image, ocr_results)
        layout_json = self.layout.to_json_structure(elements, image.size)
        
        # Save layout JSON
        layout_path = os.path.join(self.settings.upload_dir, f"{job_id}_layout.json")
        with open(layout_path, "w", encoding="utf-8") as f:
            json.dump(layout_json, f, ensure_ascii=False, indent=2)
        
        # Step 4: Generate HTML
        logger.info(f"[{job_id}] Generating HTML via Qwen...")
        html = await self.html_gen.generate(layout_json, image)
        
        # Save HTML
        html_path = os.path.join(self.settings.upload_dir, f"{job_id}_output.html")
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(html)
        
        # Build preview URL
        preview_url = f"/preview/{job_id}"
        
        logger.info(f"[{job_id}] Pipeline complete. HTML saved to {html_path}")
        
        return {
            "html": html,
            "layout_json": layout_json,
            "preview_url": preview_url,
            "job_id": job_id,
        }
    
    def get_html(self, job_id: str) -> str:
        """Retrieve generated HTML by job ID"""
        html_path = os.path.join(self.settings.upload_dir, f"{job_id}_output.html")
        if os.path.exists(html_path):
            with open(html_path, "r", encoding="utf-8") as f:
                return f.read()
        return ""
    
    def get_layout(self, job_id: str) -> Dict:
        """Retrieve layout JSON by job ID"""
        layout_path = os.path.join(self.settings.upload_dir, f"{job_id}_layout.json")
        if os.path.exists(layout_path):
            with open(layout_path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {}
