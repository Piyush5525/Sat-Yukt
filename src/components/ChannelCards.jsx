import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { useReducedMotion } from '../lib/useReducedMotion'
import { useTheme } from '../context/ThemeContext'

// QR fgColor/bgColor render as literal SVG fill values, not CSS custom properties,
// so mirror the --green-deep / --bg-card pair from tokens.css per theme directly.
const QR_COLORS = {
  light: { fg: '#234E2E', bg: '#FFFFFF' },
  dark: { fg: '#A8D9B6', bg: '#1D2E22' },
}

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '911234567890'
const CALL_NUMBER = import.meta.env.VITE_CALL_NUMBER || '+91-XXXXXXXXXX'

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Sat-Yukt')}`

function formatWhatsAppDisplay(number) {
  const digits = number.replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  return `+${digits}`
}

const revealTransition = { duration: 0.35, ease: 'easeOut' }

export default function ChannelCards() {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const reducedMotion = useReducedMotion()
  const qrColors = QR_COLORS[theme] || QR_COLORS.light

  const revealProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: revealTransition,
      }

  return (
    <section className="px-4 py-14 sm:px-12 sm:py-20">
      <div className="mx-auto mb-11 max-w-xl text-center">
        <p className="mb-2.5 text-sm font-bold text-[var(--green)]">{t('home.channelCards.eyebrow')}</p>
        <h2 className="font-[var(--font-display)] text-3xl font-bold text-[var(--text-primary)] sm:text-[32px]">
          {t('home.channelCards.title')}
        </h2>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2">
        {/* ============ WHATSAPP CARD ============ */}
        <motion.div
          {...revealProps}
          className="flex flex-col rounded-3xl bg-[var(--bg-card)] p-7 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)] sm:p-8"
        >
          <div className="flex flex-1 flex-col sm:flex-row sm:items-start sm:gap-6">
            <div className="flex-1">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--green)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-3.5"
                aria-hidden="true"
              >
                <path d="M3 21l1.65-4.95A9 9 0 1 1 8.05 19.35z" />
                <path d="M8.5 9.5c0-.5.5-1.5 1-1.5s1 1 1 1.5-.5 1-.5 1.5c0 1 1.5 2.5 2.5 2.5.5 0 1-.5 1.5-.5s1 .5 1.5 1-1 1.5-1.5 1.5c-2 0-5-2-5-5.5z" />
              </svg>
              <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
                {t('home.channelCards.whatsapp.heading')}
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
                {t('home.channelCards.whatsapp.desc')}
              </p>

              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('home.channelCards.whatsapp.buttonAriaLabel')}
                className="mb-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--green)] px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-[var(--green-hover)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 sm:w-auto"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 21l1.65-4.95A9 9 0 1 1 8.05 19.35z" />
                </svg>
                {t('home.channelCards.whatsapp.button')}
              </a>

              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {formatWhatsAppDisplay(WHATSAPP_NUMBER)}
              </p>
            </div>

            <div className="mt-6 flex justify-center sm:mt-0 sm:block sm:shrink-0">
              <div className="rounded-2xl bg-[var(--green-tint)] p-3">
                <QRCodeSVG
                  value={WHATSAPP_URL}
                  size={112}
                  bgColor={qrColors.bg}
                  fgColor={qrColors.fg}
                  level="M"
                  role="img"
                  aria-label={t('home.channelCards.whatsapp.qrAlt')}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============ CALL CARD ============ */}
        <motion.div
          {...revealProps}
          className="flex flex-col rounded-3xl bg-[var(--bg-card)] p-7 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)] sm:p-8"
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--green)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mb-3.5"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <h3 className="mb-2 text-lg font-bold text-[var(--text-primary)]">
            {t('home.channelCards.call.heading')}
          </h3>
          <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
            {t('home.channelCards.call.desc')}
          </p>

          <a
            href={`tel:${CALL_NUMBER}`}
            aria-label={t('home.channelCards.call.buttonAriaLabel')}
            className="mb-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-[var(--green)] px-6 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-[var(--green-hover)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 sm:w-auto"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            {t('home.channelCards.call.button', { number: CALL_NUMBER })}
          </a>

          <p className="text-lg font-bold text-[var(--text-primary)]">{CALL_NUMBER}</p>
        </motion.div>
      </div>
    </section>
  )
}
