from fastapi import APIRouter, UploadFile, HTTPException, File, Request
from app.schemas.response_schema import ObjectsResponse
from app.services.vlm_service import VLMService
import traceback
import logging
from PIL import Image

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
        logger.info(f"Calling VLMService.predict_objects for file: {file.filename}")
        api_response = vlm_service.predict_objects(image_bytes)
        logger.info(f"VLMService response for {file.filename}: {api_response}")
        objects = api_response.get("objects", [])

        # Get original image size
        file.file.seek(0)
        img = Image.open(file.file)
        width, height = img.size
        logger.info(f"Original image size: {width}x{height}")

        # Assume model input size (change if your model uses another size)
        input_width, input_height = 1024, 1024

        # Convert bbox coordinates
        for obj in objects:
            bbox = obj.get("bbox_2d")
            if bbox and len(bbox) == 4:
                x1, y1, x2, y2 = bbox
                abs_x1 = int(x1 / input_width * width)
                abs_y1 = int(y1 / input_height * height)
                abs_x2 = int(x2 / input_width * width)
                abs_y2 = int(y2 / input_height * height)
                obj["bbox_2d"] = [abs_x1, abs_y1, abs_x2, abs_y2]

        return ObjectsResponse(objects=objects)

    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Error in predict_objects: {e}\n{tb}")
        raise HTTPException(status_code=502, detail=f"VLM API error: {e}\n{tb}")
