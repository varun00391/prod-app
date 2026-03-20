from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Override with env MONGODB_URI (e.g. Atlas: mongodb+srv://user:pass@cluster.mongodb.net/...)
    # mongodb_uri: str = "mongodb://localhost:27017"
    MONGODB_URI: str = "mongodb+srv://varunsingh2191:ivOP52Gn9ofBDeKs@cluster0.ixt0lag.mongodb.net/?appName=Cluster0&tlsAllowInvalidCertificates=true"
    mongodb_db: str = "chatgpt_app"
    redis_url: str | None = None
    groq_api_key: str | None = None  # Can be overridden per-request
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    class Config:
        env_file = ".env"


settings = Settings()
