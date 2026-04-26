"""JWT token generation and validation service."""

from datetime import datetime, timedelta, timezone

import jwt

from app.config import settings

DEFAULT_TOKEN_EXPIRY_HOURS: int = 1


def create_token(user_data: dict) -> str:
    """Create a signed JWT for the given user data.

    Args:
        user_data: Dictionary containing at least ``"user_id"`` and any additional
            claims to embed in the payload.

    Returns:
        A signed JWT string valid for :data:`DEFAULT_TOKEN_EXPIRY_HOURS`.

    Raises:
        ValueError: If ``jwt.encode`` fails unexpectedly (should not happen with
            valid inputs).
    """
    now = datetime.now(tz=timezone.utc)
    payload: dict = {
        "user_id": user_data["user_id"],
        "iat": now,
        "exp": now + timedelta(hours=DEFAULT_TOKEN_EXPIRY_HOURS),
    }
    token: str = jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
    return token


def verify_token(token: str) -> dict:
    """Validate and decode a JWT.

    Args:
        token: A signed JWT string produced by :func:`create_token`.

    Returns:
        The decoded payload dictionary.

    Raises:
        jwt.ExpiredSignatureError: If the token has passed its ``exp`` time.
        jwt.InvalidTokenError: If the token is malformed, unsigned, or otherwise
            invalid.
    """
    payload: dict = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
    )
    return payload
