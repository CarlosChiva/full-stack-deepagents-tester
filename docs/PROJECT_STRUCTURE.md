# PROJECT STRUCTURE — Chat Web App

## Estructura de Directorios (target)

```
the_frontend/
├── docs/
│   ├── PROJECT_STATE.md
│   ├── REQUIREMENTS.md
│   └── FRAMEWORKS.md
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   └── images/
│   ├── components/
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ChatChannelListItem.tsx
│   │   │   └── SidebarHeader.tsx
│   │   ├── ChatWindow/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── Layout/
│   │   │   └── MainLayout.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Avatar.tsx
│   │       └── Input.tsx
│   ├── context/
│   │   ├── ChatContext.tsx
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useChatMessages.ts
│   │   ├── useChatNavigation.ts
│   │   └── index.ts
│   ├── types/
│   │   ├── chat.ts
│   │   ├── user.ts
│   │   └── index.ts
│   ├── utils/
│   │   └── constants.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── Dockerfile
├── docker-compose.yml
├── tailwind.config.ts
├── postcss.config.js
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Archivos de Configuración

### `package.json`
- Metadatos del proyecto (`chat-web-app`), scripts de dev/build/preview/lint/typecheck
- Todas las dependencias necesarias

### `tsconfig.json`
- `strict: true` para tipado estricto
- `noUncheckedIndexedAccess: true` para acceso seguro a índices
- `jsx: "react-jsx"` para transform moderno
- `baseUrl` + `paths: { "@/*": ["./src/*"] }` para alias de imports limpios

### `tsconfig.node.json`
- Configuración separada para archivos de configuración de Vite

### `vite.config.ts`
- Plugin de React, alias `@` → `src/`, puerto 3000

### `tailwind.config.ts`
- Content paths: `./src/**/*.{js,ts,jsx,tsx}`
- Tema extendido: colores `primary` y `chat` (modo oscuro slate + blue)
- fuente: Inter, system-ui, sans-serif

### `postcss.config.js`
- Plugins: `tailwindcss` + `autoprefixer`

### `Dockerfile` (multi-stage) — AFTER NGINX REMOVAL
- Stage 1 (`node:20-alpine AS builder`): instala deps y ejecuta `npm run build`
- Stage 2 (`node:20-alpine AS runner`): copia `dist/` y production deps, ejecuta `vite preview --host 0.0.0.0` en puerto 4173
- ~~Stage 2 (`nginx:alpine`): ~~ ~~sirve los assets estáticos en puerto 80~~

### `docker-compose.yml`
- Servicio `chat-app`, puerto 8082:4173 (vite preview, replacing nginx port 80)

### `.gitignore`
- Excluye: `node_modules/`, `.env`, `.vite/`, `dist/`, `*.log`, `*.pem`

## Archivos de Fuente (src/)

### `src/index.css`
- Directivas Tailwind: `@tailwind base; @tailwind components; @tailwind utilities;`
- Estilos base globales y variables CSS custom

### `src/main.tsx`
- Punto de entrada: monta con `createRoot`, `React.StrictMode`, importa CSS, renderiza `<App />`

### `src/App.tsx`
- Renderiza el layout principal
- Envuelve en `ChatProvider` (Context API)

## Tipos (`src/types/`)

### `src/types/chat.ts`
- `Message`: id, text, senderId, senderName, timestamp, channel, type
- `ChatChannel`: id, name, type, avatar, lastMessage, unreadCount, participants

### `src/types/user.ts`
- `User`: id, name, avatar, status (online/offline/away)
- `AuthUser` extiende `User`: token

### `src/types/index.ts`
- Re-export de todos los tipos

## Contexto (`src/context/`)

### `src/context/ChatContext.tsx`
- ChatContext con: channels, activeChannel, messages, currentUser
- Métodos: setActiveChannel, sendMessage, addChannel, removeChannel
- Hook `useChatContext()` con verificación de error si no está dentro del provider
- Componente `ChatProvider` con `useState`

### `src/context/index.ts`
- Re-export de `ChatContext`, `ChatProvider`, `useChatContext`

## Hooks (`src/hooks/`)

### `src/hooks/useChatMessages.ts`
- Scroll automático al final, filtrado por canal, carga histórica
- Usa `useRef`, `useCallback`

### `src/hooks/useChatNavigation.ts`
- Navegación entre canales sin acoplar a ChatContext
- Envuelve `setActiveChannel`

### `src/hooks/index.ts`
- Re-export de ambos hooks

## Componentes (`src/components/`)

### Sidebar/
- **Sidebar.tsx** – Componente principal: header + lista de canales + navegación
- **ChatChannelListItem.tsx** – Cada item: avatar, nombre, último mensaje, badge de no-leídos
- **SidebarHeader.tsx** – Cabecera: título/logo + botón crear nuevo canal

### ChatWindow/
- **ChatWindow.tsx** – Layout: MessageList (scrollable) + ChatInput (footer fijo)
- **MessageList.tsx** – Lista de MessageBubble con scroll automático + separadores de fecha
- **MessageBubble.tsx** – Mensaje individual: avatar, nombre, timestamp, texto (estilo condicional)
- **ChatInput.tsx** – Formulario: textarea auto-resizable + botón enviar (Enter para enviar, Shift+Enter nueva línea)

### Layout/
- **MainLayout.tsx** – Wrapper: Sidebar (izquierda) + ChatWindow (derecha, flex-1). Responsive: sidebar oculto en mobile con botón hamburger

### ui/
- **Button.tsx** – Reutilizable con variantes: primary, secondary, ghost, danger; soporta loading/disabled/size
- **Avatar.tsx** – Avatar con imagen, fallback de iniciales, indicador de estado
- **Input.tsx** – Input reutilizable con label, placeholder, focus ring, error state

## Utils

### `src/utils/constants.ts`
- Valores globales: canales por defecto, colores tema, límites de paginación, mensajes de bienvenida

## Públicos

### `public/favicon.ico`
- Identidad visual de la app en la pestaña del browser


# Project Structure Backend

```
the_backend/
│
├── Dockerfile                          # Multi-stage build for the Python app (Python 3.12 slim)
├── docker-compose.yml                  # Service orchestration (app container)
├── pyproject.toml                      # uv/pip dependency declarations + FastAPI CLI entrypoint
├── .env.example                        # Template for JWT_SECRET, OPENAI_API_KEY, etc.
│
├── app/
│   ├── __init__.py
│   │
│   ├── main.py                         # FastAPI application factory. Registers routers,
│   │                                    # lifespan handler, CORS middleware, WebSocket
│   │                                    # route at /ws/{thread_id}.
│   │
│   ├── config.py                       # Settings pulled from environment:
│   │                                    #   JWT_SECRET, JWT_ALGORITHM,
│   │                                    #   AGENT_MODEL (e.g. openai:gpt-4.1),
│   │                                    #   RECURSION_LIMIT per-thread.
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   └── jwt.py                      # JWT utilities:
│   │                                    #   - verify_token(token) -> decode + claims
│   │                                    #   - create_token(user_data) -> signed JWT
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── ws.py                       # WebSocket endpoint:
│   │   │                               #   @app.websocket("/ws/{thread_id}")
│   │   │                               #   1. Validate JWT (header or query param)
│   │   │                               #   2. Acquire or create a DeepAgent instance keyed
│   │   │                               #      by thread_id (pool pattern: dict of agent+config)
│   │   │                               #   3. Bidirectional bridge loop:
│   │   │                               #      - Client -> Agent: JSON "message" field
│   │   │                               #      - Agent -> Client: streamed tokens / tool calls
│   │   │   │                           #        / final response as server-sent JSON events
│   │   │                               #   4. Clean up agent pool entry on disconnect
│   │   │
│   │   ├── auth.py                     # REST auth endpoints (prefix="/auth"):
│   │   │                               #   POST /token  — accepts {"user_id": "..."}, returns JWT
│   │   │                               #   GET  /verify — reads Authorization header,
│   │   │   │                           #          validates token, returns decoded claims or 401
│   │   │
│   │   └── conversations.py            # Conversation endpoints (prefix="/conversations"):
│   │                                   #   GET    /{thread_id}  — returns agent pool status:
│   │   │                               #                thread_id, message_count, last_activity,
│   │   │                               #                whether the agent is still alive
│   │   │                               #   DELETE /{thread_id} — removes agent from the pool,
│   │   │                               #                effectively ending the conversation
│   │
│   ├── agent/
│   │   ├── __init__.py
│   │   └── manager.py                  # Agent lifecycle manager:
│   │                                    #   - AgentPool: class managing in-memory dict
│   │                                    #     thread_id -> (agent_instance, config)
│   │                                    #   - create_agent(thread_id) -> builds a new
│   │                                    #     DeepAgent via create_deep_agent() with:
│   │                                    #       • model parameter
│   │                                    #       • MemorySaver() checkpointer
│   │                                    #       • config={"configurable": {"thread_id": thread_id}}
│   │                                    #   - get_agent(thread_id) / remove_agent(thread_id)
│   │                                    #   - invoke_agent(thread_id, user_message) ->
│   │                                    #     streams result dict back
│   │
│   └── models/
│       ├── __init__.py
│       └── schemas.py                  # Pydantic response/request schemas used across
│                                        #   endpoints and WebSocket message protocol.
│
└── tests/
    ├── __init__.py
    ├── conftest.py                     # Shared fixtures: FastAPI test client, mock JWT
    ├── test_auth.py                    # POST /auth/token and GET /auth/verify tests
    ├── test_websocket.py               # WebSocket connect/disconnect/bridge tests
    └── test_conversations.py           # GET/DELETE conversation endpoints
