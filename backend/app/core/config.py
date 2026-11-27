from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "NQLa API"
    api_v1_prefix: str = "/api/v1"
    environment: Literal["development", "test", "production"] = "development"
    database_url: str = "postgresql+psycopg://localhost/nqla"
    jwt_secret_key: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(default=30, gt=0)
    driver_location_max_age_seconds: int = Field(default=120, gt=0)
    matching_radius_meters: int = Field(default=5000, gt=0)
    matching_average_speed_kmh: float = Field(default=20, gt=0)
    matching_weights_proximity: float = Field(default=0.45, ge=0)
    matching_weights_eta: float = Field(default=0.25, ge=0)
    matching_weights_route_compatibility: float = Field(default=0.30, ge=0)
    cors_origins: str = "*"

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
