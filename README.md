# Revora

Monorepo: **backend** (Express API + BullMQ workers), **whatsapp-order-os** (Next.js landing), Docker Compose for local **PostgreSQL** and **Redis**.

## Run with Docker

1. **Start Postgres and Redis** (from this directory — repo root):

   ```bash
   docker compose up -d
   ```

   Legacy Docker Compose v1:

   ```bash
   docker-compose up -d
   ```

2. **Backend**

   ```bash
   cd backend
   npm install
   cp .env.example .env
   # First time on an empty database (fresh Compose volume):
   npm run migrate:schema
   npm run migrate
   npm run dev
   ```

   On an existing database that already has tables, skip `migrate:schema` and run only `npm run migrate`.

   Ensure `.env` includes (matches the Compose services above):

   - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revora`
   - `REDIS_URL=redis://localhost:6379`

### Start / stop containers

| Action | Command |
|--------|---------|
| Start (detached) | `docker compose up -d` |
| Stop (keep data) | `docker compose stop` |
| Stop and remove containers | `docker compose down` |
| Stop and remove containers + volumes | `docker compose down -v` |

Healthchecks: `docker compose ps` shows `healthy` for Postgres and Redis when ready.

More API detail: [backend/README.md](backend/README.md).
