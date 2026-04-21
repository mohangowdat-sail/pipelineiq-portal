# PipelineIQ Portal

**Stakeholder-facing demo dashboard for PipelineIQ. React + Vite frontend, FastAPI backend.**

This is the early demo UI built with dummy data to showcase what PipelineIQ will look like to a data platform operator. Live on Vercel.

> This portal will be **superseded in Phase 6** by a production dashboard built inside the main Architecture repo, wired to real FastAPI + pgvector incident data. Until then, Portal stays frozen — the Vercel deploy depends on it.

For the full project, see the companion repos:
- **[`pipelineiq-architecture`](https://github.com/mohangowdat-sail/pipelineiq-architecture)** — specs, docs, application code, decision log
- **[`pipelineiq-iac`](https://github.com/mohangowdat-sail/pipelineiq-iac)** — Terraform + Bicep for every Azure resource

---

## Layout

```
backend/                FastAPI backend (auth, CRUD, Slack webhook proxy)
  main.py               Entry point
  auth.py               JWT session issuance + validation
  database.py           SQLAlchemy session + engine
  models.py             ORM models
  routers/              Per-resource route modules
  alembic/              DB migrations
  seed.py               Seed script for demo data
  .env.example          Environment template
  requirements.txt      Python deps

frontend/               React + Vite SPA
  src/                  Components, pages, styles
  api/                  Vercel Edge/serverless API routes (if any)
  vercel.json           Vercel SPA rewrite config
  package.json          npm scripts (dev / build / preview / lint)

setup.sh                One-shot local setup script
CLAUDE.md               Session contract for Claude Code work on this repo
```

---

## Prerequisites

- Python 3.10+ (backend)
- Node 18+ (frontend)
- (optional) Vercel CLI for deploying — `npm i -g vercel`

---

## Getting started

```bash
git clone https://github.com/mohangowdat-sail/pipelineiq-portal.git
cd pipelineiq-portal

# One-shot setup (creates venv, installs deps, runs migrations, seeds demo data)
bash setup.sh

# Backend
cp backend/.env.example backend/.env
# Fill in APP_PASSWORD, DATABASE_URL, JWT_SECRET, SLACK_WEBHOOK_URL
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend dev server proxies `/api/*` to the backend via `vite.config.js`.

---

## Deployment

### Current: Vercel (frontend)

The frontend is deployed to Vercel. The `.vercel/` folder (gitignored) links a local clone to a specific Vercel project via `projectId` + `orgId`. Each developer runs `vercel link` once after cloning to associate their working copy with the deployed project.

**To redeploy manually:**

```bash
cd frontend
vercel --prod
```

**To enable GitHub → Vercel auto-deploys** (recommended going forward):

1. In the Vercel dashboard, open the existing `pipelineiq-portal` project
2. Settings → Git → **Connect Git Repository**
3. Select `mohangowdat-sail/pipelineiq-portal`
4. Set **Root Directory** to `frontend` (backend is not deployed to Vercel)
5. Confirm `npm run build` as build command and `dist` as output directory
6. Save

After that, every push to `main` triggers a production deploy and every PR gets a preview URL automatically.

### Backend

FastAPI backend is not deployed to Vercel. For local development it runs via uvicorn. For hosted deployment options (Azure Container Apps, Render, Fly.io, etc.), the backend is stateless once `DATABASE_URL` points at a hosted database.

---

## Conventions

- Secrets live in `.env` (gitignored) and `.env.example` (committed template)
- Database URL + JWT secret + Slack webhook are the four required backend env vars
- The frontend reads no secrets directly — all secret-bearing calls go through the backend

---

## Status

This repo is **frozen pending Phase 6** of the main PipelineIQ build. Bug fixes to the live demo are welcome; new features go into the production dashboard in `pipelineiq-architecture/react/` instead.

---

*PipelineIQ is an independent portfolio project. Velora Retail Group is a synthetic dataset, not a real company.*
