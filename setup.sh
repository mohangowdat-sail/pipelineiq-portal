#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║           PipelineIQ — Setup Script              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── Create PostgreSQL database ───────────────────────────────────────────────
echo "► Creating PostgreSQL database 'pipelineiq'..."
createdb pipelineiq 2>/dev/null || echo "  Database already exists, skipping."

# ── Create .env ──────────────────────────────────────────────────────────────
echo "► Writing backend/.env..."
cat > backend/.env << 'EOF'
APP_PASSWORD=PipelineIQ2025
DATABASE_URL=postgresql://localhost/pipelineiq
JWT_SECRET=pipelineiq-secret-jwt-key-change-in-production
EOF

# ── Python dependencies ──────────────────────────────────────────────────────
echo "► Installing Python dependencies..."
cd backend
pip install -r requirements.txt -q

# ── Alembic migrations ───────────────────────────────────────────────────────
echo "► Running Alembic migrations..."
alembic upgrade head 2>/dev/null || python -c "
from database import engine
from models import Base
Base.metadata.create_all(bind=engine)
print('  Created tables via SQLAlchemy (Alembic not initialised — run: alembic revision --autogenerate -m init)')
"

# ── Seed data ────────────────────────────────────────────────────────────────
echo "► Seeding data (users, clients, pipelines, 52 incidents)..."
python seed.py

cd ..

# ── Frontend dependencies ────────────────────────────────────────────────────
echo "► Installing frontend npm dependencies..."
cd frontend
npm install --silent
cd ..

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    Setup complete!                               ║"
echo "╠══════════════════════════════════════════════════════════════════╣"
echo "║                                                                  ║"
echo "║  Start backend:   cd backend && uvicorn main:app --reload        ║"
echo "║  Start frontend:  cd frontend && npm run dev                     ║"
echo "║  Open:            http://localhost:5173                          ║"
echo "║                                                                  ║"
echo "║  Login with any username + password: PipelineIQ2025             ║"
echo "║  Usernames: mohan · keerthana · owais · anis · jayasree ·       ║"
echo "║             anosh · aiswarya · meghana · admin                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
