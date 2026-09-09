# Revora — WhatsApp Order OS (Phase 1 API)

Production-oriented backend for the **Revenue Leak Detector**: ingests WhatsApp webhooks, logs messages, tracks owner response times, flags **at-risk** conversations (keyword-based food/order intent + delayed reply), estimates exposure using a configurable AOV, and exposes reporting endpoints.

**No frontend** — HTTP API + workers only.

## Stack

- Node.js 20+, Express, TypeScript  
- PostgreSQL (Supabase-compatible SQL in `src/db/schema.sql`)  
- Redis + BullMQ (async ingest follow-up, delayed risk evaluation, leak finalization, report jobs)  
- Structured logging (pino) + request correlation id

## Run with Docker

Use **PostgreSQL** and **Redis** from the repo root without local installs:

1. `docker compose up -d` (from the parent of `backend/` — see [root README](../README.md#run-with-docker))
2. Backend:

   ```bash
   cd backend
   npm install
   # Empty DB: npm run migrate:schema once, then:
   npm run migrate
   npm run dev
   ```

Use `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/revora` and `REDIS_URL=redis://localhost:6379` (see `.env.example`).

## Render with free Upstash Redis

The root `render.yaml` deploys the API and Postgres on Render and accepts an
external Upstash `REDIS_URL`. It does not provision Render Key Value.

1. Create a dedicated Upstash database on the **Free** plan in a region near the
   Render API and Postgres. Do not enable eviction; BullMQ requires no eviction.
2. Use the TLS connection URL supplied by Upstash, including its username,
   password, host, and port. Store it only in Render's `REDIS_URL` environment
   variable; never commit it.
3. Deploy the API with root directory `backend`, build command
   `npm ci --include=dev && npm run build`, and start command
   `npm run migrate:schema && npm run migrate && npm start`. Free Render services
   do not support a pre-deploy command. Use the existing Postgres internal URL
   when provisioning manually, and place the API in the same Render region.
4. Keep `FRONTEND_ORIGINS=https://whatsapp-order-os.vercel.app`. The Blueprint
   generates `JWT_SECRET` and supplies clearly labelled Meta placeholders so
   validation passes; real WhatsApp delivery requires real Meta credentials.
   `ALLOW_TEST_SIMULATE_API` remains false.
5. Warm the API with `GET /health` and require `database: true` and `redis: true`.
   Check deployment logs and a BullMQ job round trip before connecting the frontend.
6. Set Vercel Production `REVORA_BACKEND_URL` and `NEXT_PUBLIC_REVORA_API_URL`
   to the verified API origin, then redeploy the frontend. Verify live onboarding,
   account registration, and the authenticated `/admin` dashboard.

The Upstash free plan is for demos and has a monthly command quota. Revora shares
its main Redis connection, with one extra blocking connection for each of its five
workers. The Render configuration increases idle polling and stalled-job scan
intervals to reduce commands, which can add up to one minute of idle job pickup
latency. Job payloads, retained failures, and the dead-letter queue still consume
space; monitor usage. Render free web services sleep when idle, which also pauses
their workers. Free Render Postgres expires after 30 days.

References: [Upstash pricing](https://upstash.com/pricing/redis),
[Upstash BullMQ integration](https://upstash.com/docs/redis/integrations/bullmq),
[BullMQ Redis configuration](https://docs.bullmq.io/guide/going-to-production).

## Production hardening

- **Webhook HMAC** — verifies raw JSON body using `WEBHOOK_APP_SECRET` (Meta/WhatsApp style `X-Hub-Signature-256: sha256=<hex>`), optional `X-Revora-Signature`, or `webhook-signature: v1,<base64>` digest. **401** when invalid. Dev default `WEBHOOK_SKIP_SIGNATURE_VERIFY=true` — turn off in production.
- **Idempotency** — Redis `SET NX` per `wa_message_id` plus Postgres `UNIQUE(wa_message_id)`; duplicate webhooks return `deduplicated` counts and skip enqueue.
- **Conversation lock** — Redis lock per `(user_id, customer_phone)` so ingest/risk workers serialize side-effects for the same thread.
- **Retries / DLQ** — shared BullMQ exponential backoff + `QUEUE_MAX_ATTEMPTS`; exhausted jobs recorded on **`revora-dead-letter`** with `failedReason` + payload snapshot.
- **Per-user config** — `users.config` JSONB: `{ "aov_inr", "response_threshold_seconds" }` (**preferred**). Headers `X-AOV-INR` / `X-Response-Threshold-Seconds` apply only when DB omits those keys.
- **Rate limits** — Redis-backed `express-rate-limit`; tighter limits on `POST /webhook`; `/health` exempt from global limiter.
- **Payloads** — WhatsApp `text`, `interactive` (button/list reply titles), `button`; skips unsupported types, messages with `errors`, and Cloud messages missing `id`.

Production runbook: see `PRODUCTION_CHECKLIST.md`.

## Quick start (local)

1. **PostgreSQL** — create database `revora` (or any name) and set `DATABASE_URL`, **or** run [Docker Compose at the repo root](../README.md#run-with-docker) (`postgres` on `localhost:5432`).

2. **Redis** — run locally (`redis://localhost:6379`), **or** use the Compose `redis` service on the same URL.

3. **Environment**

   ```bash
   cp .env.example .env
   ```

   Fill `DATABASE_URL`, `REDIS_URL`, and optional `DEFAULT_BUSINESS_PHONE` (owner WhatsApp in digits, no `+` required).

4. **Database**

   ```bash
   npm install
   # Brand-new database (once): creates all tables from schema.sql
   npm run migrate:schema
   # Ongoing upgrades: additive SQL in src/db/migrations/
   npm run migrate
   ```

5. **Run API + workers** (same process — suitable for Railway single service)

   ```bash
   npm run dev
   # or
   npm run build && npm start
   ```

6. **Smoke test**

   ```bash
   curl -s http://localhost:8080/health
   curl -s -X POST http://localhost:8080/webhook -H "Content-Type: application/json" --data-binary @samples/webhook-simulate-incoming.json
   ```

   After ~5 minutes (default threshold), the delayed job marks the message **at risk** if no owner reply was ingested. Shorter threshold for demos:

   ```bash
   curl -s -X POST http://localhost:8080/webhook -H "Content-Type: application/json" -H "X-Response-Threshold-Seconds: 30" --data-binary @samples/webhook-simulate-incoming.json
   ```

7. **Reports** — use a user id returned implicitly: query Postgres `SELECT id, phone_number FROM users;` then:

   ```bash
   curl -s "http://localhost:8080/reports/14days?userId=YOUR_USER_UUID"
   ```

Copy uses **“at risk”** language only — never confirmed lost revenue.

## Configuration

| Env | Purpose |
|-----|---------|
| `PORT` | HTTP port (default `8080`) |
| `DATABASE_URL` | Postgres connection string |
| `REDIS_URL` | Redis for BullMQ |
| `DEFAULT_AOV_INR` | Per-order at-risk estimate (default `350`) |
| `RESPONSE_THRESHOLD_SECONDS` | Late reply threshold (default `300` = 5 min) |
| `DEFAULT_BUSINESS_PHONE` | Fallback owner line if payload omits it |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (optional fallback channel) |
| `TELEGRAM_WEBHOOK_SECRET` | Validates `x-telegram-bot-api-secret-token` on `/webhook/telegram` |
| `TELEGRAM_OWNER_CHAT_ID` | Owner Telegram chat id for outbound report delivery when `MESSAGING_PROVIDER=telegram` |
| `MESSAGING_PROVIDER` | Outbound provider for owner messages: `whatsapp` (default) or `telegram` |
| `DATABASE_SSL` | `true` to force TLS even without `sslmode=require` in URL |
| `DATABASE_SSL_REJECT_UNAUTHORIZED` | Set `false` for some Supabase pooler chains |

### Telegram fallback quick setup

1. Create bot via `@BotFather` and set `TELEGRAM_BOT_TOKEN`.
2. Set `TELEGRAM_WEBHOOK_SECRET` to a long random value.
3. Expose backend on HTTPS (ngrok / cloudflare tunnel).
4. In development (`/dev/*` enabled), configure webhook:
   - `POST /dev/telegram/set-webhook` with JSON `{ "url": "https://<public-host>/webhook/telegram", "secretToken": "<same-secret>" }`
5. Validate integration:
   - `GET /dev/telegram/get-me`
   - `GET /dev/telegram/webhook-info`
   - `POST /dev/send-telegram` with JSON `{ "chatId": "<telegram-chat-id>", "message": "test" }`

### Per-user JSON (`users.config`)

```sql
UPDATE users
SET config = jsonb_build_object(
  'aov_inr', 420,
  'response_threshold_seconds', 240
)
WHERE phone_number = '919811111111';
```

### Per-request header fallbacks (webhook)

Used **only when** the corresponding DB field is absent:

- `X-Response-Threshold-Seconds`  
- `X-AOV-INR`  
- `X-Business-Phone` — owner line when the Cloud payload does not carry it clearly  

### Testing HMAC locally

Use the exact raw bytes you POST (no reformatting). With Node:

```bash
node -e "const fs=require('fs');const c=require('crypto');const s=process.env.WEBHOOK_APP_SECRET||'devsecret';const b=fs.readFileSync('samples/webhook-360dialog-incoming.json');process.stdout.write('sha256='+c.createHmac('sha256',s).update(b).digest('hex'));"
```

Then:

```bash
curl -s -X POST http://localhost:8080/webhook \
  -H "Content-Type: application/json" \
  -H "x-hub-signature-256: sha256=PASTE_HEX_ABOVE" \
  --data-binary @samples/webhook-360dialog-incoming.json
```

(Set `WEBHOOK_APP_SECRET` / `WEBHOOK_SKIP_SIGNATURE_VERIFY=false` to enforce.)

## HTTP API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/webhook` | Ingest Cloud/360dialog payloads or `{ simulate: true, ... }` (sync response with counts) |
| `POST` | `/webhook/whatsapp` | Same as `/webhook` but **200 immediately**; ingest + `revora-message-ingest` run async (configure 360dialog callback here) |
| `POST` | `/webhook/telegram` | Telegram bot webhook fallback; verifies `x-telegram-bot-api-secret-token` when `TELEGRAM_WEBHOOK_SECRET` is set, then maps updates into the same ingest pipeline |
| `POST` | `/api/onboard` | Landing signup; optional body `source`: `instagram` \| `whatsapp` \| `manual` (default `manual`); creates/updates `users` + `leads` + funnel `config.lifecycle` |
| `GET` | `/api/leads` | List acquisition leads (optional `ADMIN_API_KEY` → `X-Admin-Key`) |
| `PATCH` | `/api/leads/:id` | Update lead `status` (`new`…`dropped`), `notes`, `intent_tag` |
| `POST` | `/api/leads/:id/followup` | Set `last_contacted_at` and `next_followup_at` +24h |
| `GET` | `/api/metrics` | Funnel (`leads` / `onboarded` / `active` / `dropped`), users, `conversion_rate_percent`, `drop_rate_percent`, `avg_time_to_activation_hours` |
| `GET` | `/reports/daily?userId=<uuid>` | Rolling **24h** aggregates + summary |
| `GET` | `/reports/14days?userId=<uuid>` | Rolling **14d** aggregates + summary |
| `GET` | `/health` | DB, Redis, BullMQ **queue counts**, optional `queueMetricsError` |

## Architecture

- **Controllers** parse/validate inputs only.  
- **Services** own business rules (`WebhookService`, `MessageService`, `ResponseTrackingService`, `RiskService`, `LeakService`, `ReportService`).  
- **Middlewares** — `middlewares/` (`webhookSignature`, rate limits, `requestId`, errors).  
- **Queues** — `revora-message-ingest`, `revora-risk-evaluation`, `revora-leak-calculation`, `revora-report-generation`, **`revora-dead-letter`**.  
- Webhook **raw body** route verifies HMAC, parses JSON, then persists + **enqueue** ingest (non-blocking).

## Railway

1. Create a **Web** service from this `backend` directory.  
2. Add **Postgres** + **Redis** plugins (or external URLs).  
3. Set env vars to match plugin connection strings.  
4. **Build command:** `npm install && npm run build`  
5. **Start command:** `npm run migrate && npm start` (or run migrate once via one-off job, then `npm start`).  

> Use a **persistent** Node process (not serverless). Webhooks and BullMQ expect long-lived workers.

## Sample payloads

See `samples/`:

- `webhook-simulate-incoming.json` / `webhook-simulate-outgoing.json` — fastest local testing  
- `webhook-360dialog-incoming.json` — shape compatible with WhatsApp Cloud / BSP field names  
- `webhook-interactive-incoming.json` — `interactive.button_reply` example  

## Database tables

- `users` — business (owner) tenant by phone + **`config` JSONB** (AOV, threshold)  
- `messages` — inbound/outbound legs; `phone_number` is the **customer**; `wa_message_id` dedupes webhooks  
- `response_tracking` — first owner reply delay per incoming message  
- `risk_events` — at-risk signals + `estimated_loss` + `confidence` + `reason`  

## License

Private / proprietary — Revora internal use unless stated otherwise.
