from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class Position(BaseModel):
    x: int
    y: int


class Size(BaseModel):
    width: int
    height: int


class Style(BaseModel):
    background: Optional[str] = None
    color: Optional[str] = None
    borderRadius: Optional[str] = None
    fontSize: Optional[str] = None
    fontWeight: Optional[str] = None
    border: Optional[str] = None
    padding: Optional[str] = None
    margin: Optional[str] = None


class LayoutElement(BaseModel):
    type: str
    text: Optional[str] = None
    position: Position
    size: Size
    style: Optional[Style] = None
    children: Optional[List["LayoutElement"]] = None


class UploadResponse(BaseModel):
    html: str
    layout_json: Dict[str, Any]
    preview_url: str
    job_id: str


class HealthResponse(BaseModel):
    status: str
    ollama_ready: bool
    models_loaded: Dict[str, bool]
