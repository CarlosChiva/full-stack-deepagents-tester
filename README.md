# 💬 Deep Agent — AI Chat Web App

Una aplicación web de chat en tiempo real con agentes IA impulsados por **Deep Agents**, backend **FastAPI + Python 3.12** y frontend **React 19 + Vite 6 + TypeScript**.

---

## 📋 Tabla de Contenidos

- [🛠️ Tech Stack](#️-tech-stack)
- [✨ Características](#-características)
- [📁 Estructura del Repositorio](#-estructura-del-repositorio)
- [🚀 Guía de Inicio](#-guía-de-inicio)
- [🐳 Docker](#-docker)
- [🏗️ Arquitectura](#️-arquitectura)
- [📸 Interfaz de Usuario](#-interfaz-de-usuario)
- [⚙️ Scripts de Desarrollo](#-scripts-de-desarrollo)

---

## 🛠️ Tech Stack

### Backend

| Tecnología      | Versión    | Propósito                              |
|----- -----------|----- ----  |---- -----------------------------------|
| **Python**      | 3.12      | Lenguaje principal                     |
| **FastAPI**     | latest    | Framework web y API REST               |
| **Deep Agents** | latest    | Framework de agentes IA                |
| **LangChain**   | latest    | Tool integration y agent orchestration |
| **Pydantic**    | 2.x       | Validación de schemas                  |
| **Uvicorn**     | latest    | ASGI server                            |

### Frontend

| Tecnología     | Versión  | Propósito                          |
|----- ---------  |----- ----|---- -------------------------------|
| **React**      | 19.x     | Biblioteca UI principal            |
| **TypeScript** | 5.x      | Tipado estático                    |
| **Vite**       | 6.x      | Empaquetador y dev server          |
| **TailwindCSS**| 3.4.x    | Framework CSS utilitario           |
| **PostCSS**    | —        | Procesamiento de estilos           |

### Infraestructura

| Tecnología     | Propósito                           |
|----- --------   |---- --------------------------------|
| **Docker**     | Contenedores para desarrollo/prod   |
| **Docker Compose** | Orquestación de servicios      |
| **Node.js**    | 20.x — Vite preview server en prod  |

---

## ✨ Características

### Backend
- 🤖 **Agentes IA** con Deep Agents y LangChain
- 🔌 **WebSocket** para comunicación en tiempo real
- 🔒 **Autenticación JWT** en WebSocket y endpoints REST
- 🧠 **Memoria persistente** con MemorySaver checkpointer
- 📡 **Agent Pool** — gestión de agentes por thread_id
- 🔧 **Tool calling** streaming al cliente en tiempo real

### Frontend
- 💬 **Chat en tiempo real** con mensajería instantánea
- 📱 **Diseño responsive** — sidebar + chat window adaptables a móvil
- 🌙 **Modo oscuro** con paleta de colores slate + blue
- 🚀 **Rendimiento optimizado** con React.lazy y code splitting
- 🔒 **Tipado estricto** con TypeScript (`strict: true`)
- 🧩 **Context API** para gestión de estado global
- ✍️ **Textarea auto-resizable** con Enter / Shift+Enter
- 🎭 **Avatares con fallback** de iniciales + indicador de estado

---

## 📁 Estructura del Repositorio

```
deepagent/
├── AGENTS.md                         # Instrucciones para agentes IA
├── docker-compose.yml                # Orquestación: backend + frontend
├── skills-lock.json                  # Lock file de skills (gitignored)
├── docs/
│   ├── PROJECT_STRUCTURE.md          # Estructura detallada del proyecto
│   ├── PROJECT_STATE.md
│   ├── REQUIREMENTS.md
│   └── FRAMEWORKS.md
│
├── deep-agent-backend/               # FastAPI + DeepAgent (Python 3.12)
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── .env.example
│   ├── deep_agents_config.json       # Config de agentes, sub-agentes, MCP
│   ├── test_deepagents_fix.py        # Test standalone en root
│   │
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app: routers, lifespan, CORS, WS
│   │   ├── config.py                 # Settings desde .env (JWT, model, etc.)
│   │   │
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   └── jwt.py               # verify_token(), create_token()
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── ws.py                # WebSocket /ws/{thread_id}
│   │   │   ├── auth.py              # POST /auth/token, GET /auth/verify
│   │   │   └── conversations.py     # GET/DELETE /conversations/{thread_id}
│   │   │
│   │   ├── agent/
│   │   │   ├── __init__.py
│   │   │   ├── deep_agent.py        # DeepAgent configuration and setup
│   │   │   └── manager.py           # AgentPool: create/get/remove/invoke
│   │   │
│   │   └── models/
│   │       ├── __init__.py
│   │       └── schemas.py           # Pydantic schemas para API/WS
│   │
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py              # Fixtures: test client, mock JWT
│       ├── test_auth.py
│       ├── test_websocket.py
│       └── test_conversations.py
│
└── deepagent-frontend/              # React 19 + Vite 6 + TypeScript
    ├── Dockerfile                   # Multi-stage: build + vite preview
    ├── docker-compose.yml
    ├── package.json
    ├── vite.config.ts               # React plugin, @ alias → src/
    ├── tsconfig.json                # strict: true, noUncheckedIndexedAccess
    ├── tsconfig.node.json
    ├── tailwind.config.ts           # Tema slate + blue, Inter font
    ├── postcss.config.js
    ├── index.html
    ├── .env.example
    │
    ├── public/
    │   └── favicon.ico
    │
    └── src/
        ├── assets/
        │   └── images/
        ├── components/
        │   ├── Sidebar/
        │   │   ├── Sidebar.tsx
        │   │   ├── ChatChannelListItem.tsx
        │   │   └── SidebarHeader.tsx
        │   ├── ChatWindow/
        │   │   ├── ChatWindow.tsx
        │   │   ├── MessageList.tsx
        │   │   ├── MessageBubble.tsx
        │   │   └── ChatInput.tsx
        │   ├── Layout/
        │   │   └── MainLayout.tsx
        │   └── ui/
        │       ├── Button.tsx
        │       ├── Avatar.tsx
        │       └── Input.tsx
        ├── context/
        │   ├── ChatContext.tsx       # Estado global: channels, messages, user
        │   └── index.ts
        ├── hooks/
        │   ├── useChatMessages.ts    # Auto-scroll, filtrado por canal
        │   ├── useChatNavigation.ts  # Navegación entre canales
        │   └── index.ts
        ├── types/
        │   ├── chat.ts              # Message, ChatChannel
        │   ├── user.ts              # User, AuthUser
        │   └── index.ts
        ├── utils/
        │   └── constants.ts         # Canales default, tema, pagination
        ├── App.tsx
        ├── App.css
        ├── index.css
        └── main.tsx
```

---

## 🚀 Guía de Inicio

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/deepagent.git
cd deepagent
```

### 2. Backend

```bash
cd deep-agent-backend
pip install -e ".[dev]"
cp .env.example .env   # Configurar JWT_SECRET (min 32 chars) + OPENAI_API_KEY
```

**Ejecutar:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8003
```

**Tests:**
```bash
pytest
```

### 3. Frontend

```bash
cd deepagent-frontend
npm ci
```

**Ejecutar:**
```bash
npm run dev    # Vite dev server en puerto 3000
```

**Build y verificación:**
```bash
npm run build      # tsc -b && vite build
npm run typecheck  # tsc --noEmit
npm run lint       # eslint .
npm run preview    # servir dist/ localmente
```

---

## 🐳 Docker

### Desde la raíz del repositorio

```bash
docker compose up -d       # backend (8003) + frontend preview (8082)
docker compose down        # detener servicios
docker compose down -v     # detener + eliminar volúmenes
```

**Puertos:**

| Servicio  | Puerto host | Descripción                     |
|----- ----- |---- ------- |---- ----------------------------|
| Backend   | 8003       | FastAPI + WebSocket             |
| Frontend  | 8082       | Vite preview server             |

> **Nota:** Docker Compose usa `network_mode: host` — el backend se une directamente a la red del host.

### Build de producción

**Frontend** — Multi-stage Dockerfile:
1. **Stage 1** (`node:20-alpine AS builder`): instala deps y ejecuta `npm run build`
2. **Stage 2** (`node:20-alpine AS runner`): copia `dist/` y ejecuta `vite preview` en puerto 4173

**Backend** — Dockerfile con Python 3.12 slim:
- Instala dependencias desde `pyproject.toml`
- Ejecuta Uvicorn con el app FastAPI

---

## 🏗️ Arquitectura

### Backend — Flujos principales

#### Autenticación
1. `POST /auth/token` con `{"user_id": "..."}` → retorna JWT
2. WebSocket conecta con `ws://host/ws/{thread_id}?token=<jwt>` → JWT validado en connect
3. `GET /auth/verify` con `Authorization: Bearer <token>` → claims o 401

#### WebSocket Bridge (`/ws/{thread_id}`)
```
Client (JSON)                    Bridge                    DeepAgent
  |  {"type":"message","content":"..."}  |
  |  ------–----------------––--------->|  invoke agent (con config + thread_id)
  |                                     |
  |                                     |  ← result["messages"][-1].content
  |  {"type":"token","content":"..."} <--|
  |  <------–------–------–-----------|--|
  |                                     |
  |  {"type":"tool_call","name":"...",  |  ← agent called a tool
  |   "args":"..."}                     |
  |  <------–------–------–-----------|--|
  |                                     |
  |  {"type":"done","content":"final"} <-|  ← agent finished
  |  <------–------–------–-----------|--|
  |  close connection                   |
```

#### Agent Pool
- `AgentPool` gestiona un dict in-memory: `thread_id → (agent_instance, config)`
- `create_agent(thread_id)` construye un DeepAgent con MemorySaver checkpointer
- `GET /conversations/{thread_id}` — metadata del thread activo
- `DELETE /conversations/{thread_id}` — cleanup de agent + estado

### Frontend — Patrones

| Patrón                    | Ubicación              | Descripción                                      |
|----- -- -------- -------- |---- ---------- --------|---- ---------------------------------------------|
| **Context API**           | `src/context/`         | Estado global de canales, mensajes y usuario      |
| **Custom Hooks**          | `src/hooks/`           | Lógica reutilizable (mensajes, navegación)        |
| **Componentes modulares** | `src/components/`      | UI desacoplada y reutilizable                     |
| **Tipos centralizados**   | `src/types/`           | Definiciones TypeScript re-exportadas             |
| **Alias de imports**      | `@/*` → `src/*`        | Rutas limpias en todo el código                   |

### Gestión de Estado — ChatContext

- **`ChatProvider`**: Proveedor que envuelve la aplicación
- **`useChatContext()`**: Hook con validación de error
- **Estado**: `channels`, `activeChannel`, `messages`, `currentUser`
- **Acciones**: `setActiveChannel`, `sendMessage`, `addChannel`, `removeChannel`

### Dependencias entre archivos

| Archivo               | Depende de                                  | Usado por            |
|-----                 |---- -------                                 |---- -----------------|
| `main.py`            | auth.jwt, api/*, agent.manager, models       | Dockerfile, pyproject |
| `api/ws.py`          | auth.jwt, agent.manager, models.schemas     | main.py              |
| `api/auth.py`        | auth.jwt, models.schemas                    | main.py              |
| `api/conversations.py`| agent.manager, models.schemas               | main.py              |
| `agent/manager.py`   | LangChain, config                           | ws bridge            |
| `auth/jwt.py`        | config                                      | api/ws.py, api/auth  |
| `config.py`          | variables `.env`                            | todos los módulos    |
| `models/schemas.py`  | Pydantic                                    | todos los endpoints  |

---

## 📸 Interfaz de Usuario

### Layout General

```
┌───────────────┬──────────────────────────────────┐
│  🗂️ Sidebar   │  💬 Ventana Chat                  │
│               │                                  │
│ Crear Canal   │  ┌────────────────────────────┐  │
│ ├─────────────┤│  │ # nombre-canal           │  │
│ 👤 General    ││  ├──────────────────────────┤  │
│ 👥 Design     ││  │                          │  │
│ 👥 Random     ││  │  Mensajes...             │  │
│               ││  │                          │  │
│               ││  │  [input...]       ➤     │  │
│ Avatar │ 🟢  ││  └──────────────────────────┘  │
└───────────────┴──────────────────────────────────┘
```

### Componentes principales

- **Sidebar** — Lista de canales con avatares, último mensaje y badge de no leídos
- **ChatWindow** — Layout con lista de mensajes scrollable + input fijo
- **MessageBubble** — Burbujas con avatar, nombre, timestamp y estilo condicional
- **ChatInput** — Textarea auto-resizable con Enter para enviar, Shift+Enter nueva línea
- **MainLayout** — Contenedor flexible; responsive con menú hamburguesa en móvil

### Temas visuales

- **Colores Primary**: slate-900, slate-800, slate-700 (fondo)
- **Colores Chat**: blue-500, blue-600, blue-400 (acentos y mensajes propios)
- **Tipografía**: Inter / system-ui / sans-serif

---

## ⚙️ Scripts de Desarrollo

### Backend

| Comando                        | Descripción                           |
|----- -------------------------  |---- ----------------------------------|
| `pip install -e ".[dev]"`      | Instalar deps + dev extras            |
| `uvicorn app.main:app --reload`| Servidor FastAPI en puerto 8003       |
| `pytest`                       | Ejecutar tests                        |

### Frontend

| Comando             | Descripción                              |
|----- ---------------|---- --------------------------------------|
| `npm run dev`       | Servidor Vite con HMR (puerto 3000)       |
| `npm run build`     | Compila para producción (tsc + vite)      |
| `npm run preview`   | Sirve la build de producción localmente   |
| `npm run lint`      | Ejecuta ESLint                            |
| `npm run typecheck` | Verifica tipado con TypeScript            |

---

