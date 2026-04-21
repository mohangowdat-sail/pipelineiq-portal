# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PipelineIQ is a production-grade AI-native pipeline observability portal for a data engineering consultancy. It is a demo product with synthetic but realistic data, designed to later connect to live Azure Monitor, AWS CloudWatch, and Oracle OCI telemetry.

## Tech Stack

**Backend:** FastAPI, SQLAlchemy ORM, PostgreSQL (local), JWT auth via python-jose, Alembic migrations, uvicorn

**Frontend:** React 18, Vite, Tailwind CSS v3, Recharts, React Router v6, Axios, date-fns, Lucide React

**No Docker.** PostgreSQL runs as a local service.

## Commands

```bash
# One-time setup (creates DB, installs deps, runs migrations, seeds data)
./setup.sh

# Start backend
cd backend && uvicorn main:app --reload
# Runs on http://localhost:8000

# Start frontend
cd frontend && npm run dev
# Runs on http://localhost:5173

# Run a single Alembic migration
cd backend && alembic upgrade head

# Re-seed data (wipes and re-seeds)
cd backend && python seed.py

# Frontend lint
cd frontend && npm run lint
```

## Environment & Auth

- `.env` lives at `backend/.env` with `APP_PASSWORD`, `DATABASE_URL`, `JWT_SECRET`
- Default password: `PipelineIQ2025`
- JWT tokens expire in 8 hours
- All API routes except `POST /auth/login` require `Authorization: Bearer <token>`
- Frontend stores JWT in `localStorage`

## Users & Client Access

| Username   | Role            | Client Access                                      |
|------------|-----------------|---------------------------------------------------|
| admin      | admin           | All clients                                        |
| keerthana  | founder         | All clients                                        |
| mohan      | senior_engineer | All clients including PipelineIQ Internal          |
| owais      | senior_engineer | Spirax Group, CocoBlu Retail, GoldenSands, Rotimatic |
| meghana    | engineer        | Spirax Group, Greaves Cotton                       |
| anis       | engineer        | Spirax Group                                       |
| jayasree   | engineer        | Spirax Group, GoldenSands                          |
| anosh      | engineer        | Rotimatic                                          |
| aiswarya   | engineer        | Rotimatic                                          |

## Clients & Cloud Platforms

| Client             | Cloud  | Environments         |
|--------------------|--------|----------------------|
| PipelineIQ Internal | Azure  | prod, staging, dev   |
| Spirax Group       | Azure  | prod, staging        |
| Greaves Cotton     | AWS    | prod, staging, dev   |
| CocoBlu Retail     | AWS    | prod, staging        |
| GoldenSands        | Oracle | prod, staging        |
| Rotimatic          | AWS    | prod, dev            |

Cloud badge colours (strict): Azure = `#7C5CBF` (purple), AWS = `#F97316` (orange), Oracle = `#0EA5E9` (teal-blue)

## Design System (Strict)

```
Background:         #0F1117
Surface cards:      #1A1D27
Secondary surface:  #212435
Borders:            #2A2D3E
Accent purple:      #7C5CBF
Accent purple light:#9D7FD4
Green healthy:      #22C55E
Amber warning:      #F59E0B
Red critical:       #EF4444
Text primary:       #F1F5F9
Text secondary:     #94A3B8
Text muted:         #475569
```

- No white backgrounds anywhere
- Cards: border-radius 12px, 1px border, subtle inner glow on hover (`box-shadow` with accent purple at 15% opacity)
- Only gradient: login card (subtle radial)
- Charts: dark-appropriate Recharts themes, no white plot areas
- Font: Inter (loaded via Google Fonts in `index.html`)
- Sidebar: 240px fixed, dark surface
- Top navbar: 56px fixed
- All Tailwind colour values extended in `tailwind.config.js`

## API Structure

Base URL: `http://localhost:8000`

| Method | Endpoint                        | Notes                                      |
|--------|---------------------------------|--------------------------------------------|
| POST   | `/auth/login`                   | Returns JWT                                |
| GET    | `/auth/me`                      | Current user info                          |
| GET    | `/clients`                      | Scoped to current user's access            |
| GET    | `/clients/:id/pipelines`        | Pipelines for a client                     |
| GET    | `/incidents`                    | Query params: client_id, severity, status, pattern_tag, search |
| GET    | `/incidents/:id`                | Full detail incl. slack_thread, notification_log |
| PATCH  | `/incidents/:id/claim`          | Sets assigned_to to current user           |
| PATCH  | `/incidents/:id/resolve`        | Sets resolved, resolved_at, resolution_time_minutes |
| GET    | `/engineers`                    | Admin and senior roles only                |
| GET    | `/analytics/patterns`           | Pattern frequency per client               |
| GET    | `/analytics/runs`               | Daily run counts for last 30 days          |
| GET    | `/analytics/mttr`               | Avg resolution time per client and pattern |

All list endpoints enforce client-scope — engineers never receive data outside their access list.

## Data Model Key Points

