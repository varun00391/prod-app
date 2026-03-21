from pydantic_settings import BaseSettings

# 1
class Settings(BaseSettings):
    # Must be `mongodb_uri`: code uses `settings.mongodb_uri` (see database.py).
    # Override with env MONGODB_URI (pydantic-settings maps it to this field).
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "chatgpt_app"
    redis_url: str | None = None
    groq_api_key: str | None = None  # Can be overridden per-request
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"


settings = Settings()
