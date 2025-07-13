import traceback
import logging
from PIL import Image
import io

from fastapi import APIRouter, UploadFile, HTTPException, File, Request

from app.schemas.response_schema import ObjectsResponse
from app.services.vlm_service import VLMService
from app.services.segmentator_service import run_segmentation

logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("process_pdf")

router = APIRouter()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
MAX_SIZE_MB = 25
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

vlm_service = VLMService()


@router.post("/api/objects", response_model=ObjectsResponse)
async def predict_objects(request: Request, file: UploadFile = File(...)) -> ObjectsResponse:
    try:
        # Log incoming request details
        logger.info(f"Incoming request: {request.method} {request.url.path} from {request.client.host}")
        logger.info(f"Headers: {dict(request.headers)}")
        logger.info(f"Query params: {dict(request.query_params)}")

        file.file.seek(0, 2)
        size_bytes = file.file.tell()
        file.file.seek(0)
        size_mb = size_bytes / (1024 * 1024)
        logger.info(f"Received file: {file.filename}, size: {size_mb:.2f} MB, content_type: {file.content_type}")
        if size_bytes > MAX_SIZE_BYTES:
            logger.warning(f"File too large: {size_mb:.2f} MB (limit: {MAX_SIZE_MB} MB)")
            raise HTTPException(status_code=400, detail=f"File too large. Max size is {MAX_SIZE_MB} MB.")

        ext = file.filename.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            logger.warning(f"File type not allowed: {ext}")
            raise HTTPException(status_code=400, detail="File type not allowed. Only jpg, png, gif are supported.")

        image_bytes = await file.read()
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        width, height = img.size
        logger.info(f"Original image size: {width}x{height}")

        # Run segmentation to get layout blocks
        detections = run_segmentation(file.filename)
        logger.info(f"Segmentation found {len(detections)} blocks")

        objects = []
        for det in detections:
            type = det["type"]
            bbox = det["bbox"]  # [x1, y1, x2, y2]
            confidence = det.get("confidence")
            x1, y1, x2, y2 = map(int, bbox)

            # Clamp coordinates to image size
            x1 = max(0, min(x1, width - 1))
            y1 = max(0, min(y1, height - 1))
            x2 = max(0, min(x2, width))
            y2 = max(0, min(y2, height))
            crop = img.crop((x1, y1, x2, y2))
            text = None
            if type in ("Text", "Section-header", "Table"):
                buf = io.BytesIO()
                crop.save(buf, format="PNG")
                crop_bytes = buf.getvalue()
                try:
                    text = vlm_service.extract_markdown(crop_bytes)
                except Exception as e:
                    logger.error(f"VLM error for block {type}: {e}")
                    text = None

            # For Picture, do not call VLM
            obj = {
                "type":       type,
                "bbox":       [x1, y1, x2, y2],
                "confidence": confidence,
                "text":       text
            }
            objects.append(obj)

        return objects

    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Error in predict_objects: {e}\n{tb}")
        raise HTTPException(status_code=502, detail=f"VLM API error: {e}\n{tb}")


@router.post("/api/bbox")
async def get_bboxes(request: Request, file: UploadFile = File(...)):
    try:
        # Log incoming request details
        logger.info(f"Incoming request: {request.method} {request.url.path} from {request.client.host}")
        logger.info(f"Headers: {dict(request.headers)}")
        logger.info(f"Query params: {dict(request.query_params)}")

        file.file.seek(0, 2)
        size_bytes = file.file.tell()
        file.file.seek(0)
        size_mb = size_bytes / (1024 * 1024)
        logger.info(f"Received file: {file.filename}, size: {size_mb:.2f} MB, content_type: {file.content_type}")
        if size_bytes > MAX_SIZE_BYTES:
            logger.warning(f"File too large: {size_mb:.2f} MB (limit: {MAX_SIZE_MB} MB)")
            raise HTTPException(status_code=400, detail=f"File too large. Max size is {MAX_SIZE_MB} MB.")

        ext = file.filename.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            logger.warning(f"File type not allowed: {ext}")
            raise HTTPException(status_code=400, detail="File type not allowed. Only jpg, png, gif are supported.")

        # Save file to a temporary location if needed, or use in-memory
        detections = run_segmentation(file.filename)
        logger.info(f"Segmentation found {len(detections)} blocks")

        # Return only type, bbox, confidence
        return [
            {
                "type":       det["type"],
                "bbox":       det["bbox"],
                "confidence": det.get("confidence")
            }
            for det in detections
        ]

    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Error in get_bboxes: {e}\n{tb}")
        raise HTTPException(status_code=502, detail=f"BBox API error: {e}\n{tb}")
