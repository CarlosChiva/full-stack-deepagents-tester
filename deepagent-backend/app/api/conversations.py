"""Conversation management endpoints — GET, POST, LIST, and DELETE conversations by thread."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Path, status

from app.agent.manager import agent_manager
from app.auth.jwt import verify_token
from app.models.schemas import (
    ConversationCreateResponse,
    ConversationListItem,
    ConversationListResponse,
    ConversationStatus,
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Authentication dependency
# ---------------------------------------------------------------------------


def get_current_user(authorization: Annotated[str | None, Header()] = None) -> dict:
    """Extract and verify the JWT from the ``Authorization`` header.

    Returns the decoded claims dict on success.

    Raises
    ------
    HTTPException
        401 if the header is missing, malformed, or the token is invalid/expired.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header (expected: Bearer <token>)",
        )

    token: str = authorization[len("Bearer "):]

    try:
        claims: dict = verify_token(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        ) from exc

    return claims


CurrentUserDep = Annotated[dict, Depends(get_current_user)]


# ---------------------------------------------------------------------------
# POST /conversations — create a new conversation
# ---------------------------------------------------------------------------


@router.post("/", response_model=ConversationCreateResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    _current_user: CurrentUserDep,
) -> ConversationCreateResponse:
    """Create a new conversation and return its thread_id.

    A unique UUID4 is generated and an agent is registered in the AgentPool
    for that thread.

    Returns:
        ConversationCreateResponse: The newly generated ``thread_id``.

    Raises:
        HTTPException: 500 if agent registration fails.
    """
    new_thread_id = str(uuid.uuid4())
    try:
        agent_manager.create_agent(new_thread_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create conversation: {exc}",
        ) from exc

    return ConversationCreateResponse(thread_id=new_thread_id)


# ---------------------------------------------------------------------------
# GET /conversations — list all active conversations
# ---------------------------------------------------------------------------


@router.get("/", response_model=ConversationListResponse, status_code=status.HTTP_200_OK)
def list_conversations(
    _current_user: CurrentUserDep,
) -> ConversationListResponse:
    """Return metadata for every active conversation in the AgentPool.

    Returns:
        ConversationListResponse: List of conversation summaries including
            ``thread_id``, ``message_count``, ``last_activity``, and ``is_alive``.
    """
    conversations: list[ConversationListItem] = []

    for thread_id, entry in agent_manager.agent_pool.items():
        created_at: datetime | None = entry.get("created_at")
        last_activity: str | None = (
            created_at.isoformat() if created_at else None
        )
        conversations.append(
            ConversationListItem(
                thread_id=thread_id,
                message_count=entry.get("message_count", 0),
                last_activity=last_activity,
                is_alive=entry.get("deep_agent") is not None,
            )
        )

    return ConversationListResponse(conversations=conversations)


@router.get("/{thread_id}", response_model=ConversationStatus, status_code=status.HTTP_200_OK)
def get_conversation(
    thread_id: Annotated[str, Path(description="Unique conversation thread identifier")],
) -> ConversationStatus:
    """Retrieve the status of a conversation identified by *thread_id*.

    Args:
        thread_id: Unique identifier of the conversation to retrieve.

    Returns:
        ConversationStatus: The current status of the conversation.

    Raises:
        HTTPException: Returns a 404 error if no conversation is found for
            the given *thread_id*.
    """
    status_data = agent_manager.get_status(thread_id)
    if status_data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with thread_id={thread_id!r} not found",
        )

    return ConversationStatus(**status_data)


@router.delete("/{thread_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    thread_id: Annotated[str, Path(description="Unique conversation thread identifier")],
) -> None:
    """Delete a conversation identified by *thread_id*.

    Args:
        thread_id: Unique identifier of the conversation to delete.

    Returns:
        None: Returns 204 No Content on successful deletion.

    Raises:
        HTTPException: Returns a 404 error if no conversation is found for
            the given *thread_id*.
    """
    removed = agent_manager.remove_agent(thread_id)
    if not removed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation with thread_id={thread_id!r} not found",
        )
