# FRAMEWORKS & TECHNOLOGIES

## Stack Principal

| Capa | Tecnología | Versión | Propósito |
|------|-----------|---------|-----------|
| **Framework** | React | ^19.0.0 | Librería UI principal |
| **Lenguaje** | TypeScript | ^5.7.0 | Tipado estricto |
| **Build Tool** | Vite | ^6.0.0 | Bundler, HMR, build |
| **Estilos** | TailwindCSS | ^3.4.17 | CSS utility-first |
| **PostCSS** | postcss | ^8.4.49 | Procesamiento CSS |
| **Autoprefixer** | autoprefixer | ^10.4.20 | Prefijos CSS automáticos |
| **Plugin React** | @vitejs/plugin-react | ^4.3.0 | Integración React con Vite |
| **Linting** | eslint | ^9.17.0 | Calidad de código |
| **TypeScript ESLint** | @typescript-eslint/eslint-plugin | ^8.18.0 | Linting TS |
| **TypeScript ESLint Parser** | @typescript-eslint/parser | ^8.18.0 | Parser TS para ESLint |
| **Tipo React** | @types/react | ^19.0.0 | Definiciones de tipos |
| **Tipo React DOM** | @types/react-dom | ^19.0.0 | Definiciones de tipos |

## Estado Global
- **Método:** React Context API (nativo, sin librerías externas)
- **Archivo principal:** `src/context/ChatContext.tsx`
- **Estado gestionado:** channels, activeChannel, messages, currentUser

## Contenedores
- **Dockerfile:** Multi-stage build (node:20-alpine + nginx:alpine)
- **docker-compose.yml:** Servicio `chat-app` → puerto 8080

## Configuraciones Clave

| Archivo | Propósito |
|---------|-----------|
| `tsconfig.json` | TypeScript — strict mode, alias @/, jsx react-jsx |
| `tsconfig.node.json` | TypeScript config para archivos de build |
| `vite.config.ts` | Vite — React plugin, alias @ → src, puerto 3000 |
| `tailwind.config.ts` | Tailwind — contenido, tema extendido (colores chat/slate/blue) |
| `postcss.config.js` | PostCSS — tailwindcss + autoprefixer plugins |
| `Dockerfile` | Build multi-stage → node build + nginx serve |
| `docker-compose.yml` | Orquestación Docker — servicio chat-app:8080 |

## Dependencias de Producción (runtime)

| Package | Razón |
|---------|-------|
| `react` | Framework UI |
| `react-dom` | Renderizado DOM |

## Dependencias de Desarrollo (dev)

| Package | Razón |
|---------|-------|
| `typescript` | Compilador TS |
| `vite` | Bundler y dev server |
| `@vitejs/plugin-react` | HMR para React |
| `tailwindcss` | Framework CSS |
| `autoprefixer` | Prefijos CSS |
| `postcss` | Procesador CSS |
| `eslint` | Linter |
| `@typescript-eslint/*` | TS linting |
| `@types/react`, `@types/react-dom` | Tipos TS |

## Notas de Implementación

- **No se requieren librerías de routing externas** — La app es una single-page con un solo layout.
- **No se requieren librerías de state management externas** — Context API nativo de React cumple el requisito.
- **No se requieren librerías de icons** — Se pueden usar SVG inline o iniciales como fallback visual.
- **Tema visual:** Dark mode con paleta slate + blue, definida en `tailwind.config.ts`
