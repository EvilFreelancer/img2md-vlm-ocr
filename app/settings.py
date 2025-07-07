from pydantic import BaseSettings, Field

class Settings(BaseSettings):

    # Server settings
    host: str = Field(description="Server host (default: %(default)s)", default="0.0.0.0")
    port: int = Field(description="Server port (default: %(default)s)", default=8000)

    # OpenAI API settings
    openai_api_key: str = Field(description="OpenAI API key")
    openai_endpoint: str = Field(description="OpenAI API endpoint", default="https://api.openai.com/v1/chat/completions")
    openai_model: str = Field(description="Default OpenAI model", default="gpt-4o")
    openai_proxy: str = Field(description="Proxy URL for OpenAI API (optional)")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
