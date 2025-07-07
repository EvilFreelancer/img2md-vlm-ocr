import requests
import os
from app.settings import settings

class OpenAIService:
    def __init__(self):
        self.settings = settings
        self.api_key = self.settings.openai_api_key
        self.base_url = self.settings.openai_base_url
        self.model = self.settings.openai_api_model
        self.proxy = getattr(self.settings, 'openai_proxy', None)

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
        proxies = {"http": self.proxy, "https": self.proxy} if self.proxy else None
        response = requests.post(self.base_url, json=data, headers=headers, proxies=proxies)
        response.raise_for_status()
        return response.json()
