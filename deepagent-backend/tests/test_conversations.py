"""Tests for conversation management endpoints (GET and DELETE)."""

from __future__ import annotations

import pytest

from typing import Any

from app.api.conversations import agent_manager as _conversation_manager
from app.config import settings


def _register_agent(agent_manager: Any, thread_id: str) -> dict[str, Any]:
    """Stow a fake agent entry into *agent_manager*'s pool."""
    config = {
        "configurable": {
            "thread_id": thread_id,
            "recursion_limit": settings.recursion_limit,
        }
    }
    agent_manager.agent_pool[thread_id] = {
        "agent": None,
        "config": config,
        "created_at": None,
        "message_count": 0,
    }
    return config


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


def _ensure_agent_pool(monkeypatch: pytest.MonkeyPatch) -> Any:
    """Return the *mocked* AgentManager instance used by the conversations router.

    Patches ``agent_manager.agent_pool`` with a fresh dict so tests can
    register / remove agents without affecting other tests.  Returns both
    the patched dict and the manager instance for convenience.
    """
    pool: dict = {}
    monkeypatch.setattr(_conversation_manager, "agent_pool", pool)
    return pool, _conversation_manager


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_conversation_get_non_existent(client: Any) -> None:
    """GET /conversations/{thread_id} for a non-existent thread returns 404."""
    response = client.get("/conversations/some-nonexistent-thread")

    assert response.status_code == 404


def test_conversation_delete_non_existent(client: Any) -> None:
    """DELETE /conversations/{thread_id} for a non-existent thread returns 404."""
    response = client.delete("/conversations/some-nonexistent-thread")

    assert response.status_code == 404


def test_conversation_get_returns_status(
    client: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    """GET on a thread that has an agent returns 200 with status data."""
    pool, mgr = _ensure_agent_pool(monkeypatch)
    thread_id = "test-thread-get-status"

    _register_agent(mgr, thread_id)

    response = client.get(f"/conversations/{thread_id}")

    assert response.status_code == 200
    data = response.json()
    assert data["thread_id"] == thread_id
    assert data["status"] == "active"
    assert data["agent_available"] is True


def test_conversation_delete_returns_204_on_existing(
    client: Any, monkeypatch: pytest.MonkeyPatch
) -> None:
    """DELETE on a thread that has an agent returns 204."""
    pool, mgr = _ensure_agent_pool(monkeypatch)
    thread_id = "test-thread-delete"

    _register_agent(mgr, thread_id)

    response = client.delete(f"/conversations/{thread_id}")

    assert response.status_code == 204


def test_conversation_status_json(client: Any, monkeypatch: pytest.MonkeyPatch) -> None:
    """GET a thread that exists; response is JSON with a thread_id field."""
    pool, mgr = _ensure_agent_pool(monkeypatch)
    thread_id = "test-thread-status-json"

    _register_agent(mgr, thread_id)

    response = client.get(f"/conversations/{thread_id}")

    assert response.status_code == 200
    data = response.json()
    assert "thread_id" in data
