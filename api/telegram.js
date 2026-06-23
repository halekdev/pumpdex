import { getDb } from './_db.js'
import { sendMessage, esc } from './_telegram.js'
import {
  fetchTokenStats, fetchTrending, isValidMint,
  fmtPrice, fmtCompact, fmtPct,
} from './_tokendata.js'

const SITE_URL = (process.env.SITE_URL || 'https://pumpdex.io').replace(/\/$/, '')
const ALERT_THRESHOLD = 0.20 // 20% move triggers an alert

function tokenPageUrl(mint) {
  return `${SITE_URL}/#token/${mint}`
}

const WELCOME = [
  '👋 <b>Welcome to PumpDex Bot!</b>',
  '',
  'Your real-time scout for PumpFun &amp; Solana tokens — right inside Telegram.',
  '',
  '<b>What I can do:</b>',
  '🔍 <b>Scan any token</b> — send a mint address or <code>/scan &lt;mint&gt;</code> for live price, market cap, volume &amp; holders',
  '🔥 <b>Trending</b> — <code>/trending</code> for the hottest coins right now',
  '🏆 <b>Top</b> — <code>/top</code> for the biggest by market cap',
  '🔔 <b>Alerts</b> — <code>/alert &lt;mint&gt;</code> and I\'ll ping you on ±20% moves or migration',
  '',
  'Tip: just paste a token mint and I\'ll handle the rest.',
  '',
  'Type /help anytime to see every command.',
].join('\n')

const HELP = [
  '<b>PumpDex Bot — Commands</b>',
  '',
  '🔍 <code>/scan &lt;mint&gt;</code> — live stats for a token (or just paste a mint)',
  '🔥 <code>/trending</code> — hottest tokens by recent activity',
  '🏆 <code>/top</code> — top tokens by market cap',
  '🔔 <code>/alert &lt;mint&gt;</code> — get pinged on ±20% moves or migration',
  '📋 <code>/alerts</code> — list your active alerts',
  '🔕 <code>/unalert &lt;mint&gt;</code> — stop alerts for a token',
  '❓ <code>/help</code> — show this message',
].join('\n')

function tokenCard(t) {
  const status = t.is_migrated ? '✅ Migrated (Raydium)' : '🔄 Bonding curve'
  const lines = [
    `<b>${esc(t.name)}</b> ($${esc(t.symbol)})`,
    '',
    `💵 Price: <b>${fmtPrice(t.price)}</b>`,
    `📊 Market Cap: <b>${fmtCompact(t.market_cap)}</b>`,
  ]
  if (t.volume_24h) lines.push(`📈 24h Volume: <b>${fmtCompact(t.volume_24h)}</b>`)
  if (t.liquidity) lines.push(`💧 Liquidity: <b>${fmtCompact(t.liquidity)}</b>`)
  if (t.change_5m || t.change_1h || t.change_6h || t.change_24h) {
    lines.push('')
    lines.push(`⏱ 5m ${fmtPct(t.change_5m)} · 1h ${fmtPct(t.change_1h)} · 6h ${fmtPct(t.change_6h)} · 24h ${fmtPct(t.change_24h)}`)
  }
  lines.push('')
  lines.push(status)
  lines.push(`<code>${esc(t.mint)}</code>`)
  return lines.join('\n')
}

function tokenButtons(mint) {
  return {
    inline_keyboard: [[
      { text: '📊 Open in PumpDex', url: tokenPageUrl(mint) },
      { text: '🚀 Pump.fun', url: `https://pump.fun/${mint}` },
    ], [
      { text: '🔔 Set alert', callback_data: `alert:${mint}` },
      { text: '💱 Trade', url: `https://jup.ag/swap/SOL-${mint}` },
    ]],
  }
}

async function handleScan(chatId, mint) {
  await sendMessage(chatId, '🔍 Scanning…')
  const t = await fetchTokenStats(mint)
  if (!t) {
    return sendMessage(chatId, '❌ Couldn\'t find that token. Double-check the mint address.')
  }
  return sendMessage(chatId, tokenCard(t), { reply_markup: tokenButtons(mint) })
}

async function handleList(chatId, sort, title) {
  const tokens = await fetchTrending(10, sort)
  if (!tokens.length) {
    return sendMessage(chatId, '⚠️ Couldn\'t load tokens right now. Try again shortly.')
  }
  const lines = [`<b>${title}</b>`, '']
  tokens.forEach((t, i) => {
    lines.push(`${i + 1}. <b>${esc(t.symbol)}</b> — ${fmtCompact(t.market_cap)}  <a href="${tokenPageUrl(t.mint)}">view</a>`)
  })
  lines.push('')
  lines.push('Send a mint or <code>/scan &lt;mint&gt;</code> for full stats.')
  return sendMessage(chatId, lines.join('\n'))
}

