from pydantic import BaseSettings, Field

class Settings(BaseSettings):

    # Server settings
    host: str = Field("0.0.0.0", description="Server host")
    port: int = Field(8000, description="Server port")

    # OpenAI API settings
    openai_api_key: str = Field(..., env="OPENAI_API_KEY", description="OpenAI API key")
    openai_endpoint: str = Field("https://api.openai.com/v1/chat/completions", description="OpenAI API endpoint")
    openai_model: str = Field("gpt-4o", description="Default OpenAI model")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
