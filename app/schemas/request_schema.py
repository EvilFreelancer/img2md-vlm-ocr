from fastapi import UploadFile
from pydantic import BaseModel


class ImageRequest(BaseModel):
    # The file must be jpg, png, or gif and not exceed 25 MB
    file: UploadFile
