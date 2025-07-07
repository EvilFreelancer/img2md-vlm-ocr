from fastapi import APIRouter, UploadFile, HTTPException, File
from app.schemas.response_schema import ObjectsResponse
from app.services.vlm_service import VLMService
import traceback

router = APIRouter()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
MAX_FILE_SIZE_MB = 25

vlm_service = VLMService()

@router.post("/predict/objects", response_model=ObjectsResponse)
async def predict_objects(file: UploadFile = File(...)) -> ObjectsResponse:
    # Validate file size
    file.file.seek(0, 2)
    size_mb = file.file.tell() / (1024 * 1024)
    file.file.seek(0)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail="File too large. Max size is 25 MB.")

    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed. Only jpg, png, gif are supported.")

    try:
        image_bytes = await file.read()
        api_response = vlm_service.predict_objects(image_bytes)
        # Ожидаем, что api_response содержит ключ 'objects' с нужной структурой
        objects = api_response.get("objects", [])
        return ObjectsResponse(objects=objects)
    except Exception as e:
        # Возвращаем ошибку, если не удалось получить ответ от API
        tb = traceback.format_exc()
        raise HTTPException(status_code=502, detail=f"VLM API error: {e}\n{tb}")
