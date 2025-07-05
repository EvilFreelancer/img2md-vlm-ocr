from pydantic import BaseModel, Field
from typing import List, Optional


class ObjectBlock(BaseModel):
    bbox_2d: List[int] = Field(..., description="Coordinates of the object bounding box [x1, y1, x2, y2]")
    label: str = Field(..., description="Document element label")
    text: Optional[str] = Field(None, description="Extracted text content from the detected area")
    confidence: Optional[float] = Field(None, description="Confidence score for the detection (0.0 to 1.0)")


class ObjectsResponse(BaseModel):
    objects: List[ObjectBlock]


class MarkdownResponse(BaseModel):
    markdown: str = Field(..., description="Extracted markdown content from the image")
