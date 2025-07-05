import requests
import os
from app.settings import settings

class OpenAIService:
    def __init__(self):
        self.settings = settings
        self.api_key = self.settings.openai_api_key
        self.endpoint = self.settings.openai_endpoint
        self.model = self.settings.openai_model

    def predict(self, image_bytes: bytes, prompt: str, model: str = None, **kwargs):
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        data = {
            "model": model or self.model,
            "messages": [
                {"role": "user", "content": [
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": "data:image/png;base64," + image_bytes.decode()}
                ]}
            ],
            **kwargs
        }
        response = requests.post(self.endpoint, json=data, headers=headers)
        response.raise_for_status()
        return response.json()
