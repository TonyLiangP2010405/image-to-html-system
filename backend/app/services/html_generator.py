import os
import json
import logging
import httpx
from typing import Dict, Any, List
from PIL import Image
import base64
import io

logger = logging.getLogger(__name__)

class HTMLGenerator:
    """HTML generator using Qwen2.5-Coder via Ollama"""
    
    def __init__(self, ollama_host: str = "http://ollama:11434", model: str = "qwen2.5-coder:7b"):
        self.ollama_host = ollama_host
        self.model = model
        self.timeout = 120.0
    
    async def generate(self, layout_json: Dict[str, Any], image: Image.Image) -> str:
        """Generate HTML from layout JSON"""
        
        # Convert image to base64 for context
        img_buffer = io.BytesIO()
        image.save(img_buffer, format="PNG")
        img_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        # Build the prompt
        prompt = self._build_prompt(layout_json)
        
        # Call Ollama
        html = await self._call_ollama(prompt)
        
        # Clean up the HTML
        html = self._clean_html(html)
        
        return html
    
    def _build_prompt(self, layout_json: Dict[str, Any]) -> str:
        """Build prompt for Qwen"""
        
        elements = layout_json.get("elements", [])
        canvas = layout_json.get("canvas", {"width": 1280, "height": 800})
        
        # Build element descriptions
        element_descriptions = []
        for i, elem in enumerate(elements):
            elem_type = elem.get("type", "text")
            text = elem.get("text", "")
            pos = elem.get("position", {})
            size = elem.get("size", {})
            style = elem.get("style", {})
            
            desc = f"""Element {i+1}:
- Type: {elem_type}
- Text: {text}
- Position: x={pos.get('x', 0)}, y={pos.get('y', 0)}
- Size: {size.get('width', 0)}x{size.get('height', 0)}
- Style: background={style.get('background', 'transparent')}, color={style.get('color', '#000')}, fontSize={style.get('fontSize', '16px')}, borderRadius={style.get('borderRadius', '0')}"""
            element_descriptions.append(desc)
        
        elements_str = "\n\n".join(element_descriptions)
        
        prompt = f"""You are an expert frontend developer. Convert the following UI layout analysis into clean, semantic HTML with TailwindCSS classes.

Canvas size: {canvas.get('width', 1280)}x{canvas.get('height', 800)}

Detected elements:
{elements_str}

Requirements:
1. Generate ONLY the HTML code (no markdown, no explanations)
2. Use TailwindCSS utility classes
3. Make it responsive with mobile-first approach
4. Use semantic HTML tags (button, nav, header, main, section, etc.)
5. Keep the visual fidelity high - match colors, sizes, and layout closely
6. Use inline srcdoc-friendly approach (no external CSS/JS files)
7. Add the Tailwind CDN in the head
8. Return ONLY valid HTML that can be rendered in an iframe

Output the complete HTML document starting with <!DOCTYPE html>."""
        
        return prompt
    
    async def _call_ollama(self, prompt: str) -> str:
        """Call Ollama API"""
        url = f"{self.ollama_host}/api/generate"
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.1,
                "num_predict": 4096,
                "num_ctx": 8192,
            }
        }
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
                return data.get("response", "")
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            # Fallback: generate basic HTML from layout
            return self._fallback_html(prompt)
    
    def _clean_html(self, html: str) -> str:
        """Clean and extract HTML from response"""
        # Remove markdown code blocks
        if "```html" in html:
            html = html.split("```html")[-1].split("```")[0]
        elif "```" in html:
            html = html.split("```")[-2] if html.count("```") >= 2 else html.split("```")[-1]
        
        html = html.strip()
        
        # Ensure it starts with doctype
        if not html.lower().startswith("<!doctype") and not html.lower().startswith("<html"):
            html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
{html}
</body>
</html>"""
        
        # Ensure Tailwind CDN is present (only if not pure inline CSS already)
        if "tailwindcss.com" not in html and "<style>" not in html:
            html = html.replace("</head>", "\n<script src=\"https://cdn.tailwindcss.com\"></script>\n</head>")
        
        return html
    
    def _fallback_html(self, prompt: str) -> str:
        """Generate basic fallback HTML if Ollama fails - pure inline CSS, no external deps"""
        return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated UI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: #fff;
            border-radius: 16px;
            padding: 40px;
            max-width: 480px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.08);
            text-align: center;
        }
        .icon { font-size: 48px; margin-bottom: 16px; }
        h1 { font-size: 20px; font-weight: 700; color: #1a202c; margin-bottom: 8px; }
        p { color: #718096; font-size: 15px; line-height: 1.6; }
        .badge {
            display: inline-block;
            margin-top: 20px;
            padding: 6px 16px;
            background: #edf2f7;
            color: #4a5568;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="icon">🔧</div>
        <h1>HTML Generation Service Offline</h1>
        <p>The AI HTML generation service (Ollama + Qwen2.5-Coder) is not running. Please start Ollama and try again.</p>
        <span class="badge">Ollama not connected</span>
    </div>
</body>
</html>"""
