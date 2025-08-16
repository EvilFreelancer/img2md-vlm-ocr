# Markdown OCR Frontend

React UI for Markdown OCR API with image upload, bbox overlay, and JSON viewer.

## Development

### Quick start:
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

## Docker

### Build and run with docker-compose:
```bash
# From project root
docker-compose up --build frontend
```

### Build standalone:
```bash
cd ui
docker build -t markdown-ocr-frontend .
docker run -p 3000:80 markdown-ocr-frontend
```

## Features
- Drag & drop image upload
- Image preview with bounding boxes
- JSON result viewer
- Download annotated images
- Repeat request functionality
- Responsive design with TailwindCSS

## Environment Variables
- `REACT_APP_API_URL` - API endpoint for object detection (default: http://localhost:8000/api/objects)
