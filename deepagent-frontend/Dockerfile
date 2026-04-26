# Stage 1: Build
FROM node:20-alpine AS builder

ARG VITE_API_BASE_URL=http://localhost:8003
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

WORKDIR /app

# Install dependencies first (leverage Docker cache)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Production preview (replaces nginx)
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built assets and package files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install ALL dependencies (including vite in devDependencies) for preview server
RUN npm ci

EXPOSE 8082

# Run vite preview, binding to all interfaces on port 8082
CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "8082"]
