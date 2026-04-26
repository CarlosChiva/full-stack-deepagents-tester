# REQUIREMENTS — Diagnose and Fix Frontend/Backend Communication After Nginx Removal

## Objective

After the Nginx removal from the frontend Docker setup, the page is blank/dead and frontend-backend communication is broken. The user opens the web page and sees nothing.

## Investigation Areas

The user requests investigation of:

1. **Docker containers status** — Are both frontend and backend running correctly?
2. **Frontend Vite preview server** — Is it serving correctly on port 8082? (Vite preview default is port 4173, not 8082)
3. **Backend API on port 8003** — Is it responding?
4. **`VITE_API_BASE_URL` configuration** — Is the environment variable configured correctly for Docker? With `network_mode: host`, `localhost:8003` may or may not work depending on where the browser resolves it
5. **`.env` / `.env.example` in frontend** — How is the API URL configured?
6. **CORS issues** — Could CORS be blocking frontend→backend requests?
7. **`docker-compose.yml` `network_mode: host`** — How does it affect connectivity between services and from the browser?
8. **Proxy configuration** — Is a proxy needed and is it configured?

## Context

- Previous Nginx removal replaced Stage 2 with `vite preview --host 0.0.0.0` in the Dockerfile
- Vite preview defaults to port **4173**, but the docker-compose.yml maps `8082:4173` (or possibly `8082:8082`)
- Docker uses `network_mode: host` — both containers share the host network namespace
- Frontend API calls use `VITE_API_BASE_URL` (baked at build time)
- Backend needs `.env` with `JWT_SECRET` and `OPENAI_API_KEY` before startup
- AGENTS.md notes: "Docker Compose uses `network_mode: host`"

## Constraints

- Do NOT break the local development workflow (`npm run dev` on port 3000)
- Minimal disruption — fix the root cause, don't re-architecture
- Must work with `docker compose up`
