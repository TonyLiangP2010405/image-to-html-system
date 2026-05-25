import logging
from typing import List, Dict, Any, Optional, Tuple
from PIL import Image
import numpy as np
import colorsys

logger = logging.getLogger(__name__)

class LayoutService:
    """Layout analysis service - detects UI elements and their properties"""
    
    def __init__(self):
        pass
    
    def analyze(self, image: Image.Image, ocr_results: List[Dict]) -> List[Dict[str, Any]]:
        """Analyze image layout and return structured elements"""
        elements = []
        
        # Get image dimensions
        width, height = image.size
        
        # Process OCR text elements
        for ocr in ocr_results:
            bbox = ocr["bbox"]
            element = self._create_text_element(
                ocr["text"],
                bbox["x"], bbox["y"],
                bbox["width"], bbox["height"],
                image
            )
            elements.append(element)
        
        # Detect buttons (heuristic based on colored rectangles with text)
        buttons = self._detect_buttons(image, elements)
        elements.extend(buttons)
        
        # Detect input fields
        inputs = self._detect_inputs(image, elements)
        elements.extend(inputs)
        
        # Detect containers/sections
        containers = self._detect_containers(image, elements)
        elements.extend(containers)
        
        # Detect images
        images = self._detect_images(image, elements)
        elements.extend(images)
        
        # Sort by Y position for logical reading order
        elements.sort(key=lambda e: (e["position"]["y"], e["position"]["x"]))
        
        logger.info(f"Layout analysis found {len(elements)} elements")
        return elements
    
    def _create_text_element(self, text: str, x: int, y: int, w: int, h: int, image: Image.Image) -> Dict:
        """Create a text element with detected styling"""
        # Sample color from the region
        bg_color, text_color = self._sample_colors(image, x, y, w, h)
        
        # Determine element type based on styling
        element_type = self._classify_element(text, x, y, w, h, bg_color, image)
        
        return {
            "type": element_type,
            "text": text,
            "position": {"x": x, "y": y},
            "size": {"width": w, "height": h},
            "style": {
                "background": bg_color,
                "color": text_color,
                "fontSize": self._estimate_font_size(h),
                "fontWeight": "bold" if h > 30 else "normal",
                "borderRadius": self._estimate_border_radius(image, x, y, w, h),
                "padding": "8px 16px" if element_type == "button" else "4px",
            }
        }
    
    def _classify_element(self, text: str, x: int, y: int, w: int, h: int, bg_color: str, image: Image.Image) -> str:
        """Classify element type based on visual properties"""
        text_lower = text.lower().strip()
        width, height = image.size
        
        # Common button texts
        button_keywords = ["submit", "login", "sign in", "sign up", "button", "click", "go", "next", "continue", 
                          "save", "cancel", "ok", "yes", "no", "send", "search", "add", "create",
                          "get started", "learn more", "download", "install"]
        
        # Exclude obvious non-button text (placeholders, descriptions)
        non_button_keywords = ["please", "enter your", "email address", "password", "username", 
                               "type your", "input", "description", "hint", "placeholder"]
        if any(kw in text_lower for kw in non_button_keywords):
            return "text"
        
        # Better button detection: must be short and have button-like styling
        is_short = len(text) < 25
        has_button_keyword = any(kw in text_lower for kw in button_keywords)
        reasonable_width = w < 400
        
        if has_button_keyword and is_short and reasonable_width:
            return "button"
        
        # Check if it's a heading (short text, relatively large, prominent position)
        if len(text) < 100 and h > 28 and y < height * 0.4:
            return "heading"
        
        # Check if it's a link (blue color or link-like text)
        link_keywords = ["forgot", "reset", "click here", "more", "learn", "details", "help"]
        if any(kw in text_lower for kw in link_keywords):
            return "link"
        
        # Default to text/paragraph
        return "text"
    
    def _detect_buttons(self, image: Image.Image, existing_elements: List[Dict]) -> List[Dict]:
        """Detect buttons that might have been missed by OCR"""
        # Heuristic: look for colored rectangles without text
        # Simplified implementation
        return []
    
    def _detect_inputs(self, image: Image.Image, existing_elements: List[Dict]) -> List[Dict]:
        """Detect input fields"""
        # Look for rectangular regions with light backgrounds and borders
        # Simplified - in production would use edge detection
        return []
    
    def _detect_containers(self, image: Image.Image, existing_elements: List[Dict]) -> List[Dict]:
        """Detect container sections"""
        width, height = image.size
        # Detect if there's a header/nav area
        elements = []
        
        # Check top area for navigation
        top_region = image.crop((0, 0, width, min(height // 8, 100)))
        avg_color = self._get_average_color(top_region)
        
        if self._is_distinct_color(avg_color, image):
            elements.append({
                "type": "container",
                "text": "header",
                "position": {"x": 0, "y": 0},
                "size": {"width": width, "height": min(height // 8, 80)},
                "style": {
                    "background": self._rgb_to_hex(avg_color),
                    "padding": "16px",
                }
            })
        
        return elements
    
    def _detect_images(self, image: Image.Image, existing_elements: List[Dict]) -> List[Dict]:
        """Detect image regions"""
        # Simplified - would use more sophisticated image detection
        return []
    
    def _sample_colors(self, image: Image.Image, x: int, y: int, w: int, h: int) -> Tuple[str, str]:
        """Sample background and text colors from region"""
        # Ensure bounds
        img_w, img_h = image.size
        x = max(0, min(x, img_w - 1))
        y = max(0, min(y, img_h - 1))
        w = min(w, img_w - x)
        h = min(h, img_h - y)
        
        if w <= 0 or h <= 0:
            return "#ffffff", "#000000"
        
        region = image.crop((x, y, x + w, y + h))
        
        # Get dominant colors
        small = region.resize((50, 50))
        pixels = list(small.getdata())
        
        # Simple color analysis
        if len(pixels) > 0:
            # Assume corners/edges are background
            bg_samples = [pixels[0], pixels[-1], pixels[len(pixels)//2]]
            bg = self._most_common_color(bg_samples)
            
            # Text color is opposite brightness
            text = self._get_contrasting_color(bg)
            return self._rgb_to_hex(bg), self._rgb_to_hex(text)
        
        return "#ffffff", "#000000"
    
    def _get_average_color(self, image: Image.Image) -> Tuple[int, int, int]:
        """Get average color of image"""
        small = image.resize((1, 1))
        return small.getpixel((0, 0))[:3]
    
    def _most_common_color(self, colors: List[Tuple]) -> Tuple[int, int, int]:
        """Get most common color from samples"""
        if not colors:
            return (255, 255, 255)
        # Average them
        r = sum(c[0] for c in colors) // len(colors)
        g = sum(c[1] for c in colors) // len(colors)
        b = sum(c[2] for c in colors) // len(colors)
        return (r, g, b)
    
    def _rgb_to_hex(self, rgb: Tuple[int, int, int]) -> str:
        """Convert RGB tuple to hex string"""
        return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
    
    def _get_contrasting_color(self, rgb: Tuple[int, int, int]) -> Tuple[int, int, int]:
        """Get black or white based on brightness"""
        brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000
        return (0, 0, 0) if brightness > 128 else (255, 255, 255)
    
    def _is_distinct_color(self, rgb: Tuple[int, int, int], image: Image.Image) -> bool:
        """Check if color is distinct from overall image average"""
        avg = self._get_average_color(image)
        diff = sum(abs(rgb[i] - avg[i]) for i in range(3))
        return diff > 60
    
    def _estimate_font_size(self, height: int) -> str:
        """Estimate font size from element height"""
        if height < 20:
            return "12px"
        elif height < 30:
            return "16px"
        elif height < 45:
            return "20px"
        elif height < 60:
            return "24px"
        else:
            return "32px"
    
    def _estimate_border_radius(self, image: Image.Image, x: int, y: int, w: int, h: int) -> str:
        """Estimate border radius by checking corners"""
        # Simplified: assume small radius for most elements
        if h > 40 and w > 100:
            return "8px"
        return "4px"
    
    def to_json_structure(self, elements: List[Dict], image_size: Tuple[int, int]) -> Dict[str, Any]:
        """Convert elements to structured JSON"""
        return {
            "canvas": {
                "width": image_size[0],
                "height": image_size[1],
            },
            "elements": elements,
            "meta": {
                "total_elements": len(elements),
                "has_header": any(e.get("text") == "header" for e in elements),
            }
        }
