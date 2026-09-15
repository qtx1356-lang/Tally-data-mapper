# EXFIN Tally Audit Platform — Web & Desktop Deployment Guide

This document outlines the deployment architecture, configuration options, and security boundaries for the **EXFIN Tally Audit Platform**.

---

## 1. Dual Deployment Architecture

The platform is designed to operate seamlessly across two operational targets without code divergence:

```
                      ┌──────────────────────────────────────────────┐
                      │         EXFIN Tally Audit Platform           │
                      │  React 18 + Vite (Frontend)                  │
                      │  Express 4 + TypeScript (Unified API Engine) │
                      └──────────────────────┬───────────────────────┘
                                             │
                     ┌───────────────────────┴───────────────────────┐
                     │                                               │
                     ▼                                               ▼
     ┌───────────────────────────────┐               ┌───────────────────────────────┐
     │     Cloud Web Deployment      │               │   Electron Desktop Target     │
     │  - Cloud Run / Node Service   │               │  - Windows/macOS/Linux App    │
     │  - Dynamic Cloud PORT         │               │  - Local Port 9000 polling    │
     │  - Offline Ingestion (Primary)│               │  - Standalone bundled runtime │
     │  - Port 9000 Isolated         │               │  - Air-gapped branch audits   │
     └───────────────────────────────┘               └───────────────────────────────┘
```

1. **Production Cloud Web Service**:
   - Runs directly on Node.js containers (Google Cloud Run, AWS App Runner, ECS, Render, Railway, DigitalOcean, Kubernetes).
   - Dynamically binds to the platform's assigned `PORT` environment variable (falling back to 3000 in dev/local).
   - Serves the compiled production Vite single-page application directly from the Express backend with SPA fallback.
   - Primary data ingestion pathway: **Offline Data Import** (streaming XML, JSON DayBook, and multi-sheet Excel workbooks).

2. **Electron Desktop Build**:
   - Preserved as a first-class desktop target (`npm run dev:desktop` and `npm run dist`).
   - Bundles the unified backend via `esbuild` to `dist/server.cjs` and launches it as an internal child process.
   - Supports direct local LAN connection to Tally on port 9000.

---

## 2. Port & Network Security Policy

### Why Tally Port 9000 is NOT Exposed Publicly
- **Protocol Nature**: Tally's integration server (HTTP port 9000) is an unauthenticated internal protocol designed strictly for local area networks or single workstations.
- **Security Boundary**: Exposing port 9000 over the public internet would present significant security and data privacy risks to accounting ledgers.
- **Web Solution**: In Cloud Web Deployment, users import standard Tally exported files (**XML DayBook & Masters**, **JSON collections**, or **Excel Trial Balance / P&L / Ledgers**) via the integrated streaming offline pipeline. Port 9000 remains strictly internal to the user's local network.
- **SSRF Hardening**: Server-side endpoints reject cloud metadata endpoints (`169.254.x.x`, `metadata.google`, `metadata.internal`) and invalid binding addresses.

---

## 3. Production Health Endpoints

The web backend exposes standard production health endpoints:

| Endpoint | Purpose | Consumers |
| :--- | :--- | :--- |
| `GET /api/health` | Comprehensive health payload with memory, uptime, mode, and security status | Cloud monitoring, dashboards, automated probes |
| `GET /health` | Root-level health check | Kubernetes liveness/readiness probes, Docker HEALTHCHECK |
| `GET /api/healthz` | Kubernetes standard probe | Ingress controllers, ALB/GCLB health checks |
| `GET /api/system/deployment-info` | Deployment metadata and offline ingestion capabilities | Frontend client and diagnostic audits |

### Sample Response (`GET /api/health`):
```json
{
  "status": "ok",
  "app": "EXFIN Tally Audit Platform",
  "version": "1.0.1",
  "mode": "web",
  "environment": "production",
  "server": {
    "port": 3000,
    "host": "0.0.0.0",
    "platform": "linux",
    "nodeVersion": "v22.14.0",
    "uptimeSeconds": 142
  },
  "memory": {
    "heapUsedMb": 54.21,
    "heapTotalMb": 112.50,
    "rssMb": 185.34
  },
  "security": {
    "tallyPort9000ExposedPublicly": false,
    "readOnlyGuardEnforced": true,
    "ssrfProtection": true
  },
  "capabilities": {
    "webDeployment": true,
    "desktopElectronTarget": true,
    "offlineDataImport": {
      "xml": true,
      "json": true,
      "excel": true,
      "streamingParser": true,
      "boundedMemoryChunking": true
    }
  }
}
```

---

## 4. Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Platform-assigned web port (automatically populated by Cloud Run / PaaS). |
| `HOST` | `0.0.0.0` | Bind host for HTTP ingress. |
| `NODE_ENV` | `production` | Runtimes switch: development uses Vite dev middleware; production serves compiled `dist/`. |
| `EXFIN_MODE` | `web` | Operational mode (`web` or `desktop`). |
| `GEMINI_API_KEY` | *(Optional)* | Server-side API key for Gemini AI Audit Copilot. |

---

## 5. Build & Execution Commands

### Cloud Web Mode
```bash
# 1. Build production Vite assets and bundle server.ts -> dist/server.cjs
npm run build

# 2. Start production web server
npm start
# or explicitly:
npm run start:web
```

### Docker Container Deployment
```bash
# Build production Docker image
docker build -t exfin-tally-audit-platform .

# Run container mapping port 8080 to internal PORT 3000
docker run -p 8080:3000 -e PORT=3000 exfin-tally-audit-platform
```

### Electron Desktop Mode
```bash
# Run local desktop development
npm run dev:desktop

# Package installer / binary for desktop release
npm run dist
```
