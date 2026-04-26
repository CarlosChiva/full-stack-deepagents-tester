from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

import jwt
from langchain_core.messages import BaseMessage

from fastapi import WebSocket, WebSocketDisconnect, status

from app.agent.manager import agent_manager
from app.auth.jwt import verify_token

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _message_to_dict(message: BaseMessage) -> dict[str, Any]:
    """Convert a LangChain ``BaseMessage`` to a JSON-serialisable dict."""
    return {
        "type": message.type,
        "role": getattr(message, "role", type(message).__name__.lower()),
        "content": message.content,
    }


def _convert_messages(messages: list[BaseMessage]) -> list[dict[str, Any]]:
    """Convert a list of LangChain messages to JSON dicts."""
    return [_message_to_dict(msg) for msg in messages]


@dataclass
class WebSocketSession:
    """Represents an active WebSocket session tied to a conversation thread."""
    thread_id: str


class WebSocketManager:
    """Manages WebSocket connections and bridges messages between clients and DeepAgents."""

    def __init__(self) -> None:
        self.sessions: dict[str, WebSocketSession] = {}

    async def connect(
        self,
        thread_id: str,
        websocket: WebSocket,
        token: str | None = None,
    ) -> None:
        """Accept a WebSocket connection after validating the JWT.

        Args:
            thread_id: Unique conversation thread identifier.
            websocket: The FastAPI WebSocket connection instance.
            token: JWT token from query param or header.

        Raises:
            WebSocketDisconnect: If JWT validation fails or connection is closed.
        """
        token_display = token[:8] if len(token) >= 8 else token
        logger.info(f"Connecting to thread_id=[{thread_id}] with token=[{token_display}]...")

        if not token:
            logger.warning(f"Connection rejected: missing token for thread_id=[{thread_id}]")
            await websocket.close(code=1008, reason="Missing token")
            raise WebSocketDisconnect(code=1008)

        try:
            claims = verify_token(token)
        except jwt.ExpiredSignatureError as exc:
            logger.error(f"Token verification failed: ExpiredSignatureError - {exc}")
            await websocket.close(code=1008, reason="Token expired")
            raise WebSocketDisconnect(code=1008, reason="Token expired") from exc
        except jwt.DecodeError as exc:
            logger.error(f"Token verification failed: DecodeError - {exc}")
            await websocket.close(code=1008, reason="Invalid token (decode error)")
            raise WebSocketDisconnect(code=1008, reason="Invalid token") from exc
        except jwt.InvalidTokenError as exc:
            logger.error(f"Token verification failed: InvalidTokenError - {exc}")
            await websocket.close(code=1008, reason="Invalid token")
            raise WebSocketDisconnect(code=1008, reason="Invalid token") from exc

        if not claims:
            logger.warning(f"Connection rejected: token verified but claims empty for thread_id=[{thread_id}]")
            await websocket.close(code=1008, reason="Invalid token")
            raise WebSocketDisconnect(code=1008)

        logger.info(f"Connection accepted for thread_id=[{thread_id}]")
        await websocket.accept()
        self.sessions[thread_id] = WebSocketSession(thread_id=thread_id)

    async def disconnect(self, thread_id: str) -> None:
        """Remove session and clean up agent on disconnect.

        Args:
            thread_id: The conversation thread to clean up.
        """
        if thread_id in self.sessions:
            del self.sessions[thread_id]
        agent_manager.remove_agent(thread_id)

    # Note: ``receive_message`` is no longer used by ``process_messages``.
    # The WebSocket pipeline now streams events directly.  Kept for
    # backward compatibility with any non-WS callers.
    # async def receive_message(self, thread_id: str, message: dict) -> dict:

    async def process_messages(self, thread_id: str, websocket: WebSocket) -> None:
        """Main bridge loop: receive from client, invoke agent with streaming,
        send each event back to the client via WebSocket.

        The agent's ``invoke()`` is now an **async generator** that yields
        structured events with a ``status`` field:

        * ``"token"`` — model token
        * ``"tool"`` — tool invocation
        * ``"thinking"`` — reasoning / reflection step
        * ``"answer"`` — final accumulated response

        Args:
            thread_id: The conversation thread identifier.
            websocket: The connected WebSocket instance.
        """
        # Check if agent exists
        existing = agent_manager.get_agent(thread_id)
        logger.info(f"[WS] process_messages START thread_id={thread_id}, existing_agent={existing is not None}, pool_keys={list(agent_manager.agent_pool.keys())}")

        if existing is None:
            logger.info(f"[WS] Agent not found for thread_id={thread_id}, calling create_agent()...")
            try:
                config = agent_manager.create_agent(thread_id)
                logger.info(f"[WS] create_agent() succeeded for thread_id={thread_id}, config keys={list(config.get('configurable', {}).keys()) if config else 'N/A'}")
            except Exception as exc:
                logger.error(f"[WS] create_agent() FAILED for thread_id={thread_id}: {exc}", exc_info=True)
                await websocket.close(code=1011, reason=f"Failed to create agent: {exc}")
                raise WebSocketDisconnect(code=1011)

        # Verify agent exists after creation attempt
        verified = agent_manager.get_agent(thread_id)
        logger.info(f"[WS] Agent verification POST-creation: thread_id={thread_id}, agent_exists={verified is not None}")
        if verified is None:
            logger.error(f"[WS] CRITICAL: Agent still not found after create_agent() was called! pool_keys={list(agent_manager.agent_pool.keys())}")
            await websocket.close(code=1011, reason="Agent creation failed silently")
            raise WebSocketDisconnect(code=1011)

        try:
            while True:
                data = await websocket.receive_json()
                content = data.get("content") or data.get("message", "")

                async for event in agent_manager.invoke(thread_id, content):
                    # --- Transform internal agent-event format to the documented
                    #     WebSocket protocol format so the frontend can parse it.
                    #     Internal:  {"status": "<token|tool|thinking|answer>", "data": ...}
                    #     Protocol:  {"type": "<token|tool_call|done>", "content": ...}
                    #     (tool_call events carry "name" + "args" instead of "content".)
                    raw_status = event.get("status", "unknown")
                    raw_data = event.get("data")

                    if raw_status == "token":
                        ws_payload: dict[str, Any] = {
                            "type": "token",
                            "content": str(raw_data) if raw_data else "",
                        }
                        logger.debug(
                            "[WS] Sending event: type=token, content_len=%d",
                            len(ws_payload["content"]),
                        )
                    elif raw_status == "thinking":
                        # thinking → treat as streaming token so chunks appear live
                        ws_payload = {
                            "type": "token",
                            "content": str(raw_data) if raw_data else "",
                        }
                        logger.debug(
                            "[WS] Sending event: type=thinking-as-token, content_len=%d",
                            len(ws_payload["content"]),
                        )
                    elif raw_status == "tool":
                        tool_info = raw_data if isinstance(raw_data, dict) else {"name": str(raw_data) or "unknown"}
                        ws_payload = {
                            "type": "tool_call",
                            "content": "",
                            "name": tool_info.get("name", "unknown"),
                            "args": tool_info.get("args", {}),
                        }
                        logger.info("[WS] Sending event: type=tool_call, tool=%s", ws_payload["name"])
                    elif raw_status == "answer":
                        ws_payload = {
                            "type": "done",
                            "content": str(raw_data) if raw_data else "",
                        }
                        logger.info("[WS] Sending event: type=done")
                    else:
                        # Fallback for unmapped event types
                        ws_payload = {
                            "type": "done",
                            "content": str(raw_data) if raw_data else "",
                        }
                        logger.info("[WS] Sending event: type=<fallback>%s, data=%s", raw_status, str(raw_data)[:200])

                    await websocket.send_json(ws_payload)
        except WebSocketDisconnect:
            pass
        except Exception as exc:
            logger.error(f"Error processing message for thread_id={thread_id}: {exc}", exc_info=True)
        finally:
            await self.disconnect(thread_id)

    def is_connected(self, thread_id: str) -> bool:
        """Check if a thread_id has an active session.

        Args:
            thread_id: The conversation thread identifier.

        Returns:
            True if a session exists, False otherwise.
        """
        return thread_id in self.sessions


# Module-level singleton
websocket_manager = WebSocketManager()