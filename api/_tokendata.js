// Shared token-data helpers used by the Telegram bot and alert cron.
// Reuses the same public sources the web app relies on: Pump.fun v3 + DexScreener.

const PUMPFUN_V3 = 'https://frontend-api-v3.pump.fun'
const DEXSCREENER = 'https://api.dexscreener.com/tokens/v1/solana'

// Solana base58 mint addresses are 32-44 chars from the base58 alphabet.
export function isValidMint(s) {
  return typeof s === 'string' && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim())
}

export async function fetchTokenStats(mint) {
  let base = null

  // Pump.fun: name / symbol / market cap / migration status
  try {
    const r = await fetch(`${PUMPFUN_V3}/coins/${mint}`)
    if (r.ok) {
      const pf = await r.json()
      if (pf && pf.name) {
        const totalSupply = (pf.total_supply || 1e15) / 1e6
        const usdMcap = pf.usd_market_cap || 0
        base = {
          mint,
          name: pf.name,
          symbol: pf.symbol || '???',
          image_uri: pf.image_uri || null,
          price: usdMcap > 0 ? usdMcap / totalSupply : 0,
          market_cap: usdMcap,
          is_migrated: pf.complete === true,
          volume_24h: 0,
          liquidity: 0,
          change_5m: 0, change_1h: 0, change_6h: 0, change_24h: 0,
          created_at: pf.created_timestamp ? new Date(pf.created_timestamp).toISOString() : null,
        }
      }
    }
  } catch {}

  // DexScreener: live price, volume, liquidity, price changes (also a fallback)
  try {
    const r = await fetch(`${DEXSCREENER}/${mint}`)
    if (r.ok) {
      const pairs = await r.json()
      let best = null
      for (const p of (pairs || [])) {
        if (p.baseToken?.address !== mint) continue
        if (!best || (p.liquidity?.usd || 0) > (best.liquidity?.usd || 0)) best = p
      }
      if (best) {
        if (!base) {
          base = {
            mint,
            name: best.baseToken?.name || 'Unknown',
            symbol: best.baseToken?.symbol || '???',
            image_uri: best.info?.imageUrl || null,
            is_migrated: true,
            created_at: null,
          }
        }
        base.price = parseFloat(best.priceUsd) || base.price || 0
        base.market_cap = best.marketCap || base.market_cap || 0
        base.volume_24h = best.volume?.h24 || 0
        base.liquidity = best.liquidity?.usd || 0
        base.change_5m = best.priceChange?.m5 ?? 0
        base.change_1h = best.priceChange?.h1 ?? 0
        base.change_6h = best.priceChange?.h6 ?? 0
        base.change_24h = best.priceChange?.h24 ?? 0
      }
    }
  } catch {}

  return base
}

export async function fetchTrending(limit = 10, sort = 'last_trade_timestamp') {
  try {
    const lim = Math.min(parseInt(limit) || 10, 50)
    const url = `${PUMPFUN_V3}/coins?offset=0&limit=${lim}&sort=${sort}&order=DESC&includeNsfw=false`
    const r = await fetch(url)
    if (!r.ok) return []
    const coins = await r.json()
    return (coins || []).map(pf => {
      const totalSupply = (pf.total_supply || 1e15) / 1e6
      const usdMcap = pf.usd_market_cap || 0
      return {
        mint: pf.mint,
        name: pf.name || 'Unknown',
        symbol: pf.symbol || '???',
        price: usdMcap > 0 ? usdMcap / totalSupply : 0,
        market_cap: usdMcap,
        is_migrated: pf.complete === true,
      }
    })
  } catch {
    return []
  }
}

// ---- formatting ----

export function fmtPrice(price) {
  const n = parseFloat(price)
  if (!n || n === 0) return '$0.00'
  if (n < 0.000001) return `$${n.toExponential(2)}`
  if (n < 0.001) return `$${n.toFixed(6)}`
  if (n < 1) return `$${n.toFixed(4)}`
  if (n < 1000) return `$${n.toFixed(2)}`
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

export function fmtCompact(val) {
  const n = parseFloat(val)
  if (!n || n === 0) return '-'
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

export function fmtPct(val) {
  const n = parseFloat(val) || 0
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(2)}%`
}
