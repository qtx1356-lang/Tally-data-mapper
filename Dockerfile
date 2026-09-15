# Multi-stage production container build for EXFIN Tally Audit Platform
# Stage 1: Build Frontend and Server Bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build config
COPY . .

# Compile Vite client and bundle Express server into dist/server.cjs
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Minimal Production Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Set production environment defaults
ENV NODE_ENV=production
ENV EXFIN_MODE=web
ENV PORT=3000
ENV HOST=0.0.0.0

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# Copy compiled frontend assets and bundled server from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Create directories for persistent offline dataset storage, uploads, and streaming sessions
RUN mkdir -p /app/data/offline_datasets /app/data/uploads /app/data/temp_uploads /app/data/import_sessions && chown -R node:node /app/data

# Security: Run as unprivileged node user
USER node

# Expose ONLY the cloud web application port (assigned by PORT, default 3000)
# NOTE: Tally port 9000 is internal and NOT exposed publicly.
EXPOSE 3000

# Container orchestration healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-3000}/api/health || exit 1

# Start bundled production server
CMD ["node", "dist/server.cjs"]
