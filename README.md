# PumpDex

A real-time dashboard for Pump.fun / Solana tokens — live prices, market caps,
holders, transactions, and per-timeframe price changes. Built with Vite + React
on the frontend and Vercel serverless functions backed by Neon Postgres.

## Stack

- **Frontend:** React 19, Vite, `lightweight-charts`, Solana wallet adapter
- **API:** Vercel serverless functions (`/api`)
- **DB:** Neon Postgres (`@neondatabase/serverless`)
- **Data sources:** Pump.fun API, Helius RPC, Jupiter price API, DexScreener

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill in your values:
   ```bash
   cp .env.example .env
   ```
   See [`.env.example`](.env.example) for the full list. Required:
   - `DATABASE_URL` — Neon Postgres connection string
   - `HELIUS_KEY` (+ optional `HELIUS_KEY_FALLBACK`) — Helius RPC keys
   - `CRON_SECRET` — protects the privileged/cron endpoints (see below)
3. Create the database schema:
   ```bash
   npm run setup
   ```

## Development

```bash
npm run dev        # Vite frontend only (proxies /api in prod)
npm run dev:api    # local Express mirror of the serverless API
npm run dev:full   # both together
```

The frontend talks to `/api/*`. In production those are the Vercel functions in
[`api/`](api/); locally `scripts/dev-api.mjs` reimplements them against the same DB.

## Data pipeline

- `POST /api/migrate` — create tables/indexes (idempotent). **Auth required.**
- `POST /api/sync` — pull top tokens from Pump.fun + Jupiter prices and upsert
  them. **Auth required.**
- `GET  /api/cron/snapshot` — snapshots prices into `price_history` every 5 min.
  Scheduled via [`vercel.json`](vercel.json); Vercel sends the cron auth header.
- `GET  /api/tokens`, `/api/tokens/live`, `/api/token/[mint]`, `/holders`,
  `/transactions`, `/history` — read endpoints consumed by the UI.

### Authorization

`/api/migrate`, `/api/sync`, and `/api/cron/snapshot` require the `CRON_SECRET`.
Pass it as `Authorization: Bearer $CRON_SECRET` (Vercel cron does this
automatically) or `?secret=$CRON_SECRET`. If `CRON_SECRET` is unset, the
endpoints stay open in development but fail closed in production.

```bash
curl -X POST https://your-app/api/migrate -H "Authorization: Bearer $CRON_SECRET"
curl -X POST "https://your-app/api/sync?pages=3" -H "Authorization: Bearer $CRON_SECRET"
```

## Deploy

Deploys to Vercel as-is. Set `DATABASE_URL`, `HELIUS_KEY`, `HELIUS_KEY_FALLBACK`,
and `CRON_SECRET` in the Vercel project environment variables, then run the
migrate + sync endpoints once to seed the database.

## Scripts

- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run setup` — full DB bootstrap (migrate + initial token import)
