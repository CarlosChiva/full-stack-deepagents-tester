# PROJECT STATE

## Todo List

### Sidebar (TASK-026 / TASK-027 / TASK-028) — Completed

- **TASK-026** (ChatChannelListItem.tsx): ✅ APPROVED on first review — avatar, channel name, last message, unread badge, active state, keyboard accessibility.
- **TASK-027** (SidebarHeader.tsx): ❌ REJECTED (missing logo/title, non-ghost button, no useState, no bg-slate-800) → ✅ REVISION APPROVED after fix — added ChatApp logo + title + subtitle, converted to ghost style, added local search state, applied bg-slate-800 to container.
- **TASK-028** (Sidebar.tsx): ❌ REJECTED (unnecessary `as number | undefined` cast) → ✅ REVISION APPROVED after fix — replaced cast with native TypeScript ternary. Rest of layout intact.

### ChatWindow (TASK-029 / TASK-030 / TASK-031 / TASK-032) — Completed

- **TASK-029** (MessageBubble.tsx): ❌ FIRST REJECTED (props incorrectas, no usaba Avatar componente, sin useState, sin accesibilidad, timestamp incompleto, fecha-fns v4 import) → REVISION (dead code: currentUserId no usado) → ✅ REVISION APPROVED — props correctas `isOwn + message`, Avatar de `@/ui/Avatar`, useState para hover, role/aria-label, "hoy HH:MM" format, memo optimization, date-fns v4 import correcto.
- **TASK-030** (MessageList.tsx): ❌ FIRST REJECTED (prop channelID eliminada, sin useState propio) → ✅ REVISION APPROVED — channelID restaurada en interface, pasa al hook useChatMessages, useState para isAtBottom/hasUnread, scroll detection, auto-scroll smart.
- **TASK-031** (ChatInput.tsx): ✅ APPROVED on first review — textarea auto-resizable, botón enviar SVG avión, Enter/Shift+Enter, disabled state support, aria-labels.
- **TASK-032** (ChatWindow.tsx): ❌ FIRST REJECTED (activeChannel.description no existe → usar lastMessage, props no declaradas en MessageList, doble scroll useEffect) → REVISION (issues de infraestructura pre-existentes ignorados: tsconfig.node.json broken, Avatar.tsx inline styles) → ✅ REVISION APPROVED — 0 errores TS en ChatWindow.tsx, header con lastMessage, solo currentUserId pasado a MessageList, typing indicator con debounce, document.title dinámico.

| # | ID | Estado | Descripción |
|---|--------|--------|-------------|
| 1 | TASK-001 | DONE | Crear `package.json` con metadatos, scripts y todas las dependencias |
| 2 | TASK-002 | DONE | Crear `vite.config.ts` con plugin React, alias @ y puerto 3000 |
| 3 | TASK-003 | DONE | Crear `tsconfig.json` con strict: true, aliases y jsx react-jsx |
| 4 | TASK-004 | DONE | Crear `tsconfig.node.json` con configuración para archivos de build |
| 5 | TASK-005 | DONE | Crear `tailwind.config.ts` con content paths, tema extendido dark slate+blue |
| 6 | TASK-006 | DONE | Crear `postcss.config.js` con plugins tailwindcss y autoprefixer |
| 7 | TASK-007 | DONE | Crear `Dockerfile` multi-stage: node:20-alpine builder + nginx:alpine serve |
| 8 | TASK-008 | DONE | Crear `docker-compose.yml` con servicio chat-app:puerto 8080:80 |
| 9 | TASK-009 | DONE | Crear `.env.example` con variable de entorno básica |
| 10 | TASK-010 | DONE | Crear `.gitignore` excluyendo node_modules, .env, .vite, dist, logs, pem |
| 11 | TASK-011 | DONE | Crear `public/favicon.ico` con placeholder/icono |
| 12 | TASK-012 | DONE | Crear `src/index.css` con directivas Tailwind y variables CSS custom |
| 13 | TASK-013 | DONE | Crear `src/main.tsx` como punto de entrada con createRoot |
| 14 | TASK-014 | DONE | Crear `types/chat.ts` con interfaces Message y ChatChannel |
| 15 | TASK-015 | DONE | Crear `types/user.ts` con interfaces User y AuthUser |
| 16 | TASK-016 | DONE | Crear `types/index.ts` como barrel file re-exportando tipos |
| 17 | TASK-017 | DONE | Crear `utils/constants.ts` con valores globales y datos por defecto |
| 18 | TASK-018 | DONE | Crear `context/ChatContext.tsx` con ChatProvider, useChatContext, y gestión de estado |
| 19 | TASK-019 | DONE | Crear `context/index.ts` como barrel file re-exportando contexto |
| 20 | TASK-020 | DONE | Crear `hooks/useChatMessages.ts` con scroll, filtrado y carga histórica |
| 21 | TASK-021 | DONE | Crear `hooks/useChatNavigation.ts` para navegación entre canales |
| 22 | TASK-022 | DONE | Crear `hooks/index.ts` como barrel file re-exportando hooks |
| 23 | TASK-023 | DONE | Crear `ui/Button.tsx` con variantes primary, secondary, ghost, danger |
| 24 | TASK-024 | DONE | Crear `ui/Avatar.tsx` con imagen, fallback iniciales, indicador estado |
| 25 | TASK-025 | DONE | Crear `ui/Input.tsx` con label, placeholder, focus ring, error state |
| 26 | TASK-026 | DONE | Crear `Sidebar/ChatChannelListItem.tsx` con avatar, nombre, último mensaje, badge |
| 27 | TASK-027 | DONE | Crear `Sidebar/SidebarHeader.tsx` con título/logo y botón crear canal |
| 28 | TASK-028 | DONE | Crear `Sidebar/Sidebar.tsx` — componente principal con header + lista canales |
| 29 | TASK-029 | DONE | Crear `ChatWindow/MessageBubble.tsx` con avatar, nombre, timestamp, estilo condicional |
| 30 | TASK-030 | DONE | Crear `ChatWindow/MessageList.tsx` con lista de bubbles y separadores de fecha |
| 31 | TASK-031 | DONE | Crear `ChatWindow/ChatInput.tsx` con textarea auto-resizable, Enter/Shift+Enter |
| 32 | TASK-032 | DONE | Crear `ChatWindow/ChatWindow.tsx` layout con MessageList + ChatInput |
| 33 | TASK-033 | DONE | ✅ APPROVED — MainLayout.tsx: Sidebar + ChatWindow responsive, mobile hamburger toggle, overlay, TypeScript types correctos, accesibilidad |
| 34 | TASK-034 | DONE | ✅ APPROVED — App.tsx: envuelve MainLayout con ChatProvider, importa App.css, estructura correcta |
| 35 | TASK-035 | DONE | ✅ APPROVED — App.css: 382 líneas con scrollbars custom, slide-in, fade-in, line-clamp, hover transitions, dark theme |
| 36 | TASK-036 | DONE | ✅ APPROVED — 2 SVGs con paleta del proyecto: avatar-placeholder.svg (64x64) + chat-logo.svg (48x48), directorio images/ creado |
| 37 | TASK-037 | DONE | ✅ APPROVED — README.md completo en español con stack, estructura, setup, Docker, arquitectura, scripts |
