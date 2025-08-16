# Markdown OCR VLM API

## Overview

Markdown OCR VLM API is a service for extracting document structure and content (in Markdown format) from images using
segmentation and vision-language models (VLM). It provides a REST API, CLI tools, and a web interface for convenient
document processing.

## Requirements

- Python 3.12+
- FastAPI, Uvicorn, Pillow, pdf2image, ultralytics, huggingface_hub, openai, guidance, and others (see
  `requirements.txt`)
- For frontend: Node.js, npm, React, TailwindCSS
- For Docker: Docker and Docker Compose

## Main Components

- **Backend (FastAPI)**: REST API for image processing, object detection, and text extraction.
- **Frontend (React UI)**: Web interface for uploading images, visualizing results, and downloading markup.
- **CLI Tools**:
    - `process_pdf.py` — Batch PDF processing (convert to PNG, send to API, save Markdown and images).
    - `merge_markdown.py` — Merge Markdown files and copy related images.
    - `doc_layout_detection_test.py` — Test the segmentator: detect blocks in an image, save annotated image and JSON.

## Installation & Launch

### Local (Python)

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Docker

```bash
docker build -t markdown-ocr .
docker run --env-file .env -p 8000:8000 markdown-ocr
```

### Docker Compose (Recommended)

```bash
cp docker-compose.dist.yaml docker-compose.yaml
docker compose up --build
```

This will start:
- **API service** on port 8000
- **Frontend service** on port 3000 (React app served by nginx)
- **Swagger UI** on port 8080

## Environment Variables

All configuration is managed via a `.env` file in the project root (see `.env.dist` for an example):

- `OPENAI_API_KEY` — your OpenAI API key (required)
- `OPENAI_BASE_URL` — OpenAI API endpoint (default: https://api.openai.com/v1)
- `OPENAI_API_MODEL` — OpenAI model name (default: gpt-4o)
- `HOST`, `PORT` — server host and port (optional)
- `SEGMENTATOR_*` — segmentator parameters (see `app/settings.py`)

## API

### POST `/api/objects`

- **Parameters**: image (multipart/form-data, field `file`), optional `bbox_only` (bool)
- **Response**: JSON array of objects (type, bbox, text, confidence)

**Example request:**

```bash
curl -F "file=@page1.png" http://localhost:8000/api/objects
```

**Example response:**

```json
{
  "objects": [
    {
      "type": "table",
      "bbox": [
        54,
        126,
        532,
        434
      ],
      "text": "Table content...",
      "confidence": 0.98
    }
  ]
}
```

**OpenAPI specification:** see `openapi.yaml` or Swagger UI at `/docs`.

## Web Interface (UI)

- Located in the `ui/` folder
- **Docker (Recommended)**:
  ```bash
  docker compose up --build frontend
  # Access at http://localhost:3000
  ```
- **Local development**:
  1. Create `.env` in `ui/`:
     ```
     REACT_APP_API_URL=http://localhost:8000/api/objects
     ```
  2. Run:
     ```bash
     cd ui
     npm install
     npm start
     ```
- Features: drag & drop upload, preview, bbox overlay, download, JSON view, repeat request.

## CLI Tools

- **process_pdf.py** — PDF processing:
  ```bash
  python process_pdf.py -i input.pdf -o output_dir
  ```
    - Converts PDF to PNG, sends pages to API, saves Markdown and cropped images.
- **merge_markdown.py** — Merge Markdown:
  ```bash
  python merge_markdown.py -i input_dir -o merged.md -m media_dir
  ```
    - Collects all Markdown files from a folder, copies images, rewrites paths.
- **doc_layout_detection_test.py** — Segmentator test:
  ```bash
  python doc_layout_detection_test.py path/to/image.png
  ```
    - Saves annotated image and JSON with bounding boxes.
