import { getDb } from '../_db.js'
import { requireAuth } from '../_auth.js'
import { sendMessage, esc } from '../_telegram.js'
import { fetchTokenStats, fmtPrice, fmtPct } from '../_tokendata.js'

export const config = {
  schedule: '*/5 * * * *',
}

const THRESHOLD = 0.20 // ±20% from the last notified baseline

const SITE_URL = (process.env.SITE_URL || 'https://pumpdex.io').replace(/\/$/, '')

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return

  const sql = getDb()
  try {
    const subs = await sql`SELECT * FROM bot_alerts`
    if (!subs.length) return res.status(200).json({ checked: 0, sent: 0 })

    // Fetch each unique mint once, even if multiple chats subscribe to it.
    const mints = [...new Set(subs.map(s => s.mint))]
    const statsByMint = {}
    for (const mint of mints) {
      statsByMint[mint] = await fetchTokenStats(mint)
    }

    let sent = 0
    for (const sub of subs) {
      const st = statsByMint[sub.mint]
      if (!st || !st.price) continue

      const base = parseFloat(sub.base_price) || 0
      const migratedNow = st.is_migrated && !sub.was_migrated
      const pctMove = base > 0 ? (st.price - base) / base : 0
      const bigMove = Math.abs(pctMove) >= THRESHOLD

      if (!migratedNow && !bigMove) continue

      const header = migratedNow
        ? `🎉 <b>$${esc(st.symbol)} migrated to Raydium!</b>`
        : pctMove > 0
          ? `🟢 <b>$${esc(st.symbol)} is up ${fmtPct(pctMove * 100)}</b>`
          : `🔴 <b>$${esc(st.symbol)} is down ${fmtPct(pctMove * 100)}</b>`

      const msg = [
        header,
        '',
        `💵 Price: <b>${fmtPrice(st.price)}</b>`,
        base > 0 ? `↔️ Since last alert: ${fmtPrice(base)} → ${fmtPrice(st.price)}` : '',
      ].filter(Boolean).join('\n')

      await sendMessage(sub.chat_id, msg, {
        reply_markup: { inline_keyboard: [[{ text: '📊 View token', url: `${SITE_URL}/#token/${sub.mint}` }]] },
      })

      // Reset the baseline so the next alert measures from here.
      await sql`UPDATE bot_alerts SET base_price = ${st.price}, was_migrated = ${st.is_migrated} WHERE id = ${sub.id}`
      sent++
    }

    return res.status(200).json({ checked: subs.length, sent })
  } catch (error) {
    console.error('Alerts cron error:', error)
    return res.status(500).json({ error: error.message })
  }
}
