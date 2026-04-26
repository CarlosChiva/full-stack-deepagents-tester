"""Tests for the WebSocket endpoint at /ws/{thread_id}."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient


def test_websocket_connect_valid_token(
    client: TestClient, valid_token: str, thread_id: str
) -> None:
    """Assert that a valid JWT allows the WebSocket connection to be established and a
    response to be received."""
    with client.websocket_connect(
        f"/ws/{thread_id}?token={valid_token}"
    ) as websocket:
        data = websocket.receive_json()
        assert data is not None


def test_websocket_connect_invalid_token(
    client: TestClient, invalid_token: str, thread_id: str
) -> None:
    """Assert that a malformed / invalid JWT is rejected with a 401 close code."""
    with pytest.raises(Exception) as exc_info:
        client.websocket_connect(
            f"/ws/{thread_id}?token={invalid_token}"
        )
    assert exc_info.value.code == 1008


def test_websocket_connect_no_token(
    client: TestClient, thread_id: str
) -> None:
    """Assert that connecting without a ``token`` query parameter is rejected."""
    with pytest.raises(Exception) as exc_info:
        client.websocket_connect(f"/ws/{thread_id}")
    assert exc_info.value.code == 1008


def test_websocket_send_receive(
    client: TestClient, valid_token: str, thread_id: str
) -> None:
    """Assert that a message sent over a valid WebSocket is echoed back by the agent."""
    with client.websocket_connect(
        f"/ws/{thread_id}?token={valid_token}"
    ) as websocket:
        message = {"type": "message", "content": "Hello"}
        websocket.send_json(message)
        response = websocket.receive_json()
        assert response is not None