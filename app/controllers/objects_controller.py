from fastapi import APIRouter, UploadFile, HTTPException, File
from app.schemas.response_schema import ObjectsResponse

router = APIRouter()

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "gif"}
MAX_FILE_SIZE_MB = 25


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

    # TODO: Call OpenAI service here
    # Return stub for now
    return ObjectsResponse(objects=[])
