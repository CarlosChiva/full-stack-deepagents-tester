"""DeepAgent implementation using the DeepAgents framework.

Replaces the custom tool-use loop with ``create_deep_agent`` from the
``deepagents`` package (built on LangChain/LangGraph).  Sub-agents
defined in the configuration are also built as ``DeepAgent`` instances.
"""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING, Any

from deepagents import create_deep_agent
from langchain.chat_models import init_chat_model
from langchain_core.language_models import BaseChatModel
from langgraph.checkpoint.memory import MemorySaver

from app.agent.config_loader import InternalAgentConfig
from app.agent.tools import registry as tool_registry

if TYPE_CHECKING:
    from app.agent.config_loader import MCPConfig, DeepAgentConfig

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# MCP tool resolution
# ---------------------------------------------------------------------------


async def _load_mcp_tools(
    mcp_servers: dict[str, MCPConfig],
) -> list[Any]:
    """Load tools from one or more MCP servers.

    Parameters
    ----------
    mcp_servers:
        Mapping of server name → :class:`MCPConfig`.

    Returns
    -------
    list
        All tools exposed by every configured MCP server.

    Raises
    ------
    RuntimeError
        If an MCP server cannot be connected to or its tools queried.
    """
    from langchain_mcp_adapters.client import MultiServerMCPClient

    sdk_configs: dict[str, dict[str, Any]] = {}
    for _name, _cfg in mcp_servers.items():
        sdk_configs["mcp:" + _name] = _cfg._to_sdk_dict()

    logger.info("Loading MCP tools from %d server(s): %s",
                len(sdk_configs), list(sdk_configs.keys()))

    try:
        client = MultiServerMCPClient(sdk_configs)
        tools = await client.get_tools()
    except Exception as exc:
        logger.error("Failed to load MCP tools: %s", exc, exc_info=True)
        raise RuntimeError(f"Could not connect to MCP servers: {exc}") from exc

    for server_name in sdk_configs:
        logger.debug("MCP server: %s (keys=%d)", server_name, len(tools))
    logger.info("Loaded %d MCP tool(s) from servers: %s",
                len(tools), list(sdk_configs.keys()))
    return tools


def _resolve_tools(
    tool_names: list[str] | None,
    mcp_servers: dict[str, MCPConfig] | None = None,
) -> list[Any]:
    """Resolve tool name strings to langchain Core ``Tool`` objects.

    Optionally loads tools from MCP servers and adds them to the result.

    Parameters
    ----------
    tool_names:
        Names of locally-registered tools to include.  ``None`` means all.
    mcp_servers:
        Optional mapping of MCP server definitions.  When present and
        non-empty, their tools are fetched and appended to the returned
        list.

    Returns
    -------
    list
        Local tools (resolved by name) + any MCP tools.
    """
    local_tools = tool_registry.resolve_tools(tool_names)
    logger.info("Resolved %d local tool(s) for agent", len(local_tools))
    tools = local_tools

    if mcp_servers and len(mcp_servers) > 0:
        try:
            mcp_tools = asyncio.run(_load_mcp_tools(mcp_servers))
            tools.extend(mcp_tools)
            logger.info("Loaded %d MCP tool(s) from %d server(s)",
                         len(mcp_tools), len(mcp_servers))
        except Exception as exc:
            logger.warning(
                "MCP tool loading failed for agent — continuing without MCP tools: %s",
                exc,
            )

    logger.info("Total tools available: %d (local=%d, mcp=%d)",
                len(tools), len(local_tools), len(tools) - len(local_tools))
    return tools


def _resolve_model_and_provider(
    model_str: str,
    api_key: str,
    base_url: str,
) -> BaseChatModel:
    """Resolve a model string to a pre-initialized ``BaseChatModel``.

    Parameters
    ----------
    model_str:
        Provider-prefixed model identifier, e.g. ``openai:qwen3.6``.
    api_key:
        Explicit API key (e.g. from config environment section).
    base_url:
        Explicit API base URL (e.g. vLLM endpoint).

    Returns
    -------
    BaseChatModel
        A ready-to-use chat model instance.
    """
    return init_chat_model(
        model=model_str.split(":")[1],
        model_provider=model_str.split(":")[0],
        api_key=api_key,
        base_url=base_url,
        extra_body={"chat_template_kwargs": {"enable_thinking": True}}
    )


