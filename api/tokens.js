import { getDb, getPriceChanges, enrichWithChanges } from './_db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'GET only' })
  }

  const sql = getDb()

  const {
    sort = 'market_cap',
    order = 'desc',
    limit = '50',
    offset = '0',
    search = '',
    status = 'all',
  } = req.query

  const allowedSorts = ['market_cap', 'price', 'volume_24h', 'price_change_24h', 'created_at', 'holder_count', 'liquidity']
  const sortCol = allowedSorts.includes(sort) ? sort : 'market_cap'
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  const lim = Math.min(parseInt(limit) || 50, 100)
  const off = parseInt(offset) || 0

  try {
    // Build a shared WHERE clause so the page query and the count query stay in sync.
    const conditions = []
    const whereParams = []
    if (search) {
      whereParams.push(`%${search.toLowerCase()}%`)
      conditions.push(`(LOWER(name) LIKE $${whereParams.length} OR LOWER(symbol) LIKE $${whereParams.length})`)
    }
    if (status !== 'all') {
      whereParams.push(status !== 'not_migrated')
      conditions.push(`is_migrated = $${whereParams.length}`)
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const query = `SELECT * FROM tokens ${where} ORDER BY ${sortCol} ${sortOrder} LIMIT $${whereParams.length + 1} OFFSET $${whereParams.length + 2}`
    const params = [...whereParams, lim, off]

    const rows = await sql.query(query, params)
    const countResult = await sql.query(`SELECT COUNT(*) as total FROM tokens ${where}`, whereParams)

    const mints = rows.map(r => r.mint)
    const histPrices = await getPriceChanges(sql, mints)
    const enriched = rows.map(t => enrichWithChanges(t, histPrices))

    return res.status(200).json({
      tokens: enriched,
      total: parseInt(countResult[0].total),
    })
  } catch (error) {
    console.error('Tokens fetch error:', error)
    return res.status(500).json({ error: error.message })
  }
}
