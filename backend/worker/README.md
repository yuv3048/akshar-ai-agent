# Akshar AI Worker API

This directory is the first step of the migration to a **single Cloudflare Worker API**. Existing services remain in place while routes and dependencies are migrated and tested incrementally.

## Stack

- Hono + TypeScript on Cloudflare Workers
- MongoDB Atlas (connection approach must be validated in the Workers runtime before migrating models)
- Upstash Redis REST API for session, cache, and memory operations
- Cloudflare R2 via the `AKSHAR_FILES` binding
- Existing frontend will be migrated to TypeScript separately

## Local setup

From this directory:

```bash
npm install
npm run dev
npm run typecheck
```

The health endpoint is available at `GET /health`.

## Secrets

Set secrets with Wrangler; do not commit credentials:

```bash
npx wrangler secret put MONGODB_URI
npx wrangler secret put UPSTASH_REDIS_REST_URL
npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
```

Create the R2 bucket named `akshar-files` before deployment, or change the bucket name in `wrangler.jsonc` to match your Cloudflare account.

## Migration safety

- Keep the current backend and frontend untouched until their replacements are tested.
- Do not deploy until environment bindings, auth, CORS, data ownership checks, and provider SDK compatibility have been verified.
- Never commit Firebase service-account JSON, database credentials, model API keys, or Redis tokens.
