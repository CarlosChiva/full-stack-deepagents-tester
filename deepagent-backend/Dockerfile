# ==============================================================================
# Multi-stage Dockerfile for Python 3.12 FastAPI application
# ==============================================================================

# --------------------------------------------------------------------------
# Stage 1: Builder — resolve and install dependencies
# --------------------------------------------------------------------------
FROM python:3.12-slim AS builder

LABEL maintainer="dread"
LABEL version="1.0"
LABEL description="Build stage: installs Python dependencies for the backend app"

WORKDIR /app

# Copy only the dependency manifest first so Docker can cache this layer
COPY pyproject.toml .

# Install dependencies declared in pyproject.toml (PEP 517)
# --no-cache-dir avoids storing the apt index in the final image layer
RUN pip install --no-cache-dir .

# Set PYTHONPATH so imports resolve correctly regardless of cwd
ENV PYTHONPATH=/app

# --------------------------------------------------------------------------
# Stage 2: Runtime — minimal, non-root image with only what's needed
# --------------------------------------------------------------------------
FROM python:3.12-slim AS runtime

LABEL maintainer="dread"
LABEL version="1.0"
LABEL description="Runtime stage: minimal image with the FastAPI app"

# --- Security: create a non-root user and install curl for healthchecks ---
RUN groupadd --system appgroup && \
    useradd --system --gid appgroup --no-create-home appuser && \
    apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed site-packages from the builder stage (dependency cache only)
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source code
COPY app/ ./app/

# Copy the environment template and deep agents configuration
COPY .env.example .env.example
COPY deep_agents_config.json ./deep_agents_config.json

# --- Environment variables for Python runtime ---
ENV PYTHONPATH=/app \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8003

# --- Healthcheck ---
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8003/health || exit 1

# --- Expose application port ---
EXPOSE 8003

# --- Entrypoint: run the app via uvicorn ---
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8003"]
