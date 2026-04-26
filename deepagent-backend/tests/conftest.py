"""Shared pytest fixtures for the FastAPI + LangChain DeepAgent bridge project."""

from __future__ import annotations

from unittest.mock import patch

import jwt
import pytest

from app.agent.manager import AgentManager
from app.auth.jwt import DEFAULT_TOKEN_EXPIRY_HOURS
from app.config import settings
from app.main import app


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

TEST_JWT_SECRET: str = "test-secret-key-for-jwt-signing"
TEST_THREAD_IDS: list[str] = []
"""Thread IDs created during a test run so ``cleanup_thread`` can track them."""


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch, mock_jwt_secret: str):
    """Return a ``fastapi.testclient.TestClient`` for the application.

    Overrides the JWT secret so that token-based tests are deterministic and do
    not require a real API key.  Patches the LangChain / OpenAI machinery so the
    ``AgentManager.create_agent`` call never reaches OpenAI.
    """
    # Patch settings so every component reads the test values, avoiding
    # any live env lookups (OPENAI_API_KEY, etc.).
    monkeypatch.setattr(settings, "jwt_secret", TEST_JWT_SECRET)
    monkeypatch.setattr(settings, "openai_api_key", "test-api-key")
    monkeypatch.setattr(settings, "agent_model", "openai:gpt-4.1")

    # Mock the agent creation so no real LLM call is attempted.
    def fake_create_agent(self: AgentManager, thread_id: str) -> dict:
        """Stow a fake agent entry without calling ChatOpenAI / LLM."""
        from datetime import datetime, timezone

        config = {
            "configurable": {
                "thread_id": thread_id,
                "recursion_limit": settings.recursion_limit,
            }
        }
        self.agent_pool[thread_id] = {
            "agent": None,
            "config": config,
            "created_at": datetime.now(timezone.utc),
            "message_count": 0,
        }
        TEST_THREAD_IDS.append(thread_id)
        return config

    with patch.object(AgentManager, "create_agent", fake_create_agent):
        from fastapi.testclient import TestClient

        _client = TestClient(app)
        yield _client


@pytest.fixture()
def mock_jwt_secret(monkeypatch: pytest.MonkeyPatch) -> str:
    """Return the test JWT secret and apply it via ``monkeypatch``.

    Call fixtures can override the JWT secret used by ``app.config`` so that
    ``create_token`` produces predictable values.
    """
    monkeypatch.setattr(settings, "jwt_secret", TEST_JWT_SECRET)
    return TEST_JWT_SECRET


@pytest.fixture()
def agent_manager(mock_jwt_secret: str):
    """Provide a fresh ``AgentManager`` for each test.

    Agent creation is patched so no real LLM is spawned.
    """
    manager = AgentManager()

    def fake_create_agent(self: AgentManager, thread_id: str) -> dict:
        config = {
            "configurable": {
                "thread_id": thread_id,
                "recursion_limit": settings.recursion_limit,
            }
        }
        self.agent_pool[thread_id] = {
            "agent": None,
            "config": config,
            "created_at": None,
            "message_count": 0,
        }
        return config

    with patch(AgentManager.create_agent, fake_create_agent):
        yield manager


@pytest.fixture()
def valid_token(mock_jwt_secret: str) -> str:
    """Return a valid JWT token string for ``"test-user"``.

    Generates the token directly with the test secret to avoid any live
    ``app.config`` / ``settings`` lookup.
    """
    import time

    now = int(time.time())
    payload = {
        "user_id": "test-user",
        "iat": now,
        "exp": now + DEFAULT_TOKEN_EXPIRY_HOURS * 3600,
    }
    return jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")


@pytest.fixture()
def invalid_token() -> str:
    """Return a deliberately malformed JWT string."""
    return "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.signature"


@pytest.fixture()
def thread_id() -> str:
    """Return a predictable, unique thread ID for use in tests."""
    return "test-thread-001"


@pytest.fixture()
def cleanup_thread(agent_manager: AgentManager):
    """Ensure any agents created with *agent_manager* are removed after the test.

    Clears tracked thread IDs from the agent pool so tests are fully isolated.
    """
    yield agent_manager

    for tid in TEST_THREAD_IDS:
        agent_manager.remove_agent(tid)

    TEST_THREAD_IDS.clear()
