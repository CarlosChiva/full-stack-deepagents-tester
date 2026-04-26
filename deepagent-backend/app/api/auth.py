"""Authentication API endpoints.

Provides token creation and verification routes.
"""

from fastapi import APIRouter, HTTPException, Request, status

from app.auth.jwt import create_token, verify_token
from app.config import settings
from app.models.schemas import TokenRequest, TokenResponse

router = APIRouter(tags=["authentication"])

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post("/token", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def get_token(body: TokenRequest) -> TokenResponse:
    """Issue a JWT access token for the given user_id.

    Args:
        body: Request containing the ``user_id`` to issue a token for.

    Returns:
        The generated JWT access token and its type.

    Raises:
        HTTPException: Raised with 500 status if token generation fails unexpectedly.
    """
    try:
        token: str = create_token({"user_id": body.user_id})
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate token: {exc}",
        ) from exc

    return TokenResponse(access_token=token, token_type="bearer")


@router.get("/verify", status_code=status.HTTP_200_OK)
def verify(request: Request) -> dict:
    """Validate a bearer token from the ``Authorization`` header.

    Args:
        request: The incoming HTTP request containing the Authorization header.

    Returns:
        The decoded JWT claims dictionary if the token is valid.

    Raises:
        HTTPException: 400 if the header is missing or the format is not ``"Bearer <token>"``.
        HTTPException: 401 if the token is invalid or expired.
    """
    auth_header: str | None = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing or malformed Authorization header (expected: Bearer <token>)",
        )

    token: str = auth_header[len("Bearer "):]

    try:
        claims: dict = verify_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    return claims