def _build_subagent_dicts(
    sub_configs: list[InternalAgentConfig],
    subagent_map: dict[str, Any],
    checkpointer: MemorySaver,
    api_key: str,
    base_url: str,
) -> list[dict]:
    """Build sub-agent definition dicts for ``create_deep_agent(subagents=...)``.

    Each sub-agent is built as a ``DeepAgent`` instance with its own
    resolved tools and passed back via the ``"agent"`` key.

    Parameters
    ----------
    sub_configs:
        Internal-agent configuration objects.
    subagent_map:
        Dict mapping ``agent.id`` to the built ``DeepAgent`` object.
        Used to resolve child sub-agents by ID.
    checkpointer:
        A MemorySaver instance (accepted for compatibility; not used
        by individual sub-agents — the checkpointer is shared at the
        parent level).

    Returns
    -------
    list[dict]
        Subagent definition dicts for ``create_deep_agent(subagents=...)``.
    """
    result: list[dict] = []

    for sub_cfg in sub_configs:
        sub_id = sub_cfg.id
        sub_name = sub_cfg.name
        logger.info("Building sub-agent: id=%s, name=%s", sub_id, sub_name)
        entry: dict[str, Any] = {
            "id": sub_id,
            "name": sub_cfg.name,
            "description": sub_cfg.description,
            "system_prompt": sub_cfg.instructions,
        }

        try:
            # Resolve plain tools + optional MCP tools for this sub-agent
            logger.debug("Resolving tools for sub-agent: id=%s, name=%s", sub_id, sub_name)
            sub_tools = _resolve_tools(sub_cfg.tools, sub_cfg.mcp_servers)
            logger.info("Sub-agent %s has %d tools available", sub_name, len(sub_tools))

            # Build sub-agent as a DeepAgent instance with its tools
            sub_deep = create_deep_agent(
                model=_resolve_model_and_provider(sub_cfg.model, api_key, base_url),
                name=sub_cfg.name,
                system_prompt=sub_cfg.instructions,
                tools=sub_tools,
            )
            entry["agent"] = sub_deep
            subagent_map[sub_cfg.id] = sub_deep

            logger.info("Successfully built sub-agent: id=%s", sub_id)
        except Exception as e:
            logger.error("Failed to build sub-agent: id=%s: %s", sub_id, e, exc_info=True)
            raise

        result.append(entry)

    return result


def build_deep_agent(agent_cfg: "DeepAgentConfig") -> tuple[Any, dict]:
    """Build a DeepAgent (via ``create_deep_agent``) and its invocation config.

    Parameters
    ----------
    agent_cfg:
        Validated :class:`DeepAgentConfig` from the config file.

    Returns
    -------
    tuple[DeepAgent, dict]
        A ``(deep_agent, config)`` pair ready to invoke.
        ``config`` contains ``thread_id`` and ``recursion_limit``
        under ``configurable``.
    """
    agent_name = agent_cfg.name
    agent_model = agent_cfg.model
    logger.info("Building deep agent: name=%s, model=%s", agent_name, agent_model)

    try:
        from app.agent.config_loader import DeepAgentConfig  # noqa: local import for TYPE_CHECKING

        checkpointer = MemorySaver()

        from app.agent.config_loader import get_model_params

        api_key, base_url = get_model_params()

        # Build subagent definitions recursively
        subagent_map: dict[str, Any] = {}
        subagent_dicts: list[dict] = _build_subagent_dicts(
            agent_cfg.internal_agents or [],
            subagent_map,
            checkpointer,
            api_key,
            base_url,
        )

        # Resolve main agent tools (local + optional MCP)
        main_tools = _resolve_tools(agent_cfg.tools, agent_cfg.mcp_servers)
        logger.info("Building deep agent: name=%s, model=%s, tools=%d, subagents=%d",
                     agent_cfg.name, agent_cfg.model, len(main_tools),
                     len(subagent_dicts))

        # Build the agent
        deep = create_deep_agent(
            model=_resolve_model_and_provider(agent_cfg.model, api_key, base_url),
            name=agent_cfg.name,
            system_prompt=agent_cfg.instructions,
            tools=main_tools,
            subagents=subagent_dicts,
            checkpointer=checkpointer,
        )

        recursion_limit = int(
            agent_cfg.max_recursion
            or agent_cfg.model_extra.get("max_recursion", 10)  # type: ignore [union-attr]
        )

        config: dict[str, Any] = {
            "configurable": {
                "thread_id": agent_cfg.id,
                "recursion_limit": recursion_limit,
            }
        }

        logger.info("Successfully built deep agent: name=%s", agent_name)
        return deep, config

    except Exception as e:
        logger.error("Failed to build deep agent: name=%s: %s", agent_name, e, exc_info=True)
        raise




