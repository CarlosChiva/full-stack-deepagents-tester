"""Application configuration — loaded from environment variables."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings loaded from ``os.environ`` (or a ``.env`` file).

    The class uses the Pydantic v2 ``pydantic_settings`` API with
    ``SettingsConfigDict`` so that a ``.env`` file is discovered automatically
    alongside the module path.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # ---- Authentication -------------------------------------------------
    jwt_secret: str
    """Secret key for JWT token signing and verification (minimum 32 characters).

    Mapped to environment variable ``JWT_SECRET`` — no default, must be
    provided at runtime.
    """

    jwt_algorithm: str = "HS256"
    """JWT signing algorithm (e.g. ``HS256``, ``RS256``, ``ES256``)."""

    # ---- AI Agent Configuration -----------------------------------------
    agent_model: str = "openai:gpt-4.1"
    """LLM model identifier for the DeepAgent bridge.

    Format: ``<provider>.<model-name>`` (e.g. ``openai:gpt-4.1``).
    """

    openai_api_key: str
    """API key (or equivalent) for the chosen LLM provider.

    Mapped to environment variable ``OPENAI_API_KEY`` — no default,
    must be provided at runtime.
    """

    openai_api_base_url: str = "https://api.openai.com/v1"
    """Base URL for the OpenAI API.

    Useful when proxying through Azure, Ollama, or other compatible providers.
    Mapped to environment variable ``OPENAI_API_BASE_URL``.
    """

    model_temperature: float = 0.7
    """Sampling temperature for the LLM (0.0 – 1.0).

    Higher values produce more random output; lower values are more deterministic.
    Mapped to environment variable ``MODEL_TEMPERATURE``.
    """

    # ---- Agent Runtime Settings -----------------------------------------
    recursion_limit: int = 10
    """Maximum number of reasoning steps an agent can take in a single invocation.

    Higher values allow deeper reasoning but consume more tokens and
    take longer.
    """

    # ---------------------------------------------------------------------

    @property
    def config(self) -> dict:
        """Return a dictionary of all settings for external consumption."""
        return {
            "jwt_secret": self.jwt_secret,
            "jwt_algorithm": self.jwt_algorithm,
            "agent_model": self.agent_model,
            "openai_api_key": self.openai_api_key,
            "openai_api_base_url": self.openai_api_base_url,
            "model_temperature": self.model_temperature,
            "recursion_limit": self.recursion_limit,
        }


settings = Settings()
"""Singleton ``Settings`` instance — import this from anywhere in the app."""
