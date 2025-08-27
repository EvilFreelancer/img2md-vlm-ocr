from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Server configuration
    host: str = Field(default="0.0.0.0", description="Server host (default: %(default)s)")
    port: int = Field(default=8000, description="Server port (default: %(default)s)")
    
    # OpenAI API VLM configuration
    openai_api_key: str = Field(description="OpenAI API key")
    openai_base_url: str = Field(default="https://localhost/v1", description="OpenAI Base URL")
    openai_api_model: str = Field(default="qwen2.5vl:32b", description="Default OpenAI model")
    openai_proxy: str | None = Field(default=None, description="Proxy URL for OpenAI API (optional)")

    # Segmentator model configuration
    segmentator_repo: str = Field(default="DILHTWD/documentlayoutsegmentation_YOLOv8_ondoclaynet", description="YOLO segmentator model repo")
    segmentator_filename: str = Field(default="yolov8x-doclaynet-epoch64-imgsz640-initiallr1e-4-finallr1e-5.pt", description="YOLO segmentator model filename")
    segmentator_models_dir: str = Field(default="models", description="Directory for segmentator model weights")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="allow",
    )

settings = Settings()
