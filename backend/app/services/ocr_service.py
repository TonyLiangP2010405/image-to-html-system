import os
import io
import base64
import logging
from typing import List, Dict, Any, Optional
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

class OCRService:
    """OCR service using PaddleOCR + Florence-2 fallback"""
    
    def __init__(self):
        self.paddle_ocr = None
        self.florence_processor = None
        self.florence_model = None
        self._init_paddle()
    
    def _init_paddle(self):
        try:
            from paddleocr import PaddleOCR
            # Use lightweight config for 6GB VRAM
            self.paddle_ocr = PaddleOCR(
                use_angle_cls=True,
                lang='en',
                use_gpu=True,
                show_log=False,
                enable_mkldnn=True,
                det_limit_side_len=960,
            )
            logger.info("PaddleOCR initialized successfully")
        except Exception as e:
            logger.warning(f"PaddleOCR init failed: {e}. Will use CPU fallback.")
            try:
                from paddleocr import PaddleOCR
                self.paddle_ocr = PaddleOCR(
                    use_angle_cls=True,
                    lang='en',
                    use_gpu=False,
                    show_log=False,
                )
            except Exception as e2:
                logger.error(f"PaddleOCR CPU fallback also failed: {e2}")
                self.paddle_ocr = None
    
    def extract_text(self, image: Image.Image) -> List[Dict[str, Any]]:
        """Extract text regions from image"""
        results = []
        
        if self.paddle_ocr is None:
            logger.warning("OCR not available, returning empty")
            return results
        
        try:
            # Convert PIL to numpy array
            img_array = np.array(image)
            
            # Run OCR
            ocr_result = self.paddle_ocr.ocr(img_array, cls=True)
            
            if ocr_result and ocr_result[0]:
                for line in ocr_result[0]:
                    if line:
                        bbox, (text, score) = line
                        x_coords = [p[0] for p in bbox]
                        y_coords = [p[1] for p in bbox]
                        
                        results.append({
                            "text": text,
                            "confidence": float(score),
                            "bbox": {
                                "x": int(min(x_coords)),
                                "y": int(min(y_coords)),
                                "width": int(max(x_coords) - min(x_coords)),
                                "height": int(max(y_coords) - min(y_coords)),
                            }
                        })
        except Exception as e:
            logger.error(f"OCR extraction error: {e}")
        
        logger.info(f"OCR extracted {len(results)} text regions")
        return results
    
    def extract_all_text(self, image: Image.Image) -> str:
        """Extract all text as a single string"""
        regions = self.extract_text(image)
        return "\n".join([r["text"] for r in regions])
