import 'dotenv/config'

// Registers the Telegram webhook + command menu for the PumpDex bot.
//
// Usage:
//   node scripts/telegram-setup.mjs                 (uses PUBLIC_URL / SITE_URL from env)
//   node scripts/telegram-setup.mjs https://my-app.vercel.app
//
// Requires TELEGRAM_BOT_TOKEN (and ideally TELEGRAM_WEBHOOK_SECRET) in the env.

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  console.error('Missing TELEGRAM_BOT_TOKEN in environment.')
  process.exit(1)
}

const base = (process.argv[2] || process.env.PUBLIC_URL || process.env.SITE_URL || '').replace(/\/$/, '')
if (!base) {
  console.error('No public URL. Pass it as an argument or set PUBLIC_URL / SITE_URL.')
  process.exit(1)
}

const secret = process.env.TELEGRAM_WEBHOOK_SECRET
const API = `https://api.telegram.org/bot${token}`

async function call(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}

const me = await call('getMe', {})
if (!me.ok) {
  console.error('getMe failed — is the token valid?', me.description)
  process.exit(1)
}
console.log(`Bot: @${me.result.username}`)

const webhookUrl = `${base}/api/telegram`
const hook = await call('setWebhook', {
  url: webhookUrl,
  ...(secret ? { secret_token: secret } : {}),
  allowed_updates: ['message', 'callback_query'],
  drop_pending_updates: true,
})
console.log(`setWebhook -> ${webhookUrl}:`, hook.ok ? 'OK' : hook.description)
if (!secret) console.warn('WARNING: TELEGRAM_WEBHOOK_SECRET not set — webhook is unauthenticated.')

const cmds = await call('setMyCommands', {
  commands: [
    { command: 'scan', description: 'Live stats for a token mint' },
    { command: 'trending', description: 'Hottest tokens right now' },
    { command: 'top', description: 'Top tokens by market cap' },
    { command: 'alert', description: 'Get alerts for a token (±20% / migration)' },
    { command: 'alerts', description: 'List your active alerts' },
    { command: 'unalert', description: 'Stop alerts for a token' },
    { command: 'help', description: 'Show all commands' },
  ],
})
console.log('setMyCommands:', cmds.ok ? 'OK' : cmds.description)

await call('setMyDescription', {
  description: 'Real-time PumpFun & Solana token scanner. Scan tokens, see trending coins, and get price & migration alerts.',
})
console.log('Done.')
