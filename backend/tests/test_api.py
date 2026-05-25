import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "ollama_ready" in data

def test_upload_no_file():
    response = client.post("/api/upload")
    assert response.status_code == 422

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "Image to HTML" in response.json()["name"]
