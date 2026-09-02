# Production deployment

Revora consists of three production services:

- **Vercel** hosts the Next.js web application.
- **Render Web Service** hosts the Express API and BullMQ workers.
- **Render PostgreSQL and Key Value** store application data and process background jobs.

`render.yaml` provisions the API, PostgreSQL, and queue. It uses generated secrets for JWT signing, internal database and queue connections, a health check, and production-only webhook protections.

## Required credentials

The Render deployment prompts for these WhatsApp Cloud API secrets:

- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WEBHOOK_VERIFY_TOKEN`
- `WEBHOOK_APP_SECRET`

After Render assigns the API URL, add both variables to the Vercel project’s **Production** environment and redeploy the frontend:

```text
REVORA_BACKEND_URL=https://<your-api>.onrender.com
NEXT_PUBLIC_REVORA_API_URL=https://<your-api>.onrender.com
```

Then configure the Meta webhook endpoints:

```text
GET/POST https://<your-api>.onrender.com/webhook/whatsapp
```

The API rejects unsigned WhatsApp webhooks in production. The free Render plans are suitable for an initial launch but can sleep and do not provide the uptime guarantees of paid production plans; upgrade the API, database, and queue plans before a customer-facing rollout.
