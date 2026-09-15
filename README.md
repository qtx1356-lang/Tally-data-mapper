# EXFIN Tally Audit Platform

Enterprise-grade financial audit analytics, forensic scanning, and decision-support platform with TallyPrime integration. Built with a unified React 18 + Vite frontend and Express 4 backend, supporting both **Cloud Web Deployment** and **Windows Desktop Electron** targets.

---

## Key Features

- **Dual-Target Architecture**: Runs as a public cloud web application (Render, Google Cloud Run, Railway) or as a native Windows Electron desktop application.
- **Offline Data Import Pipeline**: Streaming, bounded-memory parser for Tally XML DayBook & Masters, DayBook JSON collections, and multi-sheet Excel workbooks. Supports files up to 500 MB without high memory consumption.
- **Pluggable Storage Abstraction**:
  - `LocalStorageProvider`: File-based NDJSON persistence in `data/offline_datasets` for Desktop & single-node deployments.
  - `PostgresStorageProvider`: SQL-backed persistence with schema pooling via `pg` when `DATABASE_URL` is set, enabling multi-instance web horizontal scaling.
- **Audit Analytics & Reconstruction**: Automated statutory tax checks, round-sum detection, high-value voucher alerts, weekend transaction screening, and balance reconstructions.
- **Cloud Security Boundaries**:
  - Tally port 9000 is isolated from public exposure.
  - SSRF protection against cloud metadata endpoints (`169.254.x.x`, `metadata.google`) and unauthorized LAN sockets in web mode.
  - Sanitized file uploads with strict path-traversal prevention.
  - Production security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `X-XSS-Protection`).

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Mode
```bash
# Web development server (Vite + Express on port 3000)
npm run dev

# Desktop development (Express backend + Electron window)
npm run dev:desktop
```

### 3. Production Build & Start
```bash
# Build frontend and bundle server to dist/server.cjs
npm run build

# Start production web server
npm start
```

### 4. Build Windows Desktop Installer
```bash
npm run dist
```

---

## Deployment

For detailed deployment documentation, refer to [DEPLOYMENT.md](DEPLOYMENT.md).

### Cloud Platforms (Render, Railway, Google Cloud Run)
- Set environment variable `EXFIN_MODE=web`
- Provide `PORT` (automatically assigned by platform)
- (Optional) Provide `DATABASE_URL` for PostgreSQL storage
- Web service runs `npm run build` and `npm start`
- Health check endpoints: `/api/health` and `/health`

---

## Configuration

See [.env.example](.env.example) for available environment variables:
- `PORT`: Platform HTTP port (default: 3000)
- `HOST`: Ingress host (default: 0.0.0.0)
- `EXFIN_MODE`: `web` or `desktop`
- `DATABASE_URL`: PostgreSQL connection string (optional)
- `TALLY_BRIDGE_URL`: Authorized Tally gateway bridge (optional)
- `GEMINI_API_KEY`: Server-side API key for Gemini AI features (optional)
