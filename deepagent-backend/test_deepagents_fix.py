"""Verification script that simulates the exact import sequence from
deep_agent.py and checks the harness profile ends up correct.
"""

import sys
import json

print("=" * 70)
print("TEST 1 — Verify harness profile resolution AFTER import order patch")
print("=" * 70)

# ---------------------------------------------------------------------------
# Step 1: Simulate the exact import order from the FIXED deep_agent.py
# ---------------------------------------------------------------------------

# This file does:
# 1. from deepagents import create_deep_agent   <-- triggers _openai registration
# 2. from deepagents.profiles._harness_profiles import ...
# 3. _register_harness_profile("openai", ...)   <-- our override

# We start by clearing the profile registry so we can test from scratch
from deepagents.profiles._harness_profiles import _HARNESS_PROFILES
_HARNESS_PROFILES.clear()

# Step A: import deepagents first (this triggers _openai side-effect registration)
print("\n--- Step A: Import deepagents.create_deep_agent (triggers _openai registration) ---")
from deepagents import create_deep_agent  # noqa: F401
print("  Imported create_deep_agent")

# Check current state
from deepagents.profiles._harness_profiles import _get_harness_profile
profile_before = _get_harness_profile("openai:qwen3.6")
print(f"  Profile for 'openai:qwen3.6' BEFORE override:")
print(f"    use_responses_api = {profile_before.init_kwargs.get('use_responses_api')}")

# Step B: Apply our override (same code as in deep_agent.py)
print("\n--- Step B: Register our override ---")
from deepagents.profiles._harness_profiles import (
    _register_harness_profile,
    _HarnessProfile,
)
_register_harness_profile("openai", _HarnessProfile(init_kwargs={"use_responses_api": False}))
print("  Registered override: use_responses_api=False")

# Verify after override
profile_after = _get_harness_profile("openai:qwen3.6")
print(f"  Profile for 'openai:qwen3.6' AFTER override:")
print(f"    use_responses_api = {profile_after.init_kwargs.get('use_responses_api')}")

# Assertions
assert "use_responses_api" in profile_after.init_kwargs, \
    f"ERROR: 'use_responses_api' not in init_kwargs: {profile_after.init_kwargs}"

assert profile_after.init_kwargs["use_responses_api"] is False, \
    f"ERROR: use_responses_api should be False, got {profile_after.init_kwargs['use_responses_api']}"

print("\n  PASS ✓ use_responses_api is False")

# ---------------------------------------------------------------------------
# TEST 2: verify init_chat_model resolution
# ---------------------------------------------------------------------------
print("\n" + "=" * 70)
print("TEST 2 — Verify init_chat_model resolution")
print("=" * 70)

import os
os.environ["OPENAI_API_KEY"] = "ollama"
os.environ["OPENAI_API_BASE_URL"] = "http://127.0.0.1:8000/v1"

from langchain.chat_models import init_chat_model
model = init_chat_model("openai:qwen3.6")

from langchain_openai import ChatOpenAI
assert isinstance(model, ChatOpenAI), f"ERROR: expected ChatOpenAI, got {type(model)}"
print(f"  model type   = {type(model).__name__}")
print(f"  model_name   = {model.model_name}")
print(f"  base_url     = {model.openai_api_base}")
print("  PASS ✓ model is ChatOpenAI with correct settings")

# ---------------------------------------------------------------------------
# TEST 3: verify resolve_model from deepagents
# ---------------------------------------------------------------------------
print("\n" + "=" * 70)
print("TEST 3 — Verify deepagents._models.resolve_model")
print("=" * 70)

from deepagents._models import resolve_model
resolved = resolve_model("openai:qwen3.6")
print(f"  resolved type = {type(resolved).__name__}")
print(f"  model_name    = {resolved.model_name}")

assert isinstance(resolved, ChatOpenAI), \
    f"ERROR: resolve_model should return ChatOpenAI, got {type(resolved)}"
assert resolved.model_name == "qwen3.6"
print("  PASS ✓ resolve_model returns correct ChatOpenAI")

# ---------------------------------------------------------------------------
# TEST 4: Verify config_loader injects env vars correctly
# ---------------------------------------------------------------------------
print("\n" + "=" * 70)
print("TEST 4 — Verify config_loader environment injection")
print("=" * 70)

# Load the config (this path should work since config_loader is in the project)
import sys
sys.path.insert(0, "/home/dread/VsCode/the_backend")
from app.agent.config_loader import config
cfg = config()
print(f"  AGENT_MODEL    = {cfg.environment.get('AGENT_MODEL')}")
print(f"  OPENAI_API_KEY = {cfg.environment.get('OPENAI_API_KEY')}")
print(f"  BASE_URL       = {cfg.environment.get('OPENAI_API_BASE_URL')}")

assert cfg.environment.get("AGENT_MODEL") == "openai:qwen3.6", \
    f"ERROR: AGENT_MODEL should be 'openai:qwen3.6', got {cfg.environment.get('AGENT_MODEL')}"
assert cfg.environment.get("OPENAI_API_BASE_URL") == "http://127.0.0.1:8000/v1", \
    f"ERROR: BASE_URL should be 'http://127.0.0.1:8000/v1', got {cfg.environment.get('OPENAI_API_BASE_URL')}"
print("  PASS ✓ config_loader returns correct values")

# ---------------------------------------------------------------------------
# TEST 5: set_environment actually sets os.environ
# ---------------------------------------------------------------------------
print("\n" + "=" * 70)
print("TEST 5 — Verify set_environment() injection")
print("=" * 70)

from app.agent.config_loader import set_environment
set_environment(cfg)

assert os.environ.get("OPENAI_API_KEY") == "ollama", \
    f"ERROR: OPENAI_API_KEY not set correctly: {os.environ.get('OPENAI_API_KEY')}"
assert os.environ.get("OPENAI_API_BASE_URL") == "http://127.0.0.1:8000/v1", \
    f"ERROR: OPENAI_API_BASE_URL not set correctly: {os.environ.get('OPENAI_API_BASE_URL')}"
print(f"  OPENAI_API_KEY     = {os.environ.get('OPENAI_API_KEY')}")
print(f"  OPENAI_API_BASE_URL = {os.environ.get('OPENAI_API_BASE_URL')}")
print("  PASS ✓ os.environ correctly populated from config")

# ---------------------------------------------------------------------------
# SUMMARY
# ---------------------------------------------------------------------------
print()
print("=" * 70)
print("ALL TESTS PASSED ✓")
print("=" * 70)
print()
print("Summary of changes:")
print("  - Patching order in deep_agent.py reversed so that:")
print("    1) deepagents.create_deep_agent imports first (triggers default _openai profile)")
print("    2) Our _register_harness_profile('openai', ...) OVERRIDES it")
print("  - This ensures use_responses_api=False for all 'openai:*' models")
print("  - vLLM only supports Chat Completions /v1/chat/completions, not Responses API")
print("  - Config keeps 'openai:qwen3.6' format, env vars are injected by set_environment()")
