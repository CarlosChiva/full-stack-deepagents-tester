# AGENTS.md

## Repo layout

```
deep-agent-backend/   # FastAPI + DeepAgent (Python 3.12)
deepagent-frontend/   # React 19 + Vite 6 + TypeScript (Node)
docker-compose.yml    # orchestrates both services
```

## Commands

### Backend (CD into `deep-agent-backend/` first)

**Setup**
```bash
pip install -e ".[dev]"      # install deps + dev extras in-place
cp .env.example .env          # then edit with your secrets
```

**Run**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8003
```

**Tests**
```bash
pytest
```

`conftest.py` mocks `AgentManager.create_agent` so no real LLM call fires. Every test gets a fresh agent manager and auto-cleans threads.

### Frontend (CD into `deepagent-frontend/` first)

```bash
npm ci
npm run dev       # Vite dev server on port 3000
npm run build     # tsc -b && vite build
npm run typecheck # tsc --noEmit
npm run lint      # eslint .
npm run preview   # serve dist/ locally
```

### Docker (from repo root)

```bash
docker compose up -d       # both services
docker compose down         # stop
docker compose down -v      # stop + remove volumes
```

Backend listens on host port `8003`; frontend Nginx on `8082`.

## Gotchas

- **Backend needs `.env`** with `JWT_SECRET` (min 32 chars) and `OPENAI_API_KEY` before it starts. The `Settings` singleton reads from `.env` beside `config.py`.
- **`skills-lock.json` and `.agents/` are gitignored** — `cd .agents` and run the opencode skill install command to restore skills after checkout.
- **Frontend build runs `tsc -b` before `vite build`** — type errors block the production build.
- **`test_deepagents_fix.py`** is a one-off test file in the backend root; not part of the package under `tests/`. It imports `app.*` directly.
- **DeepAgent config** lives in `deep_agents_config.json`; it defines agents, sub-agents, models, and MCP server connections. Changing it requires an app restart.
- **Docker Compose uses `network_mode: host`** — the backend container binds directly to the host network; do not change to a custom bridge without also fixing the `OPENAI_API_BASE_URL` for the host.
