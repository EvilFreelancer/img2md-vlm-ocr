# img2md VLM OCR

## Overview

img2md VLM OCR is a comprehensive service for extracting document structure and content from images using advanced computer vision and vision-language models (VLM). The system combines YOLO-based document layout segmentation with OpenAI-compatible VLM models to accurately detect, classify, and extract text content from document images, converting them to structured Markdown format.

## Key Features

- **Document Layout Segmentation**: Uses YOLOv8-based models to detect and classify document elements (text blocks, tables, images, headers, etc.)
- **Vision-Language Model Integration**: Leverages OpenAI-compatible VLM models (default: Qwen2.5-VL) for intelligent text extraction
- **REST API**: FastAPI-based backend with comprehensive error handling and logging
- **Web Interface**: Modern React-based UI with drag-and-drop upload, real-time preview, and result visualization
- **CLI Tools**: Command-line utilities for batch PDF processing and document analysis
- **Docker Support**: Complete containerization with Docker Compose for easy deployment

## Architecture

### Backend Components

- **FastAPI Server**: RESTful API with CORS support and automatic OpenAPI documentation
- **Segmentation Service**: YOLO-based document layout detection using pre-trained models from Hugging Face
- **VLM Service**: Vision-language model integration for intelligent text extraction and Markdown conversion
- **OpenAI Service**: Configurable API client supporting custom endpoints and proxy configurations

### Frontend Components

- **React Application**: Modern UI built with React 19 and TailwindCSS
- **Image Processing**: Drag-and-drop upload, real-time preview, and bounding box visualization
- **Result Display**: JSON viewer, Markdown preview, and downloadable results

## Requirements

### System Requirements
- Python 3.12+
- Node.js 18+ (for frontend development)
- Docker and Docker Compose (for containerized deployment)

### Python Dependencies
- **Core**: FastAPI, Uvicorn, Pydantic, Pydantic-settings
- **Computer Vision**: Pillow, OpenCV, Ultralytics (YOLO)
- **AI/ML**: OpenAI, Guidance, Hugging Face Hub
- **Document Processing**: pdf2image
- **Utilities**: Requests, Dill

### Frontend Dependencies
- React 19, React-DOM
- TailwindCSS, PostCSS, Autoprefixer
- JSZip for file handling

## Installation & Deployment

### Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd markdown-ocr

# Copy and configure environment
cp docker-compose.dist.yaml docker-compose.yaml
# Edit docker-compose.yaml with your API keys and settings

# Start all services
docker compose up --build
```

This will start:
- **API Service**: Port 8000 (FastAPI backend)
- **Frontend Service**: Port 3000 (React app served by nginx)
- **Swagger UI**: Port 8080 (API documentation)

### Local Development

#### Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Set environment variables
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="http://localhost:11434/v1"  # For local Ollama
export OPENAI_API_MODEL="qwen2.5vl:7b"

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd ui

# Install dependencies
npm install

# Create environment file
echo "REACT_APP_API_URL=http://localhost:8000/api/objects" > .env

# Start development server
npm start
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```bash
# OpenAI API Configuration
OPENAI_API_KEY=your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1  # or local Ollama endpoint
OPENAI_API_MODEL=qwen2.5vl:32b  # or gpt-4o, qwen2.5vl:7b, etc.
OPENAI_PROXY=http://proxy:port  # Optional proxy configuration

# Server Configuration
HOST=0.0.0.0
PORT=8000

