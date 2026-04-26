"""Deep Agents configuration loader — reads ``deep_agents_config.json``
and returns validated, typed configuration objects.

The configuration file is located relative to the project root:
``<project_root>/deep_agents_config.json``.  If the file does not exist,
a sensible inline default is used so the application still boots without
a separate config file.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class MCPConfig(BaseModel):
    """A single MCP (Model Context Protocol) server definition.

    Supports three transport types:

    * ``"stdio"`` — spawn a subprocess with *command* / *args*.
    * ``"http"``  — connect to an existing HTTP MCP endpoint via *url*.
    * ``"streamable_http"`` — connect to a Streamable HTTP MCP endpoint via *url*.

    Attributes
    ----------
    command:
        Executable for ``stdio`` transports (mutually exclusive with
        ``url``).
    args:
        Argument list passed to *command* for ``stdio`` transports.
    url:
        Full HTTP URL for ``http`` / ``streamable_http`` transports
        (mutually exclusive with ``command``).
    transport:
        One of ``"stdio"``, ``"http"``, ``"streamable_http"``.  Defaults
        to ``"stdio"`` when ``command`` is present, ``"http"`` when
        ``url`` is present.
    """

    model_config = ConfigDict(extra="allow")

    command: str | None = None
    args: list[str] | None = None
    url: str | None = None
    transport: str | None = None

    @field_validator("transport")
    @classmethod
    def _validate_transport(cls, v: str | None) -> str:
        allowed = {"stdio", "http", "streamable_http"}
        if v is None:
            return "stdio"
        if v not in allowed:
            raise ValueError(
                f"transport must be one of {allowed}, got '{v}'"
            )
        return v

    @field_validator("command")
    @classmethod
    def _validate_command(cls, v: str | None, info) -> str | None:
        url = info.data.get("url")
        if v is not None and url is not None:
            raise ValueError("Cannot specify both command and url")
        return v

    def _to_sdk_dict(self) -> dict[str, Any]:
        """Convert this MCPConfig to the dict format expected by
        *langchain-mcp-adapters*."""
        result: dict[str, Any] = {
            "command": self.command,
            "args": self.args,
            "url": self.url,
            "transport": self.transport,
        }
        # Remove None keys so they are not passed to the SDK
        return {k: v for k, v in result.items() if v is not None}


class InternalAgentConfig(BaseModel):
    """An internal (sub-) agent that the deep agent can call via tools.

    Inherits ``model`` and ``temperature`` defaults from the parent
    when not explicitly specified.
    """

    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    description: str
    instructions: str
    model: str
    tools: List[str] = Field(default_factory=list)
    temperature: float = 0.7
    max_recursion: int = 10
    mcp_servers: dict[str, MCPConfig] | None = None


class DeepAgentConfig(BaseModel):
    """A single deep-agent definition from the config file.

    Attributes
    ----------
    id:
        Unique identifier for the agent.
    name:
        Human-readable name.
    description:
        Short description of the agent's purpose.
    instructions:
        System prompt / persona instructions.
    model:
        Provider-prefixed model identifier, e.g. ``openai:gpt-4.1``.
    temperature:
        Sampling temperature in the range ``[0.0, 1.0]``.
    max_recursion:
        Maximum number of reasoning steps (API calls per invocation).
    internal_agents:
        Sub-agents that the deep agent can invoke as tools.
    """

    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    description: str
    instructions: str
    model: str
    temperature: float = 0.7
    max_recursion: int = 10
    tools: List[str] = Field(default_factory=list)
    internal_agents: List[InternalAgentConfig] = Field(default_factory=list)
    mcp_servers: dict[str, MCPConfig] | None = None

    @field_validator("temperature")
    @classmethod
    def _validate_temperature(cls, v: float) -> float:
        if v < 0.0 or v > 1.0:
            raise ValueError("temperature must be between 0.0 and 1.0")
        return v


class DeepAgentsConfig(BaseModel):
    """Top-level validated configuration object.

    Attributes
    ----------
    environment:
        Dict mapping environment variable names to their values
        (as raw strings).
    deep_agents:
        List of deep-agent definitions.
    """

    model_config = ConfigDict(extra="forbid")

    environment: Dict[str, str] = Field(default_factory=dict)
    deep_agents: List[DeepAgentConfig]

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------

    @field_validator("deep_agents")
    @classmethod
    def _validate_no_duplicate_ids(
        cls, agents: List[DeepAgentConfig]
    ) -> List[DeepAgentConfig]:
        ids = [a.id for a in agents]
        if len(ids) != len(set(ids)):
            raise ValueError("deep_agents must have unique ``id`` values")
        return agents

    def get_agent_by_id(self, agent_id: str) -> Optional[DeepAgentConfig]:
        """Return the agent with the given *agent_id*, or ``None``."""
        for agent in self.deep_agents:
            if agent.id == agent_id:
                return agent
        return None


# ---------------------------------------------------------------------------
# Default inline config (used when the JSON file is absent)
# ---------------------------------------------------------------------------

_DEFAULT_JSON: Dict[str, Any] = {
    "environment": {
        "AGENT_MODEL": "openai:gpt-4.1",
        "OPENAI_API_KEY": "",
        "OPENAI_API_BASE_URL": "https://api.openai.com/v1",
        "MODEL_TEMPERATURE": "0.7",
        "RECURSION_LIMIT": "10",
    },
    "deep_agents": [
        {
            "id": "general-assistant",
            "name": "General Assistant",
            "description": "General-purpose assistant",
            "instructions": "You are a helpful assistant.",
            "model": "openai:gpt-4.1",
            "tools": [],
            "max_recursion": 10,
            "internal_agents": [],
        }
    ],
}


# ---------------------------------------------------------------------------
# Module-level config cache
# ---------------------------------------------------------------------------

_config_instance: Optional[DeepAgentsConfig] = None


def _resolve_config_path() -> Path:
    """Locate ``deep_agents_config.json`` relative to the project root.

    Tries these locations in order:

    1. ``app/../deep_agents_config.json``
    2. ``app/agent/deep_agents_config.json``
    3. ``<CWD>/deep_agents_config.json``
    """
    start = Path(__file__).resolve().parent
    candidates = [
        start.parent.parent / "deep_agents_config.json",  # project root
        start / "deep_agents_config.json",                 # inside agent/
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    cwd_path = Path.cwd() / "deep_agents_config.json"
    if cwd_path.is_file():
        return cwd_path
    return candidates[0]


def _load_json(path: Path) -> Optional[Dict[str, Any]]:
    """Load and parse the JSON config file; return ``None`` on failure."""
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError):
        return None


def _apply_defaults(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Merge *raw* into the default config so that omitted fields
    receive sensible fallbacks."""
    merged: Dict[str, Any] = json.loads(json.dumps(_DEFAULT_JSON))
    for key, value in raw.items():
        if key == "environment":
            merged.setdefault("environment", {}).update(value)
        elif key == "deep_agents":
            merged["deep_agents"] = value
        else:
            merged[key] = value
    return merged


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def config() -> DeepAgentsConfig:
    """Return the validated configuration, loading it once and caching.

    Raises
    ------
    ValueError
        If the config cannot be parsed or validated.
    """
    global _config_instance

    if _config_instance is not None:
        return _config_instance

    raw = _load_json(_resolve_config_path())
    if raw is None:
        config_data = {k: v for k, v in _DEFAULT_JSON.items()}
    else:
        config_data = _apply_defaults(raw)

    try:
        _config_instance = DeepAgentsConfig(
            environment=config_data["environment"],
            deep_agents=[
                DeepAgentConfig(**a) for a in config_data.get("deep_agents", [])
            ],
        )

        # Inject environment variables now so downstream modules (langchain,
        # deepagents) see the correct values at import time.
        for _key, _value in _config_instance.environment.items():
            if _value:
                os.environ[_key] = str(_value)
    except Exception as exc:
        raise ValueError(f"Invalid deep agents config: {exc}") from exc

    return _config_instance


