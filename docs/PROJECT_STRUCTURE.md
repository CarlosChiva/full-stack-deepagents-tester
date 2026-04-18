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

### `Dockerfile` (multi-stage)
- Stage 1 (`node:20-alpine AS builder`): instala deps y ejecuta `npm run build`
- Stage 2 (`nginx:alpine`): sirve los assets estáticos en puerto 80

### `docker-compose.yml`
- Servicio `chat-app`, puerto 8080:80

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
