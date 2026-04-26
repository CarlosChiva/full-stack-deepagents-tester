"""Tests for FastAPI authentication endpoints."""

import jwt


def test_create_token_success(client) -> None:
    """POST /auth/token with a valid body returns 200 and a token + bearer type."""
    response = client.post("/auth/token", json={"user_id": "test-user"})

    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"


def test_create_token_payload(client) -> None:
    """Verify a created JWT decodes with the expected user_id."""
    response = client.post("/auth/token", json={"user_id": "test-user"})
    token = response.json()["access_token"]

    decoded = jwt.decode(
        token,
        "test-secret-key-for-jwt-signing",
        algorithms=["HS256"],
    )

    assert "user_id" in decoded
    assert decoded["user_id"] == "test-user"


def test_verify_token_success(client) -> None:
    """Get a token via POST, then GET /auth/verify succeeds with it."""
    create_resp = client.post("/auth/token", json={"user_id": "test-user"})
    token = create_resp.json()["access_token"]

    verify_resp = client.get(
        "/auth/verify",
        headers={"Authorization": f"Bearer {token}"},
    )

    assert verify_resp.status_code == 200
    assert "user_id" in verify_resp.json()


def test_verify_token_invalid(client, invalid_token: str) -> None:
    """GET /auth/verify with a malformed token returns 401."""
    response = client.get(
        "/auth/verify",
        headers={"Authorization": f"Bearer {invalid_token}"},
    )

    assert response.status_code == 401


def test_verify_token_missing_authorization(client) -> None:
    """GET /auth/verify without an Authorization header returns 401."""
    response = client.get("/auth/verify")

    assert response.status_code == 401


def test_create_token_empty_body(client) -> None:
    """POST /auth/token with no body returns 422 or 400."""
    response = client.post("/auth/token")

    assert response.status_code in (422, 400)
