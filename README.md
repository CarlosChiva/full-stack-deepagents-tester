# 💬 Chat Web App

Una aplicación web de chat en tiempo real con interfaz de **barra lateral + ventanas de chat**, construida con **React 19**, **TypeScript**, **Vite 6** y **TailwindCSS 3.4**.

---

## 📋 Tabla de Contenidos

- [🛠️ Tech Stack](#-tech-stack)
- [✨ Características](#-características)
- [📁 Estructura del Proyecto](#-estructura-del-proyecto)
- [🚀 Guía de Inicio](#-guía-de-inicio)
- [🐳 Docker](#-docker)
- [🏗️ Arquitectura](#️-arquitectura)
- [📸 Interfaz de Usuario](#-interfaz-de-usuario)
- [⚙️ Scripts de Desarrollo](#-scripts-de-desarrollo)

---

## 🛠️ Tech Stack

| Tecnología     | Versión  | Propósito                          |
|----------------|----------|-------------------------------------|
| **React**      | 19.x     | Biblioteca UI principal             |
| **TypeScript** | 5.x      | Tipado estático                     |
| **Vite**       | 6.x      | Empaquetador y dev server           |
| **TailwindCSS**| 3.4.x    | Framework CSS utilitario            |
| **PostCSS**    | —        | Procesamiento de estilos            |
| **Docker**     | latest   | Contenedores para desarrollo/prod   |
| **Node.js**    | 20.x     | Vite preview server en producción   |

---

## ✨ Características

- 💬 **Chat en tiempo real** con mensajería instantánea
- 📱 **Diseño responsive** — sidebar + chat window adaptables a móvil
- 🌙 **Modo oscuro** con paleta de colores slate + blue
- 🚀 **Rendimiento optimizado** con React.lazy y code splitting
- 🔒 **Tipado estricto** con TypeScript (`strict: true`)
- 🧩 **Context API** para gestión de estado global (sin Redux)
- 🐳 **Multi-stage Docker build** para imágenes minimalistas
- 🛡️ **Acceso seguro a índices** con `noUncheckedIndexedAccess`
- ✍️ **Textarea auto-resizable** con soporte de atajos (Enter / Shift+Enter)
- 🎭 **Avatares con fallback** de iniciales + indicador de estado

---

## 📁 Estructura del Proyecto

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

---

## 🚀 Guía de Inicio

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/chat-web-app.git
cd chat-web-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno (opcional)

```bash
cp .env.example .env
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

> La aplicación se ejecutará en [http://localhost:3000](http://localhost:3000) con **Hot Module Replacement (HMR)** activado.

### 5. Compilar para producción

```bash
npm run build
```

Esto generará una carpeta `dist/` con la app optimizada y minificada.

### 6. Previsualizar la versión de producción

```bash
npm run preview
```

> Sirve la carpeta `dist/` localmente para verificar el build antes de desplegar.

---

## 🐳 Docker

### Construir con Dockerfile

```bash
# Construir la imagen de producción
docker build -t chat-web-app .

# Ejecutar el contenedor
docker run -p 8080:80 chat-web-app
```

> La aplicación estará disponible en [http://localhost:8080](http://localhost:8080).

### Usar Docker Compose (recomendado)

```bash
# Levantar la aplicación completa
docker compose up -d

# Detener la aplicación
docker compose down

# Detener y eliminar volúmenes
docker compose down -v
```

**Configuración del servicio:**

| Propiedad        | Valor          |
|------------------|----------------|
| Servicio         | `chat-app`     |
| Puerto expuesto  | `8080:80`      |
| Imagen base      | `node:20-alpine` (builder) → `node:20-alpine` (prod, vite preview) |

El `Dockerfile` utiliza **multi-stage build**:

1. **Stage 1** (`builder`): `node:20-alpine` — instala dependencias y corre `npm run build`
2. **Stage 2** (`runtime`): `node:20-alpine` — ejecuta `vite preview --host 0.0.0.0 --port 8082`

---

## 🏗️ Arquitectura

### Patrones utilizados

| Patrón                    | Ubicación              | Descripción                                      |
|---------------------------|------------------------|--------------------------------------------------|
| **Context API**           | `src/context/`         | Estado global de canales, mensajes y usuario     |
| **Custom Hooks**          | `src/hooks/`           | Lógica reutilizable (mensajes, navegación)       |
| **Componentes modulares** | `src/components/`      | UI desacoplada y reutilizable                     |
| **Tipos centralizados**   | `src/types/`           | Definiciones TypeScript re-exportadas             |
| **Alias de imports**      | `@/*` → `src/*`        | Rutas limpias en todo el código                   |

### Gestión de Estado — ChatContext

La aplicación utiliza **React Context API** para la gestión de estado global, evitando la sobrecarga de librerías externas como Redux:

- **`ChatProvider`**: Proveedor que envuelve la aplicación y expone el estado
- **`useChatContext()`**: Hook personalizado con validación para acceder al contexto
- **Estado principal**:
  - `channels` — Lista de canales de chat
  - `activeChannel` — Canal seleccionado actualmente
  - `messages` — Mensajes del canal activo
  - `currentUser` — Usuario autenticado
- **Acciones**: `setActiveChannel`, `sendMessage`, `addChannel`, `removeChannel`

```tsx
import { ChatProvider, useChatContext } from "./context";

// En App.tsx
<ChatProvider>
  <App />
</ChatProvider>

// En cualquier componente hijo
const { activeChannel, sendMessage } = useChatContext();
```

---

## 📸 Interfaz de Usuario

### Layout General

```
┌─────────────────────────────────────────────────────┐
│  🗂️ Sidebar                    │  💬 Ventana Chat  │
│                             │                      │
│  ┌──────────────────────┐   │  ┌────────────────┐  │
│  │   Crear Nuevo Canal  │   │  │ # nombre-canal │  │
│  ├──────────────────────┤   │  ├────────────────┤  │
│  │ 👤 Canal General     │   │  │                │  │
│  │ 👥 Canal Design      │   │  │ Mensajes...    │  │
│  │ 👥 Canal Random      │   │  │                │  │
│  │                      │   │  │ [input...]  ➤  │  │
│  ├──────────────────────┤   │  └────────────────┘  │
│  │  Avatar | Estado     │   │                      │
│  └──────────────────────┘   │                      │
└─────────────────────────────────────────────────────┘
```

### Componentes principales

- **Sidebar** — Lista de canales con avatares, último mensaje y badge de mensajes no leídos
- **ChatWindow** — Layout principal con lista de mensajes desplazable e input fijo
- **MessageBubble** — Burbujas de mensaje con avatar, nombre, timestamp y estilo condicional
- **ChatInput** — Textarea auto-ajustable con soporte de envío con Enter
- **MainLayout** — Contenedor flexible que posiciona sidebar y chat; responsive con menú hamburguesa en móvil

### Temas visuales

- **Colores Primary**: slate-900, slate-800, slate-700 (fondo)
- **Colores Chat**: blue-500, blue-600, blue-400 (acentos y mensajes propios)
- **Tipografía**: Inter / system-ui / sans-serif

---

## ⚙️ Scripts de Desarrollo

| Comando           | Descripción                              |
|-------------------|------------------------------------------|
| `npm run dev`     | Inicia servidor de desarrollo (HMR)      |
| `npm run build`   | Compila para producción                  |
| `npm run preview` | Sirve la build de producción localmente  |
| `npm run lint`    | Ejecuta ESLint                           |
| `npm run typecheck` | Verifica tipado con TypeScript         |

---

> **Repositorio**: [github.com/tu-usuario/chat-web-app](https://github.com/tu-usuario/chat-web-app)
>
> **Licencia**: MIT
