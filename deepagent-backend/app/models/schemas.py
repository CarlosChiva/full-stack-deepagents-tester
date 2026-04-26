"""Application API schemas — Pydantic v2 request and response models."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------

class TokenRequest(BaseModel):
    """Schema for obtaining a JWT access token."""

    model_config = ConfigDict(json_schema_extra={"examples": [{"user_id": "alice"}]})

    user_id: str = Field(
        ...,
        description="Unique identifier of the user requesting a token",
    )


class WebSocketMessage(BaseModel):
    """Schema for a message sent over the WebSocket connection."""

    type: Literal["message"] = "message"
    """Type discriminator — always ``"message"`` for client-initiated messages."""

    content: str = Field(
        ...,
        description="The message content sent by the client",
    )


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class TokenResponse(BaseModel):
    """Schema for authentication token responses."""

    model_config = ConfigDict(from_attributes=True)

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class HealthResponse(BaseModel):
    """Schema for healthcheck endpoint responses."""

    status: str = Field(default="ok")
    service: str = Field(default="the_backend")


class ConversationStatus(BaseModel):
    """Schema for returning the status of an agent conversation."""

    model_config = ConfigDict(json_schema_extra={"examples": [{"thread_id": "th_1", "status": "active", "agent_available": True}]})

    thread_id: str = Field(..., description="Unique thread identifier")
    status: Literal["active"] = "active"
    """Conversation status — currently only ``"active"`` is supported."""

    agent_available: bool = Field(default=True, description="Whether an agent is currently available to respond")


class ConversationCreateResponse(BaseModel):
    """Schema for the response when creating a new conversation."""

    model_config = ConfigDict(json_schema_extra={"examples": [{"thread_id": "550e8400-e29b-41d4-a716-446655440000"}]})

    thread_id: str = Field(..., description="Unique UUID of the newly created conversation thread")


class ConversationListItem(BaseModel):
    """Schema for a single conversation item in the list response."""

    model_config = ConfigDict(json_schema_extra={"examples": [{"thread_id": "abc123", "message_count": 5, "last_activity": "2025-01-01T00:00:00Z", "is_alive": True}]})

    thread_id: str = Field(..., description="Unique thread identifier")
    message_count: int = Field(default=0, description="Number of messages exchanged in this conversation")
    last_activity: str | None = Field(default=None, description="ISO 8601 timestamp of the most recent activity")
    is_alive: bool = Field(default=True, description="Whether the conversation agent is still active")


class ConversationListResponse(BaseModel):
    """Schema for listing all active conversations."""

    model_config = ConfigDict(json_schema_extra={"examples": [{"conversations": [{"thread_id": "abc123", "message_count": 5, "last_activity": None, "is_alive": True}]}]})

    conversations: list[ConversationListItem] = Field(default_factory=list, description="List of active conversations")


class AgentMessage(BaseModel):
    """Schema emitted by the agent over the WebSocket stream."""

    model_config = ConfigDict(extra="allow")

    type: str = Field(..., description="Message type (e.g. ``'response'`` , ``'thinking'``)")
    content: str = Field(..., description="Message content / payload")
