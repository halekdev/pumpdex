<div align="center">

# 🦉 PumpDex

### The DexScreener killer, built for PumpFun degens.

**Every PumpFun token. Real-time. Zero cost. One Telegram command away.**

[![Solana](https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Telegram Bot](https://img.shields.io/badge/Telegram_Bot-229ED9?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/pumpdextek_bot)

[**🚀 Launch App**](https://pumpdex.io) · [**🤖 Open the Bot**](https://t.me/pumpdextek_bot) · [**🗺️ Roadmap**](#-roadmap)

</div>

---

## ⚡ Why PumpDex

The old way costs **$299** just to update a token logo. That's a tax on builders. **PumpDex tears it down.**

We give every creator and trader an institutional-grade terminal for the entire PumpFun ecosystem — live prices, market caps, holder maps, real-time transactions, and a Telegram bot that never sleeps — **for free.**

> 💸 **$0 token updates** — keep the $299. <br>
> ⚡ **Real-time everything** — prices, volume, holders, txns, the second they happen. <br>
> 🤖 **A bot that actually does the work** — scan, track, and get alerted without leaving Telegram. <br>
> 🦉 **Built for the culture** — fast, clean, and relentlessly degen-friendly.

---

## 🔥 Features

| | |
|---|---|
| 📊 **Live PumpFun Scanner** | Every coin, real-time. Price, mcap, volume, liquidity, holders, and 5m/1h/6h/24h moves — all in one buttery-fast dashboard. |
| 💸 **Free Token Updates** | Logo, description, socials, links — updated free, verified on-chain by the creator wallet. No gatekeepers, no fees. |
| 🤖 **Telegram Bot** | Scan any token, see what's trending, and get price & migration alerts straight to your DMs, 24/7. |
| 🔔 **Smart Alerts** | Subscribe to any token and get pinged the moment it pumps ±20% or migrates to Raydium. |
| 📈 **Pro Charts** | Birdeye-powered candles, holder breakdowns, and live transaction feeds via WebSocket. |
| 🧩 **Wallet-Verified** | Solana wallet auth so only the real creator can edit a token. |

---

## 🤖 The Telegram Bot — [@pumpdextek_bot](https://t.me/pumpdextek_bot)

Your real-time token scout, living right inside Telegram. A fully working webhook bot — not a mockup.

```
/scan <mint>     → live price, mcap, volume, holders + quick-action buttons
/trending        → the hottest coins on PumpFun right now
/top             → biggest tokens by market cap
/alert <mint>    → get pinged on ±20% moves or migration
/alerts          → manage your watchlist
```

💡 **Pro move:** just paste a mint address — the bot scans it instantly.

Powered by [`api/telegram.js`](api/telegram.js) (webhook) and [`api/cron/alerts.js`](api/cron/alerts.js) (the alert engine that watches your tokens around the clock).

---

## 🛠️ Tech Stack

Lean, modern, and fast as hell.

- **Frontend:** React 19 · Vite · `lightweight-charts` · Solana Wallet Adapter
- **API:** Vercel serverless functions (`/api`)
- **Database:** Neon Postgres (`@neondatabase/serverless`)
- **Data feeds:** Pump.fun · Helius RPC · Jupiter · DexScreener
- **Bot:** Telegram Bot API webhook + cron-driven alert engine

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Configure (see .env.example for the full list)
cp .env.example .env
#   DATABASE_URL  · HELIUS_KEY (+ FALLBACK) · CRON_SECRET
#   TELEGRAM_BOT_TOKEN · TELEGRAM_WEBHOOK_SECRET · SITE_URL

# 3. Bootstrap the database
npm run setup

# 4. Run it
npm run dev:full        # frontend + local API together
```

| Command | What it does |
|---|---|
| `npm run dev` | Vite frontend only |
| `npm run dev:api` | Local Express mirror of the serverless API |
| `npm run dev:full` | Both, together |
| `npm run build` | Production build |
| `npm run setup` | Full DB bootstrap (schema + initial token import) |
| `npm run bot:setup` | Register the Telegram webhook + command menu |
| `npm run lint` | ESLint |

---

## 🌐 Deploy in Minutes

Ships to **Vercel** out of the box.

1. Import the repo into Vercel.
2. Set the env vars: `DATABASE_URL`, `HELIUS_KEY`, `HELIUS_KEY_FALLBACK`, `CRON_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `SITE_URL`.
3. Seed the database — fire the migrate + sync endpoints once:
   ```bash
   curl -X POST https://your-app/api/migrate -H "Authorization: Bearer $CRON_SECRET"
   curl -X POST "https://your-app/api/sync?pages=3" -H "Authorization: Bearer $CRON_SECRET"
   ```
4. Wake the bot:
   ```bash
   npm run bot:setup -- https://your-app.vercel.app
   ```

Crons in [`vercel.json`](vercel.json) keep prices and alerts fresh every 5 minutes — automatically.

---

## 🔒 Built Right

- 🛡️ **Privileged endpoints locked down** — `/migrate`, `/sync`, and crons require `CRON_SECRET` (Bearer header or `?secret=`).
- ✅ **Bot webhook verified** — every call is checked against Telegram's secret-token header.
- ⚡ **Batched DB writes & bounded queries** — engineered to fly on serverless without timing out.

---

## 🗺️ Roadmap

| Phase | Status | What's coming |
|---|---|---|
| **1 — Launch** | 🟢 Live | PumpFun scanner · free token updates · Telegram bot · alerts |
| **2 — Scale** | 🔜 Next | Multi-chain · advanced analytics · portfolio tracking · public API |
| **3 — Dominate** | 🔮 Soon | Full DEX aggregation · in-app trading · mobile app · governance |

---

<div align="center">

### Removing the $299 barrier. Giving power back to every token creator.

**[🚀 Launch PumpDex](https://pumpdex.io) · [🤖 Try the Bot](https://t.me/pumpdextek_bot)**

*Built for the culture. 🦉*

</div>
