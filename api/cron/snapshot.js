import { getDb } from '../_db.js'
import { requireAuth } from '../_auth.js'

export const config = {
  schedule: '*/5 * * * *',
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return

  const sql = getDb()

  try {
    // Get all tokens with non-zero market cap
    const tokens = await sql`
      SELECT mint, price, market_cap, volume_24h FROM tokens
      WHERE market_cap > 0
      ORDER BY market_cap DESC
      LIMIT 500
    `

    if (tokens.length === 0) {
      return res.status(200).json({ snapshots: 0, message: 'No tokens to snapshot' })
    }

    // Batch fetch fresh prices from Jupiter
    const mints = tokens.map(t => t.mint)
    const priceMap = {}

    for (let i = 0; i < mints.length; i += 100) {
      const batch = mints.slice(i, i + 100)
      try {
        const priceRes = await fetch(`https://api.jup.ag/price/v2?ids=${batch.join(',')}`, {
          headers: { 'Accept': 'application/json' },
        })
        if (priceRes.ok) {
          const data = await priceRes.json()
          for (const [mint, info] of Object.entries(data.data || {})) {
            priceMap[mint] = parseFloat(info.price) || 0
          }
        }
      } catch {}
    }

    // Build the rows to snapshot, then write them in two batched statements
    // instead of 2 round-trips per token.
    const rows = []
    for (const token of tokens) {
      const freshPrice = priceMap[token.mint] || parseFloat(token.price) || 0
      if (freshPrice === 0) continue
      rows.push({
        mint: token.mint,
        price: freshPrice,
        market_cap: token.market_cap,
        volume: token.volume_24h || 0,
        hasFresh: !!priceMap[token.mint],
      })
    }

    let count = 0
    if (rows.length) {
      // Batch INSERT all snapshots in one statement.
      const insVals = []
      const insParams = []
      let p = 1
      for (const r of rows) {
        insVals.push(`($${p++}, $${p++}, $${p++}, $${p++}, NOW())`)
        insParams.push(r.mint, r.price, r.market_cap, r.volume)
      }
      await sql.query(
        `INSERT INTO price_history (mint, price, market_cap, volume, timestamp) VALUES ${insVals.join(',')}`,
        insParams
      )

      // Batch UPDATE current prices for tokens that got a fresh Jupiter price.
      const fresh = rows.filter(r => r.hasFresh)
      if (fresh.length) {
        const updVals = []
        const updParams = []
        let q = 1
        for (const r of fresh) {
          updVals.push(`($${q++}, $${q++}::numeric)`)
          updParams.push(r.mint, r.price)
        }
        await sql.query(
          `UPDATE tokens SET price = v.price, updated_at = NOW()
           FROM (VALUES ${updVals.join(',')}) AS v(mint, price)
           WHERE tokens.mint = v.mint`,
          updParams
        )
      }
      count = rows.length
    }

    // Clean up old snapshots (keep 7 days)
    await sql`
      DELETE FROM price_history WHERE timestamp < NOW() - INTERVAL '7 days'
    `

    return res.status(200).json({ snapshots: count, total_tokens: tokens.length })
  } catch (error) {
    console.error('Snapshot error:', error)
    return res.status(500).json({ error: error.message })
  }
}
