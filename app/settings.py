from pydantic import Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    host: str = Field(default="0.0.0.0", description="Server host (default: %(default)s)")
    port: int = Field(default=8000, description="Server port (default: %(default)s)")
    openai_api_key: str = Field(description="OpenAI API key")
    openai_base_url: str = Field(default="https://api.openai.com/v1", description="OpenAI Bese URI")
    openai_api_model: str = Field(default="gpt-4o", description="Default OpenAI model")
    openai_proxy: str | None = Field(default=None, description="Proxy URL for OpenAI API (optional)")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"

settings = Settings()
