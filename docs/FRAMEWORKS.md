# FRAMEWORKS & TECHNOLOGIES — DeepAgent Chat App (Actual State)

## Frontend Stack

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| **Framework** | React | ^19.0.0 | Librería UI principal |
| **Lenguaje** | TypeScript | ^5.7.0 | Tipado estricto |
| **Build Tool** | Vite | ^6.0.0 | Bundler, HMR, build proxy a backend:8003 |
| **Estilos** | TailwindCSS | ^3.4.17 | CSS utility-first |
| **State** | React Context API | nativo | canales, mensajes, thread activo |
| **HTTP** | fetch (nativo) | — | Comunicación REST con backend |
| **WebSocket** | WebSocket API (nativo) | — | Streaming en tiempo real del agente |

### Frontend — Lo que falta (gap crítico)
- **No existe capa de API** (file `src/api/` con funciones fetch para auth, conversations, etc.)
- **No existe cliente WebSocket** para conectar con `ws://localhost:8003/ws/{thread_id}?token=...`
- **ChatContext.tsx** solo gestiona estado local; no dispara llamadas reales al backend

## Backend Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.12 | Runtime |
| **FastAPI** | 0.115.0+ | REST + WebSocket routes |
| **uvicorn** | 0.34.x | ASGI server (port 8003) |
| **Pydantic** | 2.10.x | Schema validation |
| **LangChain** | 0.3.x | Agent framework |
| **LangGraph** | 0.3.x | State graph engine |
| **python-jose** | — | JWT HS256 (create/verify) |
| **passlib** | — | Password hashing (bcrypt) |
| **pydantic-settings** | — | Settings from .env |
| **websockets** | — | WebSocket support via FastAPI |
| **deep-agents** | — | Custom agent harness (LangChain-based) |
| **sqlalchemy** | — | DB engine/session |

### Backend — Archivos existentes
| Archivo | Estado | Notas |
|---------|--------|-------|
| `app/main.py` | ✅ Existe | FastAPI factory, CORS, lifespan |
| `app/config.py` | ✅ Existe | Settings singleton |
| `app/database.py` | ✅ Existe | DB session setup |
| `app/auth/jwt.py` | ✅ Existe | create_access_token, verify_token |
| `app/api/auth.py` | ✅ Existe | POST /auth/login, /auth/refresh |
| `app/api/conversations.py` | ✅ Existe | CRUD conversations |
| `app/api/websocket.py` | ✅ Existe | POST /ws/{thread_id} |
| `app/ws/manager.py` | ✅ Existe | WebSocketManager con validación JWT |
| `app/agent/manager.py` | ✅ Existe | AgentManager pool |
| `app/agent/deep_agent.py` | ✅ Existe | DeepAgent wrapper |
| `app/agent/tools.py` | ✅ Existe | Tool definitions |
| `app/agent/config_loader.py` | ✅ Existe | deep_agents_config.json loader |

### Backend — Configuración de agente
- `deep_agents_config.json` define agentes, sub-agentes, modelos, MCP connections
- Default model: `openai:qwen3.5` (⚠️ verificar que sea `openai:gpt-4.1` como requiere el usuario)
- Fallback Ollama: `127.0.0.1:8000`

## Docker

| Config | Estado |
|--------|-------|
| Backend | ✅ Activo, port 8003, `network_mode: host` |
| Frontend | ✅ Activo, port 8082:4173 (vite preview, no Nginx) |
| Network | `network_mode: host` — sin bridge custom |
| Nginx | ❌ Eliminado — reemplazado por `vite preview` en Stage 2 del Dockerfile |

## Variables de Entorno

| Variable | Service | Source | Min Length |
|----------|---------|--------|------------|
| `JWT_SECRET` | Backend | `deep-agent-backend/.env` | 32 chars |
| `OPENAI_API_KEY` | Backend | `deep-agent-backend/.env` | — |
| `OPENAI_API_BASE_URL` | Backend | `deep-agent-backend/.env` | — |
| `VITE_API_BASE_URL` | Frontend | `deepagent-frontend/.env` | — |

## Protocolo WebSocket (backend actual)

```
Client sends:  {"type": "message", "content": "..."}`
Server sends:  {"type": "token", "content": "..."}    (streaming tokens)
Server sends:  {"type": "tool_call", "name": "..."}    (agent tool usage)
Server sends:  {"type": "done", "content": "final"}    (response complete)
```

JWT autenticación vía query param: `?token=<JWT>`

## Dependencias Frontend

### Runtime
| Package | Razón |
|---------|-------|
| `react` / `react-dom` | Framework UI |

### Dev
| Package | Razón |
|---------|-------|
| `typescript` | Compilador TS |
| `vite` | Bundler |
| `@vitejs/plugin-react` | HMR + Babel |
| `tailwindcss` / `postcss` / `autoprefixer` | CSS |
| `eslint` + `@typescript-eslint/*` | Linting |
| `@types/react`, `@types/react-dom` | Tipos TS |

## Notas

- **Frontend proxy:** `vite.config.ts` proxies `/api/*` a `http://localhost:8003`
- **Frontend Docker:** Necesita descomentarse y conectarse al backend
- **Backend auth:** `POST /auth/login` retorna JWT; WebSocket lo usa en `?token=` query
- **Agent config en runtime:** Cambiar `deep_agents_config.json` requiere reinicio del backend
- **Skills:** `.agents/` contenido en gitignore — reinstalar después de checkout