def _extract_text_from_item(item: Any) -> str:
    """Extract text content from a model's structured content block."""
    if isinstance(item, dict):
        text = item.get("text", "")
        logger.debug("extract_text_from_item: dict with text=%d chars", len(text))
        return text
    elif hasattr(item, "text"):
        text = item.text
        logger.debug("extract_text_from_item: obj.text=%d chars", len(text))
        return text
    elif hasattr(item, "content"):
        content = item.content
        if isinstance(content, str):
            logger.debug("extract_text_from_item: obj.content str=%d chars", len(content))
            return content
        elif isinstance(content, list):
            logger.debug("extract_text_from_item: obj.content list with %d blocks", len(content))
            texts = []
            for idx, block in enumerate(content):
                t = _extract_text_from_item(block)
                if t:
                    texts.append(t)
            result = "\n".join(texts)
            logger.debug("extract_text_from_item: merged list result=%d chars", len(result))
            return result
    logger.debug("extract_text_from_item: unhandled type=%s", type(item).__name__)
    return ""


async def invoke_deep_agent_streaming(
    deep: Any,
    config: dict,
    user_message: str,
):
    """Async generator that emits streaming events with differentiated status.

    Distinguishes thinking (reasoning) tokens from final answer tokens
    by tracking thinking chain depth via on_chain_start events.

    Yields
    ------
    dict
        ``{"status": "token", "data": token_text}``  — final answer tokens
        ``{"status": "tool", "data": {"name": tool_name}}`` — tool invocation
        ``{"status": "thinking", "data": chunk_text}`` — thinking chunks in real-time
        ``{"status": "thinking", "data": "Pensamiento completo: <full_text>"}`` — thinking summary
        ``{"status": "answer", "data": full_response}`` — complete final response
    """
    accumulated_content: list[str] = []
    thinking_accumulated: list[str] = []
    thread_id = config.get("configurable", {}).get("thread_id", "unknown")
    logger.info("Invoking agent: thread_id=%s", thread_id)
    log_prefix = f"[{thread_id}]"

    first_chunk = True
    ns_to_subagent_name: dict[str, str] = {}
    try:
        # Use astream_events for better control over streaming
        async for event in deep.astream_events(
            {"messages": [{"role": "user", "content": user_message}]},
            config=config,
            version="v2"
        ):
            # --- DEBUG: Dump ALL event raw structure ---
            logger.debug(f"{log_prefix} 🐛 astream_events: %r", event)
            if first_chunk:
                first_chunk = False

            event_type = event.get("event", "")
            data = event.get("data", {})
            metadata = event.get("metadata", {})

            # Extract subagent info from metadata
            langgraph_node = metadata.get("langgraph_node", "")
            is_subagent = langgraph_node.startswith("tools:")
            subagent_id = langgraph_node if is_subagent else None
            if is_subagent and subagent_id and subagent_id not in ns_to_subagent_name:
                agent_name = metadata.get("lc_agent_name", subagent_id)
                ns_to_subagent_name[subagent_id] = agent_name
                logger.debug(f"{log_prefix} 🐛 New subagent detected: {agent_name}")

            # Handle on_chat_model_stream events (streaming chunks)
            if event_type == "on_chat_model_stream":
                if isinstance(data, dict) and "chunk" in data:
                    chunk = data["chunk"]
                    if hasattr(chunk, "content"):
                        content = chunk.content
                        if isinstance(content, str) and content.strip():
                            source = ns_to_subagent_name.get(subagent_id, "subagent") if is_subagent else "main"
                            logger.debug(f"{log_prefix} 🐛 TOKEN chunk (source={source}, len={len(content)})")
                            accumulated_content.append(content)
                            yield {"status": "token", "data": content}

            # Handle tool calls
            elif event_type in ("on_tool_start", "on_tool_end"):
                tool_name = data.get("name", "") if isinstance(data, dict) else ""
                if tool_name:
                    source = ns_to_subagent_name.get(subagent_id, "subagent") if is_subagent else "main"
                    logger.info(f"{log_prefix} 🐛 TOOL chunk (source={source}, name={tool_name})")
                    yield {"status": "tool", "data": {"name": tool_name, "agent": source}}

        # Final summary emissions
        if thinking_accumulated:
            full_thinking = "Pensamiento completo: " + "".join(thinking_accumulated)
            logger.debug(f"{log_prefix} 🐛 EMITTING final thinking summary (total thinking len={len(full_thinking)})")
            yield {"status": "thinking", "data": full_thinking}
        if accumulated_content:
            full_answer = "".join(accumulated_content)
            logger.debug(f"{log_prefix} 🐛 EMITTING final answer (total answer len={len(full_answer)})")
            yield {"status": "answer", "data": full_answer}
    except Exception as e:
        print(f"{log_prefix} ❌ ERROR: {e}", flush=True)
        print("Traceback:", flush=True)
        import traceback as _tb
        _tb.print_exc()
        raise
