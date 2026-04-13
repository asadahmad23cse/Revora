# Revora Telegram Production Checklist

Use this checklist before showing to recruiters or going live.

## 1) Security first

- Revoke any token that was ever shared publicly.
- Generate a fresh `TELEGRAM_BOT_TOKEN` from `@BotFather`.
- Set a long random `TELEGRAM_WEBHOOK_SECRET`.
- Never commit `.env` or real tokens.

## 2) Required environment

Set these in production secrets:

- `NODE_ENV=production`
- `DATABASE_URL=...`
- `REDIS_URL=...`
- `MESSAGING_PROVIDER=telegram`
- `TELEGRAM_BOT_TOKEN=...`
- `TELEGRAM_WEBHOOK_SECRET=...`
- `TELEGRAM_OWNER_CHAT_ID=<owner-chat-id>`

Optional fallback:

- `DEFAULT_BUSINESS_PHONE=<owner-phone>`

## 3) Infrastructure checks

- PostgreSQL reachable
- Redis reachable
- App `/health` returns healthy queue/db/redis
- Workers started with API process

## 4) Configure Telegram webhook

Webhook URL must be public HTTPS:

- `https://<your-domain>/webhook/telegram`

Set webhook from your backend dev helper (development only):

- `POST /dev/telegram/set-webhook`
- Body:
  - `{"url":"https://<your-domain>/webhook/telegram","secretToken":"<same-secret>"}`

Or via Telegram API directly:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d "{\"url\":\"https://<your-domain>/webhook/telegram\",\"secret_token\":\"<TELEGRAM_WEBHOOK_SECRET>\"}"
```

## 5) Smoke test flow

1. Send message to bot from Telegram.
2. Confirm backend logs `Telegram webhook processed`.
3. Confirm message row inserted in `messages`.
4. Confirm ingest queue processed and risk pipeline still works.
5. Trigger 14-day report and verify outbound Telegram message received.

## 6) Recruiter demo script

1. Show `/health`.
2. Show inbound Telegram message ingestion.
3. Show delayed response risk detection.
4. Show generated report + outbound Telegram delivery.
5. Explain provider switch (`MESSAGING_PROVIDER=whatsapp|telegram`) for channel-agnostic architecture.
