from fastapi import APIRouter, UploadFile, HTTPException, File, Request
from app.schemas.response_schema import ObjectsResponse
from app.services.vlm_service import VLMService
import traceback
import logging

router = APIRouter()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
MAX_FILE_SIZE_MB = 1

vlm_service = VLMService()
logger = logging.getLogger("objects_controller")

@router.post("/api/objects", response_model=ObjectsResponse)
async def predict_objects(request: Request, file: UploadFile = File(...)) -> ObjectsResponse:
    try:
        # Log incoming request details
        logger.info(f"Incoming request: {request.method} {request.url.path} from {request.client.host}")
        logger.info(f"Headers: {dict(request.headers)}")
        logger.info(f"Query params: {dict(request.query_params)}")

        file.file.seek(0, 2)
        size_mb = file.file.tell() / (1024 * 1024)
        file.file.seek(0)
        logger.info(f"Received file: {file.filename}, size: {size_mb:.2f} MB, content_type: {file.content_type}")
        if size_mb > MAX_FILE_SIZE_MB:
            logger.warning(f"File too large: {size_mb:.2f} MB")
            raise HTTPException(status_code=400, detail="File too large. Max size is 25 MB.")

        ext = file.filename.split(".")[-1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            logger.warning(f"File type not allowed: {ext}")
            raise HTTPException(status_code=400, detail="File type not allowed. Only jpg, png, gif are supported.")

        image_bytes = await file.read()
        logger.info(f"Calling VLMService.predict_objects for file: {file.filename}")
        api_response = vlm_service.predict_objects(image_bytes)
        logger.info(f"VLMService response for {file.filename}: {api_response}")
        objects = api_response.get("objects", [])
        return ObjectsResponse(objects=objects)
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"Error in predict_objects: {e}\n{tb}")
        raise HTTPException(status_code=502, detail=f"VLM API error: {e}\n{tb}")