```

## Architecture Walkthrough

### Entrypoint — `app/main.py`:
- Creates FastAPI app instance
- Includes auth router (prefix `/auth`), conversations router (prefix `/conversations`)
- Registers WebSocket route at `/ws/{thread_id}`

### Auth flow:
1. Client calls `POST /auth/token` with `{"user_id": "..."}` → returns `{"access_token": "<jwt>", "token_type": "bearer"}`
2. Client connects WebSocket with `wss://host/ws/{thread_id}?token=<jwt>` — JWT validated on connect; invalid → reject and close
3. `GET /auth/verify` — `Authorization: Bearer <token>` → returns decoded claims or 401

### WebSocket bridge (`/ws/{thread_id}`):
```
Client (JSON)                    Bridge                    DeepAgent
  |  {"type":"message","content":"..."}  |
  |  ---------------------------------->|  invoke agent (with config)
  |                                     |
  |                                     |  ← result["messages"][-1].content
  |  {"type":"token","content":"..."} <--|
  |  <----------------------------------|
  |                                     |
  |  {"type":"tool_call","name":"...",  |  ← agent called a tool
  |   "args":"..."}                     |
  |  <----------------------------------|
  |                                     |
  |  {"type":"done","content":"final"} <-|  ← agent finished
  |  <----------------------------------|
  |  close connection                   |
```

### Conversation REST endpoints:
- `GET /conversations/{thread_id}` — returns metadata from AgentPool about the active thread
- `DELETE /conversations/{thread_id}` — removes agent and its MemorySaver state from in-memory pool

### File Relationships:

| File | Depends On | Depends By |
|------|-----------|------------|
| `main.py` | `auth.jwt`, `api.ws`, `api.auth`, `api.conversations`, `agent.manager`, `models.schemas` | `Dockerfile`, `pyproject.toml` |
| `api/ws.py` | `auth.jwt`, `agent.manager`, `models.schemas` | `main.py` |
| `api/auth.py` | `auth.jwt`, `models.schemas` | `main.py` |
| `api/conversations.py` | `agent.manager`, `models.schemas` | `main.py` |
| `agent/manager.py` | LangChain, Config | `websocket bridge` |
| `auth/jwt.py` | Config | `api/ws.py`, `api/auth.py` |
| `config.py` | `.env` vars | All modules |
| `models/schemas.py` | Pydantic | All API modules |
