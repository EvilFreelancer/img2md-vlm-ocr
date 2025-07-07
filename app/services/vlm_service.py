import base64
import guidance
from typing import Optional
from app.services.openai_service import OpenAIService
from app.schemas.response_schema import ObjectsResponse
from app.settings import settings
from guidance.models._openai import OpenAIImageMixin, OpenAIInterpreter, OpenAI
from guidance.models._base import Model
from guidance.models._openai_base import ImageBlob

OBJECTS_PROMPT = (
    "Detect all distinct text blocks and key visual elements in the document image. "
    "Group text lines that logically, semantically, and visually belong together into single elements cluster. "
    "For each detected element, provide: "
    "1. A concise and descriptive label (e.g., 'heading', 'paragraph', 'list', 'table', 'section', etc.) "
    "2. A bounding box [x1, y1, x2, y2] that encompasses the entire grouped element. "
    "3. The complete text content of the cluster, adjusted to the Markdown format. "
    "Ignore 'manifest immigration' header and 'Manifest Law PLLC.' with page number footers."
)


class CustomOpenAI(Model):
    def __init__(
        self,
        model: str,
        echo: bool = True,
        *,
        api_key: Optional[str] = None,
        **kwargs,
    ):
        interpreter_cls = type(
            "OpenAIImageInterpreter", (OpenAIImageMixin, OpenAIInterpreter), {}
        )
        super().__init__(interpreter=interpreter_cls(model, api_key=api_key, **kwargs), echo=echo)


class VLMService(OpenAIService):
    def __init__(self):
        super().__init__()
        self.lm = CustomOpenAI(
            model=self.model,
            api_key=self.api_key,
            base_url=self.base_url,
            # proxy=self.proxy,
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