# Segmentator Model Configuration
SEGMENTATOR_REPO=DILHTWD/documentlayoutsegmentation_YOLOv8_ondoclaynet
SEGMENTATOR_FILENAME=yolov8x-doclaynet-epoch64-imgsz640-initiallr1e-4-finallr1e-5.pt
SEGMENTATOR_MODELS_DIR=models
```

### Model Configuration

The system uses a pre-trained YOLOv8 model for document layout segmentation, automatically downloaded from Hugging Face. The default model is optimized for document analysis and supports detection of:

- Text blocks, captions, section headers
- Tables, lists, formulas
- Page headers, footers, titles
- Images and graphical elements

## API Reference

### POST `/api/objects`

Extract document structure and content from an image.

**Parameters:**
- `file` (multipart/form-data): Image file (PNG, JPG, JPEG, GIF)
- `bbox_only` (query, optional): If true, only return bounding boxes without VLM processing

**Response:**
```json
{
  "objects": [
    {
      "type": "table",
      "bbox": [54, 126, 532, 434],
      "text": "Table content in Markdown format...",
      "confidence": 0.98
    }
  ]
}
```

**Example Usage:**
```bash
curl -F "file=@document.png" http://localhost:8000/api/objects
```

**File Limits:**
- Maximum file size: 25 MB
- Supported formats: PNG, JPG, JPEG, GIF

### API Documentation

- **Interactive Docs**: Available at `/docs` (Swagger UI)
- **OpenAPI Spec**: Available at `/openapi.json`
- **Alternative UI**: Swagger UI at port 8080 when using Docker Compose

## Web Interface

### Features
- **Drag & Drop Upload**: Easy image upload with visual feedback
- **Real-time Processing**: Live preview of segmentation results
- **Bounding Box Visualization**: Overlay detected elements on the original image
- **Result Export**: Download results as JSON or view in various formats
- **Responsive Design**: Works on desktop and mobile devices

### Access
- **Production**: http://localhost:3000 (when using Docker Compose)
- **Development**: http://localhost:3000 (when running `npm start`)

## CLI Tools

### PDF Processing (`process_pdf.py`)

Batch process PDF documents by converting to images and extracting content:

```bash
python process_pdf.py -i input.pdf -o output_directory
```

**Features:**
- PDF to PNG conversion
- Batch API processing with retry logic
- Markdown extraction for each page
- Cropped image extraction for tables and images
- Comprehensive logging and error handling

### Markdown Merging (`merge_markdown.py`)

Combine multiple Markdown files and organize associated media:

```bash
python merge_markdown.py -i input_directory -o merged.md -m media_directory
```

**Features:**
- Recursive Markdown file discovery
- Media file organization and path rewriting
- Configurable output formatting

### Segmentation Testing (`doc_layout_detection_test.py`)

Test the document layout segmentation model:

```bash
python doc_layout_detection_test.py path/to/image.png
```

**Output:**
- Annotated image with bounding boxes
- JSON file with detection results
- Confidence scores and class labels

## Development

### Project Structure
```
markdown-ocr/
├── app/                    # FastAPI backend
│   ├── controllers/       # API route handlers
│   ├── services/         # Business logic services
│   ├── schemas/          # Pydantic data models
│   ├── utils/            # Utility functions
│   └── settings.py       # Configuration management
├── ui/                    # React frontend
│   ├── src/components/   # React components
│   ├── public/           # Static assets
│   └── package.json      # Frontend dependencies
├── models/                # Downloaded ML models
├── input/                 # Input file directory
├── output/                # Output file directory
└── CLI tools             # Command-line utilities
```

### Adding New Features

1. **New API Endpoints**: Add routes in `app/controllers/`
2. **New Services**: Implement in `app/services/`
3. **New Models**: Update schemas in `app/schemas/`
4. **Frontend Components**: Add to `ui/src/components/`

### Testing

```bash
# Backend tests
pytest app/

# Frontend tests
cd ui && npm test

# Integration tests
docker compose up --build
# Test API endpoints and UI functionality
```

## Performance & Optimization

### Model Loading
- YOLO models are cached after first download
- VLM models are initialized once per service instance
- Automatic model downloading from Hugging Face Hub

### Image Processing
- Automatic image padding to meet VLM requirements (28px multiples)
- Configurable confidence thresholds for segmentation
- Efficient bounding box cropping and processing

### API Optimization
- Async request handling
- Comprehensive error handling and retry logic
- Request logging and monitoring

## Troubleshooting

### Common Issues

1. **Model Download Failures**
   - Check internet connectivity
   - Verify Hugging Face Hub access
   - Check available disk space

2. **VLM API Errors**
   - Verify API key and endpoint configuration
   - Check proxy settings if applicable
   - Ensure model compatibility

3. **Memory Issues**
   - Reduce batch sizes for large documents
   - Monitor system memory usage
   - Consider using smaller VLM models

### Logs

- **Backend**: Check console output and Docker logs
- **Frontend**: Browser developer console
- **Docker**: `docker compose logs [service-name]`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests and documentation
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review API documentation at `/docs`
