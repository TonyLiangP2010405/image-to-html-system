# Image to HTML System

Convert screenshots and UI designs into clean, semantic HTML with TailwindCSS using local AI models.

## Features

- **Drag & Drop Upload** - Upload any screenshot or UI image
- **AI-Powered Analysis** - Uses Florence-2 + PaddleOCR for text/layout detection
- **HTML Generation** - Qwen2.5-Coder 7B generates semantic HTML via Ollama
- **Real-time Preview** - See results instantly in the browser
- **Download** - Export clean HTML with TailwindCSS
- **Privacy First** - All processing happens locally on your machine

## Architecture

```
Frontend (React + Vite + Tailwind) ──→ Backend (FastAPI + Python)
                                              ↓
                                    OCR (PaddleOCR)
                                              ↓
                                    Layout Analysis
                                              ↓
                                    HTML Gen (Qwen2.5 via Ollama)
                                              ↓
                                    Return HTML + Layout JSON
```

## Hardware Requirements

- **GPU**: NVIDIA GPU with 6GB+ VRAM (tested on RTX 3060 6GB)
- **RAM**: 16GB+ recommended
- **Storage**: 10GB for models

## Model Stack

| Component | Model | Size | Quantization |
|-----------|-------|------|-------------|
| OCR | PaddleOCR + Florence-2-base | ~500MB | FP16 |
| HTML Generation | Qwen2.5-Coder-7B-Instruct | ~7B | 4-bit GGUF |
| Runtime | Ollama | - | Q4_K_M |

## Quick Start (Docker)

### 1. Clone & Setup

```bash
git clone https://github.com/yourusername/image-to-html-system.git
cd image-to-html-system
```

### 2. Install Ollama Model

```bash
# Pull Qwen2.5-Coder 7B (4-bit)
docker compose up -d ollama
docker exec -it ollama ollama pull qwen2.5-coder:7b
```

### 3. Start Everything

```bash
docker compose up
```

### 4. Open Browser

```
http://localhost:3000
```

## Manual Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- NVIDIA GPU with CUDA 12.1+
- Ollama installed

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Download PaddleOCR models (auto on first run)
# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Ollama Setup

```bash
# Install Ollama: https://ollama.com
ollama pull qwen2.5-coder:7b
ollama serve
```

## API Documentation

### POST /api/upload

Upload an image and get HTML + layout analysis.

**Request:**
```bash
curl -X POST -F "file=@screenshot.png" http://localhost:8000/api/upload
```

**Response:**
```json
{
  "html": "<!DOCTYPE html>...",
  "layout_json": {
    "canvas": {"width": 1280, "height": 800},
    "elements": [...]
  },
  "preview_url": "/preview/abc123"
}
```

### GET /preview/{job_id}

Preview generated HTML.

### GET /api/download/{job_id}

Download HTML file.

### GET /api/layout/{job_id}

Get layout JSON.

### GET /health

Health check with model status.

## JSON Structure

```json
{
  "type": "button",
  "text": "Login",
  "position": {"x": 100, "y": 300},
  "size": {"width": 200, "height": 60},
  "style": {
    "background": "#2563eb",
    "color": "#ffffff",
    "borderRadius": "12px",
    "fontSize": "16px",
    "fontWeight": "bold"
  }
}
```

## Project Structure

```
image-to-html-system/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/     # Upload, Preview pages
│   │   ├── components/# Reusable components
│   │   └── App.jsx
│   └── package.json
├── backend/           # FastAPI + Python
│   ├── app/
│   │   ├── routers/   # API endpoints
│   │   ├── services/  # OCR, Layout, HTML gen
│   │   └── main.py
│   └── requirements.txt
├── docker/            # Dockerfiles
├── docker-compose.yml # Full stack orchestration
└── README.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_HOST` | `http://ollama:11434` | Ollama API endpoint |
| `OLLAMA_MODEL` | `qwen2.5-coder:7b` | Model name |
| `DEBUG` | `false` | Enable debug mode |
| `MAX_FILE_SIZE` | `10485760` | Max upload size (bytes) |

## Troubleshooting

### Out of Memory

- Ensure Ollama model is 4-bit quantized: `qwen2.5-coder:7b`
- Reduce `num_ctx` in HTML generator if needed
- Use CPU for PaddleOCR if VRAM is full

### Ollama Connection Failed

```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Restart Ollama
docker compose restart ollama
```

### Slow Processing

- First run downloads models (one-time)
- Subsequent runs are faster
- Consider using CPU for OCR if GPU is busy

## Development

```bash
# Run tests
cd backend
pytest

# Frontend dev with hot reload
cd frontend
npm run dev

# Backend dev with auto-reload
cd backend
uvicorn app.main:app --reload
```

## License

MIT

## Acknowledgments

- [Florence-2](https://huggingface.co/microsoft/Florence-2-base) by Microsoft
- [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) by Baidu
- [Qwen2.5-Coder](https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct) by Alibaba
- [Ollama](https://ollama.com) for local model serving
