// Thin wrapper around the Telegram Bot API.

const API = 'https://api.telegram.org'

export function tgToken() {
  return process.env.TELEGRAM_BOT_TOKEN
}

export async function tgApi(method, body) {
  const token = tgToken()
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not set')
  const r = await fetch(`${API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await r.json().catch(() => ({}))
  if (!data.ok) console.error(`Telegram ${method} failed:`, data.description || r.status)
  return data
}

export function sendMessage(chatId, text, extra = {}) {
  return tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra,
  })
}

// Escape user/content text for Telegram HTML parse mode.
export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