def load_deep_agents() -> List[DeepAgentConfig]:
    """Convenience function — returns the list of deep-agent configs."""
    return config().deep_agents


def set_environment(config_instance: DeepAgentsConfig) -> None:
    """Inject the *environment* section into ``os.environ``.

    This allows downstream code that reads ``os.environ`` (or a
    ``pydantic_settings`` ``BaseSettings`` model) to pick up the values
    from the JSON config automatically.

    Values from the JSON config **always override** whatever is already
    in ``os.environ`` — the file has final priority.  Empty-string values
    are skipped so they do not erase existing environment variables.
    """
    logger = logging.getLogger(__name__)
    for key, value in config_instance.environment.items():
        if value:
            os.environ[key] = str(value)
            logger.info("Injected env var: %s=%s", key, value)


def get_config() -> tuple:
    """Return an ``(environment, deep_agents)`` tuple for external consumption."""
    cfg = config()
    return cfg.environment, cfg.deep_agents


def get_model_params() -> tuple[str, str]:
    """Return (api_key, base_url) from the environment config section."""
    cfg = config()
    api_key = cfg.environment.get("OPENAI_API_KEY", "")
    base_url = cfg.environment.get("OPENAI_API_BASE_URL", "https://api.openai.com/v1")
    return api_key, base_url
