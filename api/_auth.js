// Shared auth for privileged endpoints (migrate, sync) and Vercel cron.
//
// Vercel automatically attaches `Authorization: Bearer ${CRON_SECRET}` to cron
// invocations when the CRON_SECRET env var is set. We reuse the same secret for
// the manual admin endpoints, also accepting it via `?secret=` for convenience.

export function isAuthorized(req) {
  const secret = process.env.CRON_SECRET
  // If no secret is configured, fail closed in production but stay open locally
  // so `npm run dev` keeps working without extra setup.
  if (!secret) return process.env.NODE_ENV !== 'production'

  const auth = req.headers?.authorization || ''
  if (auth === `Bearer ${secret}`) return true

  const qs = req.query?.secret
  if (qs && qs === secret) return true

  return false
}

export function requireAuth(req, res) {
  if (isAuthorized(req)) return true
  res.status(401).json({ error: 'Unauthorized' })
  return false
}
