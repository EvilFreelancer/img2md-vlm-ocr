# Markdown OCR VLM API

## Launch (local)

```bash
uvicorn app.main:app --reload
```

## Environment variables

All configuration is managed via a `.env` file in the project root. See `.env.dist` for an example.

Required variables:

- `OPENAI_API_KEY` — your OpenAI API key
- `OPENAI_API_ENDPOINT` — (optional) OpenAI API endpoint (default: https://api.openai.com/v1/chat/completions)
- `OPENAI_API_MODEL` — (optional) OpenAI model name (default: gpt-4o)
- `HOST` — (optional) server host (default: 0.0.0.0)
- `PORT` — (optional) server port (default: 8000)

Copy `.env.dist` to `.env` and fill in your values:

```bash
cp .env.dist .env
```

## Docker

Build and run the app in Docker:

```bash
docker build -t markdown-ocr .
docker run --env-file .env -p 8000:8000 markdown-ocr
```

## Docker Compose

You can use the provided `docker-compose.dist.yaml` as a template:

```bash
cp docker-compose.dist.yaml docker-compose.yaml
docker compose up --build
```

## Endpoint

POST `/predict/objects`

- Accepts: image (multipart/form-data, field `file`)
- Returns: JSON with bbox, label, text, confidence (see example below)

### Example response

```json
{
  "objects": [
    {
      "bbox_2d": [
        54,
        126,
        532,
        434
      ],
      "label": "table",
      "text": "Table content...",
      "confidence": 0.98
    }
  ]
}
```

## Project structure

- app/
    - controllers/ # Business logic, request handling
    - services/ # External API/model logic
    - schemas/ # Pydantic schemas for request/response
    - settings.py # Project and model settings (Pydantic)
    - main.py # FastAPI entry point
- requirements.txt # Dependencies
- README.md # Project documentation
- .env.dist # Example environment config
- Dockerfile # Docker build file
- entrypoint.sh # Entrypoint script for Docker
- docker-compose.dist.yaml # Example docker-compose config