async function handleAlert(sql, chatId, mint) {
  const t = await fetchTokenStats(mint)
  if (!t) return sendMessage(chatId, '❌ Couldn\'t find that token, so I can\'t set an alert.')
  await sql`
    INSERT INTO bot_alerts (chat_id, mint, symbol, base_price, was_migrated)
    VALUES (${chatId}, ${mint}, ${t.symbol}, ${t.price || 0}, ${t.is_migrated})
    ON CONFLICT (chat_id, mint) DO UPDATE SET
      symbol = EXCLUDED.symbol, base_price = EXCLUDED.base_price, was_migrated = EXCLUDED.was_migrated
  `
  return sendMessage(
    chatId,
    `🔔 Alert set for <b>$${esc(t.symbol)}</b> at ${fmtPrice(t.price)}.\nI'll ping you on a ±20% move or when it migrates.`,
    { reply_markup: { inline_keyboard: [[{ text: '📊 View token', url: tokenPageUrl(mint) }]] } }
  )
}

async function handleAlerts(sql, chatId) {
  const rows = await sql`SELECT mint, symbol FROM bot_alerts WHERE chat_id = ${chatId} ORDER BY created_at DESC`
  if (!rows.length) {
    return sendMessage(chatId, 'You have no active alerts.\nUse <code>/alert &lt;mint&gt;</code> to add one.')
  }
  const lines = ['<b>🔔 Your alerts</b>', '']
  for (const r of rows) {
    lines.push(`• <b>$${esc(r.symbol || '?')}</b> — <code>${esc(r.mint)}</code>`)
  }
  lines.push('')
  lines.push('Remove one with <code>/unalert &lt;mint&gt;</code>.')
  return sendMessage(chatId, lines.join('\n'))
}

async function handleUnalert(sql, chatId, mint) {
  const rows = await sql`DELETE FROM bot_alerts WHERE chat_id = ${chatId} AND mint = ${mint} RETURNING mint`
  if (!rows.length) return sendMessage(chatId, 'No alert found for that token.')
  return sendMessage(chatId, '🔕 Alert removed.')
}

async function handleMessage(sql, message) {
  const chatId = message.chat?.id
  const text = (message.text || '').trim()
  if (!chatId || !text) return

  // Slash commands (strip optional @BotName suffix in groups)
  if (text.startsWith('/')) {
    const [rawCmd, ...rest] = text.split(/\s+/)
    const cmd = rawCmd.slice(1).split('@')[0].toLowerCase()
    const arg = rest.join(' ').trim()

    switch (cmd) {
      case 'start':
        return sendMessage(chatId, WELCOME, {
          reply_markup: { inline_keyboard: [[{ text: '🔥 Trending now', callback_data: 'trending' }]] },
        })
      case 'help':
        return sendMessage(chatId, HELP)
      case 'scan':
      case 'token':
        if (!isValidMint(arg)) return sendMessage(chatId, 'Usage: <code>/scan &lt;mint&gt;</code>')
        return handleScan(chatId, arg.trim())
      case 'trending':
        return handleList(chatId, 'last_trade_timestamp', '🔥 Trending tokens')
      case 'top':
        return handleList(chatId, 'market_cap', '🏆 Top tokens by market cap')
      case 'alert':
        if (!isValidMint(arg)) return sendMessage(chatId, 'Usage: <code>/alert &lt;mint&gt;</code>')
        return handleAlert(sql, chatId, arg.trim())
      case 'alerts':
        return handleAlerts(sql, chatId)
      case 'unalert':
        if (!isValidMint(arg)) return sendMessage(chatId, 'Usage: <code>/unalert &lt;mint&gt;</code>')
        return handleUnalert(sql, chatId, arg.trim())
      default:
        return sendMessage(chatId, 'Unknown command. Type /help to see what I can do.')
    }
  }

  // Bare mint address → scan
  if (isValidMint(text)) return handleScan(chatId, text)

  // Anything else
  return sendMessage(chatId, 'Send me a token mint to scan it, or type /help.')
}

async function handleCallback(sql, cb) {
  const chatId = cb.message?.chat?.id
  const data = cb.data || ''
  if (chatId) {
    if (data === 'trending') await handleList(chatId, 'last_trade_timestamp', '🔥 Trending tokens')
    else if (data.startsWith('alert:')) await handleAlert(sql, chatId, data.slice(6))
  }
  // Acknowledge so Telegram clears the loading state
  const { tgApi } = await import('./_telegram.js')
  await tgApi('answerCallbackQuery', { callback_query_id: cb.id })
}

export default async function handler(req, res) {
  // Reject anything that isn't a genuine Telegram webhook delivery.
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && req.headers['x-telegram-bot-api-secret-token'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (req.method !== 'POST') {
    return res.status(200).json({ ok: true, info: 'PumpDex Telegram webhook' })
  }

  const update = req.body || {}
  try {
    const sql = getDb()
    if (update.message) await handleMessage(sql, update.message)
    else if (update.callback_query) await handleCallback(sql, update.callback_query)
  } catch (e) {
    console.error('Telegram webhook error:', e)
  }
  // Always 200 — otherwise Telegram retries the same update repeatedly.
  return res.status(200).json({ ok: true })
}
