"""Agent lifecycle management — creates and stores DeepAgent instances
per thread, driven by configuration loaded from
``deep_agents_config.json``.

The :class:`AgentManager` reads the agent configuration via
:mod:`~app.agent.config_loader` at instantiation time, and creates
DeepAgent instances (built via ``create_deep_agent`` from the
``deepagents`` package) that manage LLM calls, tools, sub-agents,
checkpointer, and memory.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger(__name__)

from app.agent.config_loader import config as load_config, set_environment
from app.agent.deep_agent import build_deep_agent,  invoke_deep_agent_streaming


class AgentManager:
    """Manages creation, lifecycle, and invocation of DeepAgents keyed by thread.

    Reads its configuration from ``deep_agents_config.json`` at
    instantiation time. Each thread gets its own DeepAgent instance
    (built via ``create_deep_agent``) with LangGraph persistence,
    tool-use, and sub-agent support.
    """

    def __init__(self) -> None:
        """Initialize the manager, load config, and set environment vars."""
        self.agent_pool: dict[str, dict] = {}
        self._cfg = load_config()
        set_environment(self._cfg)
        self._active_agent_id: str = self._cfg.deep_agents[0].id if self._cfg.deep_agents else "general-assistant"

    @property
    def active_agent_id(self) -> str:
        return self._active_agent_id

    def set_active_agent(self, agent_id: str) -> bool:
        found = self._cfg.get_agent_by_id(agent_id)
        if found is None:
            return False
        self._active_agent_id = agent_id
        return True

    def agent_config(self) -> Any:
        found = self._cfg.get_agent_by_id(self._active_agent_id)
        if found is None:
            raise ValueError(f"Unknown agent id: {self._active_agent_id}")
        return found

    def create_agent(self, thread_id: str) -> dict:
        """Create a new DeepAgent for *thread_id*.

        Parameters
        ----------
        thread_id:
            Unique conversation identifier.

        Returns
        -------
        dict
            Config dict with ``thread_id`` and ``recursion_limit``.
        """
        logger.info("Creating agent for thread_id=%s, using agent_id=%s", thread_id, self._active_agent_id)
        try:
            agent_cfg = self.agent_config()

            deep_agent, config = build_deep_agent(agent_cfg)

            # Update config with the actual thread_id
            config["configurable"]["thread_id"] = thread_id

            self.agent_pool[thread_id] = {
                "deep_agent": deep_agent,
                "config": config,
                "created_at": datetime.now(timezone.utc),
                "message_count": 0,
            }
            logger.info(f"[AgentManager] Agent stored in pool: thread_id={thread_id}, agent_pool_size={len(self.agent_pool)}, pool_keys={list(self.agent_pool.keys())}")
            logger.info("Agent built successfully for thread_id=%s", thread_id)
            return config
        except Exception as e:
            logger.error("Failed to create agent for thread_id=%s: %s", thread_id, e, exc_info=True)
            raise

    def get_agent(self, thread_id: str) -> Optional[dict]:
        return self.agent_pool.get(thread_id)

    def remove_agent(self, thread_id: str) -> bool:
        if thread_id in self.agent_pool:
            del self.agent_pool[thread_id]
            return True
        return False

    def get_status(self, thread_id: str) -> Optional[dict]:
        entry = self.agent_pool.get(thread_id)
        if entry is None:
            return None
        return {
            "thread_id": thread_id,
            "status": "active",
            "agent_available": True,
        }

    async def invoke(self, thread_id: str, user_message: str):
        """Send *user_message* to the DeepAgent associated with *thread_id*.

        Returns an **async generator** that yields streaming events:

        ``{"status": "token", ...}``  — model tokens
        ``{"status": "tool", ...}``  — tool invocations
        ``{"status": "thinking", ...}`` — reasoning/thinking steps
        ``{"status": "answer", ...}`` — final accumulated response

        Parameters
        ----------
        thread_id:
            The conversation thread to invoke.
        user_message:
            Human-written message content.
        """
        logger.info(f"[AgentManager] invoke() called thread_id={thread_id}, pool_keys={list(self.agent_pool.keys())}")
        entry = self.get_agent(thread_id)
        if entry is None:
            raise ValueError(f"No agent found for thread_id={thread_id!r}")

        logger.info("Invoking agent for thread_id=%s, message_count=%s", thread_id, entry["message_count"])

        deep_agent = entry["deep_agent"]
        config = entry["config"]

        entry["message_count"] += 1

        async for event in invoke_deep_agent_streaming(deep_agent, config, user_message):
            event_type = event.get("status", "unknown")
            if event_type in ("token", "thinking"):
                data_len = len(str(event.get("data", "")))
                logger.debug("Event emitted: type=%s, data_len=%d", event_type, data_len)
            elif event_type == "tool":
                tool_name = event.get("data", {}).get("name", "") if isinstance(event.get("data"), dict) else str(event.get("data", ""))
                logger.info("Event emitted: type=%s, tool=%s", event_type, tool_name)
            else:
                data_summary = str(event.get("data", ""))[:200]
                logger.info("Event emitted: type=%s, data=%s", event_type, data_summary)
            yield event
        logger.info("Agent invocation completed for thread_id=%s", thread_id)


agent_manager = AgentManager()
"""Module-level singleton :class:`AgentManager`."""
