"""WebSocket route registration."""

import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from app.ws.manager import websocket_manager

logger = logging.getLogger(__name__)


def register_routes(app: FastAPI) -> None:
    """Register the WebSocket route on the given FastAPI app.

    Args:
        app: The FastAPI application instance.
    """

    @app.websocket("/ws/{thread_id}")
    async def ws_route(
        websocket: WebSocket,
        thread_id: str,
    ) -> None:
        """WebSocket endpoint: bridges client and DeepAgent bidirectional messages.

        Args:
            websocket: The FastAPI WebSocket connection instance.
            thread_id: Unique conversation thread identifier.
        """
        logger.info(f"WS route hit for thread_id={thread_id}")
        token = websocket.query_params.get("token", "")
        logger.info(f"Token found: {'Yes' if token else 'No'} (first 8 chars: {token[:8]})")
        try:
            await websocket_manager.connect(thread_id, websocket, token)
        except Exception as e:
            logger.error(f"WS handshake failed: {e}")
            await websocket.close()
            return

        logger.info(f"[WS Route] connection accepted for thread_id={thread_id}")

        try:
            await websocket_manager.process_messages(thread_id, websocket)
        except WebSocketDisconnect:
            pass
        except Exception:
            pass
