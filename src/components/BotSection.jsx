import { useState } from 'react'
import { useInView } from '../hooks/useInView'
import { TELEGRAM_BOT_URL, TELEGRAM_BOT_USERNAME } from '../botConfig'
import './BotSection.css'

// Each demo is a short Telegram exchange: the user's message + the bot's reply.
const demos = [
  {
    label: 'Scan Token',
    user: '/scan 7xKq...pump',
    bot: {
      title: '$PEPE (Pepe)',
      rows: [
        '💵 Price: $0.0042',
        '📊 Market Cap: $4.2M',
        '📈 24h Volume: $1.8M',
        '💧 Liquidity: $320K',
        '⏱ 5m +2.1% · 1h +8.4% · 24h +51.2%',
        '✅ Migrated (Raydium)',
      ],
    },
  },
  {
    label: 'Trending',
    user: '/trending',
    bot: {
      title: '🔥 Trending tokens',
      rows: [
        '1. $PEPE — $4.2M',
        '2. $WIF — $2.9M',
        '3. $BONK — $1.7M',
        '4. $MOON — $980K',
        'Send a mint for full stats →',
      ],
    },
  },
  {
    label: 'Set Alert',
    user: '/alert 7xKq...pump',
    bot: {
      title: '🔔 Alert set for $PEPE',
      rows: [
        "I'll ping you on a ±20% move",
        'or the moment it migrates.',
        'Running 24/7 — no setup needed.',
      ],
    },
  },
]

const liveCaps = [
  'Instant token scans — price, mcap, volume, holders',
  'Live trending & top coins on demand',
  'Price & migration alerts, pushed to your DMs',
]

const soonCaps = [
  'Create & manage communities',
  'Auto-generate banners for migrating coins',
  '24/7 AI moderation',
]

function TelegramIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.94 4.6 18.9 19.2c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.94.46l.34-4.78L18.6 6.6c.38-.34-.08-.53-.59-.19L7.26 13.3l-4.66-1.46c-1.01-.32-1.03-1.01.21-1.5l18.22-7.02c.84-.31 1.58.2 1.31 1.28Z" />
    </svg>
  )
}

export default function BotSection() {
  const [ref, inView] = useInView()
  const [active, setActive] = useState(0)
  const [switching, setSwitching] = useState(false)

  const handleSwitch = (i) => {
    if (i === active) return
    setSwitching(true)
    setTimeout(() => {
      setActive(i)
      setSwitching(false)
    }, 220)
  }

  const demo = demos[active]

  return (
    <section id="bot" className="bot" ref={ref}>
      <div className="bot__inner">
        <div className="bot__content">
          <div className={`bot__text ${inView ? 'bot__text--visible' : ''}`}>
            <span className="section-label">PumpDex Telegram Bot</span>
            <h2 className="section-title">Your Token Scout,<br /><span className="text-accent">Right in Telegram.</span></h2>
            <p className="section-sub">
              Scan any PumpFun token, watch what&apos;s trending, and get pinged the second
              a coin pumps or migrates — all without leaving your chat.
            </p>

            <div className="bot__capabilities">
              {liveCaps.map((cap, i) => (
                <div className="bot__cap" key={i}>
                  <div className="bot__cap-icon bot__cap-icon--green">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                  </div>
                  <span>{cap}</span>
                </div>
              ))}
              {soonCaps.map((cap, i) => (
                <div className="bot__cap bot__cap--soon" key={i}>
                  <div className="bot__cap-icon bot__cap-icon--soon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                  </div>
                  <span>{cap}</span>
                  <span className="bot__soon-tag">Soon</span>
                </div>
              ))}
            </div>

            <a className="bot__cta" href={TELEGRAM_BOT_URL} target="_blank" rel="noopener noreferrer">
              <TelegramIcon size={20} />
              Open in Telegram
            </a>
          </div>

          <div className={`bot__demo ${inView ? 'bot__demo--visible' : ''}`}>
            <div className="bot__demo-tabs">
              {demos.map((d, i) => (
                <button
                  key={i}
                  className={`bot__demo-tab ${active === i ? 'bot__demo-tab--active' : ''}`}
                  onClick={() => handleSwitch(i)}
                >
                  {d.label}
                </button>
              ))}
            </div>

            <div className="bot__chat">
              <div className="bot__chat-header">
                <div className="bot__chat-avatar"><TelegramIcon size={18} /></div>
                <div className="bot__chat-meta">
                  <span className="bot__chat-name">PumpDex Bot</span>
                  <span className="bot__chat-handle">@{TELEGRAM_BOT_USERNAME}</span>
                </div>
                <div className="bot__chat-status">
                  <span className="bot__chat-status-dot" />
                  online
                </div>
              </div>

              <div className={`bot__chat-body ${switching ? 'bot__chat-body--switching' : ''}`}>
                <div className="bot__msg bot__msg--user">
                  <span className="bot__msg-bubble">{demo.user}</span>
                </div>
                <div className="bot__msg bot__msg--bot">
                  <div className="bot__msg-bubble bot__msg-bubble--bot">
                    <span className="bot__msg-title">{demo.bot.title}</span>
                    {demo.bot.rows.map((row, i) => (
                      <span
                        key={i}
                        className="bot__msg-row"
                        style={{ animationDelay: `${0.08 + i * 0.07}s` }}
                      >
                        {row}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bot__chat-input">
                <span className="bot__chat-input-text">Message PumpDex Bot…</span>
                <span className="bot__chat-send"><TelegramIcon size={16} /></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
