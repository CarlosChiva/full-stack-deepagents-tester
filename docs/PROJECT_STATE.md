# PROJECT STATE — Fix Frontend/Backend Communication After Nginx Removal

## Objective

After the Nginx removal from the frontend Docker setup, the page is blank/dead and frontend-backend communication is broken. Diagnose root causes and fix them.

## Root Cause Diagnosis

### 🔴 #1 — `.env` excluded from Docker build → `VITE_API_BASE_URL` is EMPTY at build time

**Evidence:**
- `deepagent-frontend/.dockerignore` line ~8: `.env` is excluded from Docker build context
- During `npm run build` inside Docker, `import.meta.env.VITE_API_BASE_URL` evaluates to `undefined`
- Fallback `|| ''` makes `BASE_URL = '/api'` — all API calls go to relative paths like `/api/auth/token`
- `vite preview` is a static file server — it doesn't support proxy (only the dev server does)
- Every request to `/api/*` returns **404 Not Found** from the static file server
- Page renders but is blank/dead because no data loads, no auth token, no conversations

**Files:**
- `deepagent-frontend/.dockerignore` — excludes `.env`
- `deepagent-frontend/src/api/auth.ts` line 3 — `BASE_URL` logic
- `deepagent-frontend/src/api/conversations.ts` line 7 — same pattern
- `deepagent-frontend/vite.config.ts` lines 14-25 — dev-only proxy (useless at preview time)

### 🔴 #2 — Exit code 137 (OOM kill) on both containers

**Evidence:**
- `docker ps -a` shows both `deepagent-frontend` and `deepagent-backend` exited with code 137
- Host runs MySQL, Open WebUI, ComfyUI (GPU), it-tools — already consuming significant RAM
- `docker-compose.yml` has **no memory limits** configured
- `node:20-alpine` + full `npm ci` + Python FastAPI + DeepAgent agent framework = heavy

**Impact:** Containers crash immediately; nothing is running when the user opens the page.

### 🟡 #3 — WebSocket URL uses relative `window.location.host` instead of absolute URL

**Evidence:**
- `deepagent-frontend/src/hooks/useWebSocket.ts` line ~128:
  ```ts
  `${protocol}//${window.location.host}/ws/${channelId}?token=${token}`
  ```
  This resolves to the frontend origin (port 8082) and tries to establish a WebSocket on the same server, where none exists. Backend WebSocket is on port 8003.

### 🟡 #4 — `network_mode: host` makes `ports:` directive dead config

**Impact:** Cosmetic — doesn't break anything but is misleading and redundant.

---

## Task Board

| ID | Task | Agent | Involved files | Acceptance criteria | Status |
|----|------|-------|-----------------|----------------------------|--------|
| 1 | Pass `VITE_API_BASE_URL` as Docker build arg so Vite uses absolute URL at build time | coder | `deepagent-frontend/Dockerfile`, `docker-compose.yml`, `src/api/auth.ts`, `src/api/conversations.ts` | `ARG VITE_API_BASE_URL` + `ENV VITE_API_BASE_URL` in Dockerfile; `build.args` in compose; removed `/api` suffix from BASE_URL | ✅ DONE |
| 2 | Fix WebSocket URL in `useWebSocket.ts` to use `VITE_API_BASE_URL` (absolute URL with ws/wss protocol) | coder | `deepagent-frontend/src/hooks/useWebSocket.ts` | WebSocket connects to `ws://localhost:8003/ws/{id}` with try/catch fallback | ✅ DONE |
| 3 | Add memory limits to both services in docker-compose.yml to prevent OOM kills | coder | `docker-compose.yml` | `mem_limit: 2g` for backend, `mem_limit: 1g` for chat-app | ✅ DONE |
| 4 | Reviewer verification of all fixes (combined cross-cutting review) | coder-reviewer | all modified files | All changes approved, no regression between changes, CORS/dependency/build-time verified | ✅ DONE |
| 5 | Rebuild and sanity-test containers | coder | — | `docker compose down -v && build --no-cache && up -d` succeeds; both containers up+healthy; `/health` returns 200; frontend serves HTML; bundle contains `localhost:8003` | ✅ DONE |

---

## Final Verification Results

| Check | Result | Details |
|------|--------|---------|
| Both containers running | ✅ YES | `deepagent-backend` (healthy), `deepagent-frontend` (running) |
| Backend `/health` → 200 | ✅ YES | `{"status":"ok","service":"the_backend"}` |
| Frontend serves HTML | ✅ YES | Valid HTML with React root, CSS and JS assets |
| `VITE_API_BASE_URL` baked into bundle | ✅ YES | `localhost:8003` found multiple times in JS bundle |
| API paths correct | ✅ YES | `http://localhost:8003/auth/token` (no stale `/api` prefix) |
| WebSocket connects to backend port | ✅ YES | `ws://localhost:8003/ws/...` in bundle |
| Memory limits set | ✅ YES | backend=2g, frontend=1g |
| Logs clean (no errors) | ✅ YES | Both services running cleanly |
| CORS compatible | ✅ VERIFIED | `http://localhost:8082` explicitly allowed by backend |

## Non-blocking Recommendations

1. **Dead Vite proxy in `vite.config.ts`** — The proxy block (lines 14-25) now does nothing since all URLs are absolute. Safe to remove for hygiene.
2. **Redundant `ports:` with `network_mode: host`** — The `ports:` directives in docker-compose.yml are no-ops with host networking. Safe to remove.
3. **Monitor actual memory usage** — `docker stats` after a few minutes to see if 2g/1g limits are appropriate or need adjustment.
