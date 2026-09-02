import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { speak, stopSpeaking, isSpeechSynthesisSupported } from '../lib/speech'
import { getVerdictStyle } from '../lib/verdictStyles'

/**
 * @param {{ verdict: 'true'|'misleading'|'false'|'unverifiable', confidence: number, explanation: string, language: string }} props
 */
export default function VerdictCard({ verdict, confidence, explanation, language }) {
  const { t } = useTranslation()
  const [isSpeaking, setIsSpeaking] = useState(false)
  const style = getVerdictStyle(verdict)
  const label = t(`verdictCard.labels.${verdict}`, t('verdictCard.labels.unverifiable'))
  const desc = t(`verdictCard.descriptions.${verdict}`, t('verdictCard.descriptions.unverifiable'))

  useEffect(() => stopSpeaking, [])

  const handleListen = async () => {
    if (isSpeaking) {
      stopSpeaking()
      setIsSpeaking(false)
      return
    }
    setIsSpeaking(true)
    const utteranceEnd = () => setIsSpeaking(false)
    window.speechSynthesis.addEventListener('end', utteranceEnd, { once: true })
    await speak(explanation, language)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-3xl bg-[var(--bg-card)] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-shadow duration-300 hover:shadow-[0_12px_32px_rgba(0,0,0,0.09)] sm:p-6"
    >
      <div className="mb-5 flex gap-3.5">
        <div
          className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: style.iconBg, width: 52, height: 52 }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={style.iconStroke}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {style.icon}
          </svg>
        </div>
        <div>
          <div className="text-xs text-[var(--text-secondary)]">{t('verdictCard.verdictLabel')}</div>
          <div className="font-[var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
            {label}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">{desc}</div>
        </div>
      </div>

      <div className="mb-5 rounded-2xl bg-[var(--bg-soft-tan)] p-4">
        <div className="mb-2.5 flex items-baseline justify-between">
          <b className="text-sm text-[var(--text-primary)]">{t('verdictCard.confidence')}</b>
          <span className="font-[var(--font-display)] text-xl font-bold text-[var(--green-deep)]">
            {confidence}%
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-black/10">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'var(--green)' }}
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      <p className="mb-2 text-sm font-bold text-[var(--text-primary)]">{t('verdictCard.inSimpleWords')}</p>
      <p className="mb-5 text-[15px] leading-relaxed text-[var(--text-primary)]">{explanation}</p>

      <button
        type="button"
        onClick={handleListen}
        disabled={!isSpeechSynthesisSupported()}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--green)] px-4 py-3.5 text-sm font-bold text-white transition-all duration-150 hover:enabled:bg-[var(--green-hover)] hover:enabled:-translate-y-0.5 active:enabled:translate-y-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M11 5 6 9H2v6h4l5 4V5z" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
        {isSpeaking ? t('verdictCard.stopListening') : t('verdictCard.listen')}
      </button>
    </motion.div>
  )
}
