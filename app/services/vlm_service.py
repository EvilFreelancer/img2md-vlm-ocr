import base64
import guidance
from typing import Optional
from app.services.openai_service import OpenAIService
from app.schemas.response_schema import ObjectsResponse
from app.settings import settings
from guidance.models._openai import OpenAIImageMixin, OpenAIInterpreter, OpenAI
from guidance.models._base import Model
from guidance.models._openai_base import ImageBlob

OBJECTS_PROMPT = f"""\
Detect all distinct text blocks, tables, and images (including diagrams, UI elements, or any other graphical information) in the document image.
For images and tables, if there is a caption or label, the bounding box must include both the object and its caption.

For each detected element, provide:
1. An explicit and concise label indicating the type (e.g., 'heading', 'paragraph', 'list', 'table', 'image', etc.).
2. Use 'image' for any graphical object (diagram, UI element, or other non-text graphics). Use 'table' for tables.
3. A bounding box [x1, y1, x2, y2] that encompasses the entire grouped element (including caption if present).
4. For images and tables: ONLY the text of the caption or label (if present) as the content. If there is no caption, leave this field empty.
5. For other elements: the complete text content, adjusted to Markdown format.
"""


class CustomOpenAI(Model):
    def __init__(
        self,
        model: str,
        echo: bool = True,
        *,
        api_key: Optional[str] = None,
        sampling_params: Optional[dict] = None,
        **kwargs,
    ):
        interpreter_cls = type(
            "OpenAIImageInterpreter", (OpenAIImageMixin, OpenAIInterpreter), {}
        )
        if sampling_params is None:
            sampling_params = {
                "temperature": 0.2,
                "top_p": 0.95,
            }
        super().__init__(
            interpreter=interpreter_cls(model, api_key=api_key, **kwargs),
            echo=echo,
            sampling_params=sampling_params
        )


class VLMService(OpenAIService):
    def __init__(self):
        super().__init__()
        self.lm = CustomOpenAI(
            model=self.model,
            api_key=self.api_key,
            base_url=self.base_url,
            # proxy=self.proxy,
            # sampling_params can be customized here if needed
        )

    def predict_objects(self, image_bytes: bytes, prompt: str = OBJECTS_PROMPT, **kwargs):
        # user_content = [
        #     {"type": "text", "text": prompt},
        #     {"type": "image", "data": base64.b64encode(image_bytes).decode()}
        # ]
        with guidance.user():
            self.lm += prompt
            self.lm += ImageBlob(data=base64.b64encode(image_bytes))
        with guidance.assistant():
            self.lm += guidance.json(name="objects", schema=ObjectsResponse)
        result_json = self.lm["objects"]
        return ObjectsResponse.model_validate_json(result_json).model_dump()
