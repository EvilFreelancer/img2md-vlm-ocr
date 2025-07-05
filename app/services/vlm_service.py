import base64

from app.services.openai_service import OpenAIService

# Default prompt and schema for object detection
OBJECTS_PROMPT = (
    "Detect all distinct text blocks and key visual elements in the document image. "
    "Group text lines that logically, semantically, and visually belong together into single elements cluster. "
    "For each detected element, provide: "
    "1. A concise and descriptive label (e.g., 'heading', 'paragraph', 'list', 'table', 'section', etc.) "
    "2. A bounding box [x1, y1, x2, y2] that encompasses the entire grouped element. "
    "3. The complete text content of the cluster, adjusted to the Markdown format. "
    "Ignore 'manifest immigration' header and 'Manifest Law PLLC.' with page number footers."
)
OBJECTS_SCHEMA = {
    "type":       "object",
    "properties": {
        "objects": {
            "type":  "array",
            "items": {
                "type":       "object",
                "properties": {
                    "bbox_2d":    {
                        "type":        "array",
                        "description": "Coordinates of the object bounding box [x1, y1, x2, y2]",
                        "items":       {"type": "integer"}
                    },
                    "label":      {
                        "type":        "string",
                        "description": "Document element label"
                    },
                    "text":       {
                        "type":        "string",
                        "description": "Extracted text content from the detected area"
                    },
                    "confidence": {
                        "type":        "number",
                        "description": "Confidence score for the detection (0.0 to 1.0)"
                    }
                },
                "required":   ["bbox_2d", "label"]
            }
        }
    },
    "required":   ["objects"]
}


class VLMService(OpenAIService):

    def predict(self, image_bytes: bytes, model: str = "gpt-4o", **kwargs):
        # Encode image to base64
        image_b64 = base64.b64encode(image_bytes).decode()

        # Add guided_json and schema to extra_body if needed
        extra_body = {
            "guided_json":             OBJECTS_SCHEMA,
            "guided_decoding_backend": "xgrammar"
        }

        # Merge extra_body with kwargs
        merged_kwargs = {**kwargs, **extra_body}
        return self.predict(image_b64.encode(), OBJECTS_PROMPT, model=model, **merged_kwargs)
