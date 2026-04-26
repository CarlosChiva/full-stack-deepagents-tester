"""Tool implementations — ``read_file``, ``write_file``, ``execute_command``.

Each function is a plain, synchronous callable.  They are imported
into the :mod:`~app.agent.registry` where they are registered with
the langchain tool decorator so the agent can invoke them.
"""

from __future__ import annotations

import os
import subprocess

import logging

from langchain_core.tools import Tool, tool
from typing import Any

logger = logging.getLogger(__name__)


@tool
def read_file(path: str) -> str:
    """Read a file and return its contents as a string.

    Parameters
    ----------
    path:
        Absolute or relative path to the file to read.

    Returns
    -------
    str:
        The file contents, or an error message if the file cannot be read.
    """
    try:
        with open(path, "r", encoding="utf-8") as fh:
            return fh.read()
    except FileNotFoundError:
        return f"Error: file not found: {path}"
    except PermissionError:
        return f"Error: permission denied: {path}"
    except OSError as exc:
        return f"Error reading file: {exc}"


@tool
def write_file(path: str, content: str) -> str:
    """Write content to a file, creating it if it does not exist.

    Parameters
    ----------
    path:
        Target file path.
    content:
        String content to write.

    Returns
    -------
    str:
        A message indicating success or failure.
    """
    try:
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)
        return f"Successfully wrote {len(content)} characters to {path}"
    except PermissionError:
        return f"Error: permission denied writing to {path}"
    except OSError as exc:
        return f"Error writing file: {exc}"


@tool
def execute_command(command: str) -> str:
    """Execute a shell command and return its stdout / stderr.

    Parameters
    ----------
    command:
        The shell command to run.

    Returns
    -------
    str:
        The combined stdout and stderr from the command, or an error
        message if the command fails or the timeout is exceeded.
    """
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=30,
        )
        output = result.stdout
        if result.stderr:
            output += f"\nstderr: {result.stderr}"
        if result.returncode != 0:
            return f"Command exited with code {result.returncode}.\n{output}"
        return output
    except subprocess.TimeoutExpired:
        return "Error: command timed out after 30 seconds."
    except OSError as exc:
        return f"Error executing command: {exc}"


# ---------------------------------------------------------------------------
# Registry (auto-built when the module is first imported)
# ---------------------------------------------------------------------------


class ToolRegistry:
    """Singleton mapping tool names to ``langchain_core.tools.Tool`` instances.

    The registry is built when this module is first imported by scanning
    the module's globals for objects decorated with ``@tool``.
    """

    def __init__(self) -> None:
        self._tools: dict[str, Any] = {}

    def register_tool(self, name: str, tool_obj: Any) -> None:
        """Register a single tool under the given *name*."""
        self._tools[name] = tool_obj

    def get_tool(self, name: str) -> Any | None:
        """Return the tool with the given *name*, or ``None`` if absent."""
        return self._tools.get(name)

    def resolve_tools(self, tool_names: list[str] | None = None) -> list[Any]:
        """Resolve tool name strings to callable tool objects.

        If *tool_names* is ``None`` or empty, returns **all** registered
        tools.
        """
        if not tool_names:
            return list(self._tools.values())
        resolved: list[Any] = []
        for name in tool_names:
            tool_obj = self._tools.get(name)
            if tool_obj is None:
                logger.warning("Unknown tool '%s', skipping", name)
            else:
                resolved.append(tool_obj)
        return resolved

    def available_tools(self) -> list[str]:
        """Return a sorted list of all registered tool names."""
        return sorted(self._tools.keys())


def _scan_and_register() -> ToolRegistry:
    """Auto-register every ``@tool``-decorated function in this module."""
    reg = ToolRegistry()
    for name, obj in globals().items():
        if isinstance(obj, Tool):
            reg.register_tool(name, obj)
        # Fallback: if the object has a 'name' and 'invoke' method (LangChain tool pattern)
        elif (hasattr(obj, 'name') and hasattr(obj, 'invoke') and 
              callable(getattr(obj, 'invoke', None))):
            # Check it's not a string, lambda, or builtin
            if not name.startswith('_') and not name.startswith('__'):
                reg.register_tool(name, obj)
                logger.info(f"Registered tool from fallback scan: {name}")
    return reg


registry = _scan_and_register()
"""Module-level singleton :class:`ToolRegistry`."""
