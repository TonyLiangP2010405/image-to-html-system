import pytest
from PIL import Image
import io
from app.services.ocr_service import OCRService
from app.services.layout_service import LayoutService

def test_ocr_service_init():
    ocr = OCRService()
    assert ocr is not None

def test_layout_service_analyze():
    layout = LayoutService()
    
    # Create a test image
    img = Image.new('RGB', (800, 600), color='white')
    
    # Mock OCR results
    ocr_results = [
        {
            "text": "Login",
            "confidence": 0.95,
            "bbox": {"x": 100, "y": 200, "width": 150, "height": 50}
        }
    ]
    
    elements = layout.analyze(img, ocr_results)
    assert len(elements) > 0
    assert elements[0]["type"] in ["button", "heading", "text"]

def test_layout_to_json():
    layout = LayoutService()
    elements = [
        {
            "type": "button",
            "text": "Submit",
            "position": {"x": 0, "y": 0},
            "size": {"width": 100, "height": 40},
            "style": {"background": "#2563eb"}
        }
    ]
    result = layout.to_json_structure(elements, (800, 600))
    assert result["canvas"]["width"] == 800
    assert len(result["elements"]) == 1