**Pipelines:** name, cloud_service (specific, e.g. "Azure Data Factory"), environment, active_branch, 30-day daily run history (status + duration per day)

**Incidents (52 total seeded):** id, title, client, pipeline, environment, severity (critical/warning/info), status (open/investigating/resolved), cloud_service, pattern_tag, root_cause, suggested_steps, services_impacted, created_at, resolved_at, resolution_time_minutes, assigned_to, people_involved, slack_thread (6–9 messages), notification_log

**pattern_tag values:** schema_drift, null_constraint, volume_anomaly, dependency_violation, referential_integrity, scd_explosion, auth_failure, timeout, config_drift

## Incident Distribution (Seeded)

- **Spirax Group:** 14 incidents — 2 open+critical, 1 investigating; 5 `dependency_violation` over 30 days
- **Greaves Cotton:** 6 incidents — all resolved, all healthy
- **CocoBlu Retail:** 8 incidents — 1 open `volume_anomaly`, unclaimed
- **GoldenSands:** 9 incidents — `auth_failure` recurring 4× this week, 2 currently open
- **Rotimatic:** 8 incidents — `schema_drift` resolved yesterday in 6 min
- **PipelineIQ Internal:** 7 incidents — all green

## Incident Claim System

- Open incident → "Pick up this incident" button (for engineers with client access)
- `PATCH /incidents/:id/claim` sets `assigned_to` and status to `investigating`
- Other users see: "Currently being investigated by [Full Name]" banner
- Only the assigned engineer sees "Mark as resolved"
- Frontend polls incident status every 20 seconds

## Branch Tracking

- Branch badge colours: green = `main`, blue = `staging`, amber = feature branch
- If any prod pipeline runs on non-main branch: show warning banner on client pipeline page

## Pages

1. **Login** — full screen dark, centered card
2. **Dashboard** — hero page; animated header, 5 stat cards, 3 charts (area, donut, bar), client health grid, recent activity feed
3. **Incidents** — filterable list (left) + detail panel (right, 55% width); Slack thread render, notification history
4. **Pipelines** — client tabs, environment filter, table with sparkline health bars, inline expanded rows
5. **Pattern Analysis** — "Failure pattern intelligence"; line chart, bar chart, heatmap grid (HTML/Tailwind), recurring alerts section
6. **Notifications** — full alert history, filterable by channel/client/date
7. **Engineers** — admin/founder/senior only; cards with MTTR stats, expandable incident list
8. **Coming Soon** — 6 Phase 3 feature cards in 3×2 grid, each with a multi-step demo modal (clearly labelled "Demo simulation — not live")

## Navigation (Sidebar)

- Logo + lightning bolt icon at top
- User avatar (initials), full name, role badge
- Nav items with Lucide icons: Dashboard, Incidents, Pipelines, Pattern Analysis, Notifications, Engineers (conditional), Coming Soon
- Client quick-switcher chips below nav items (accessible clients only, active highlighted)
- Bottom: backend connection status dot (green/red) + logout button

## File Layout

All commands (`./setup.sh`, `cd backend`, `cd frontend`) must be run from within `PipelineIQ-Portal/`.

```
PipelineIQ/                        # Root folder — open Claude Code from here
├── PipelineIQ-Portal/             # Web portal app (this codebase)
│   ├── CLAUDE.md
│   ├── setup.sh
│   ├── backend/
│   │   ├── main.py           # FastAPI app, CORS, router registration
│   │   ├── models.py         # SQLAlchemy models
│   │   ├── auth.py           # JWT logic, password hashing
│   │   ├── seed.py           # Full 52-incident + user + pipeline seed
│   │   ├── requirements.txt
│   │   ├── .env              # Created by setup.sh
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── clients.py
│   │   │   ├── incidents.py
│   │   │   ├── engineers.py
│   │   │   └── analytics.py
│   │   └── alembic/
│   │       ├── env.py
│   │       └── versions/
│   └── frontend/
│       ├── index.html        # Inter font loaded here
│       ├── package.json
│       ├── vite.config.js
│       ├── tailwind.config.js # Extended with full design system colours
│       ├── postcss.config.js
│       └── src/
│           ├── main.jsx
│           ├── App.jsx        # Router setup
│           ├── api/
│           │   └── axios.js   # Axios instance with auth interceptor
│           ├── contexts/
│           │   └── AuthContext.jsx
│           ├── data/
│           │   └── mockData.js # All synthetic data constants
│           ├── components/
│           │   ├── Sidebar.jsx
│           │   ├── TopNav.jsx
│           │   └── Layout.jsx
│           └── pages/
│               ├── Login.jsx
│               ├── Dashboard.jsx
│               ├── Incidents.jsx
│               ├── Pipelines.jsx
│               ├── PatternAnalysis.jsx
│               ├── Notifications.jsx
│               ├── Engineers.jsx
│               └── ComingSoon.jsx
└── PipelineIQ-Architecture/       # Architecture segment (separate project)
```
