import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { flagClaim } from '../lib/api'

/**
 * @param {{ claimId: string, verdict: string, explanation: string }} props
 */
export default function ShareFlagButtons({ claimId, verdict, explanation }) {
  const { t } = useTranslation()
  const [flagState, setFlagState] = useState('idle') // idle | sending | done | error

  const handleShare = async () => {
    const shareText = t('shareFlag.shareText', { verdict, explanation })
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText })
      } catch {
        // user cancelled share sheet; nothing to do
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(shareText)
    }
  }

  const handleFlag = async () => {
    if (flagState === 'sending' || flagState === 'done') return
    setFlagState('sending')
    try {
      await flagClaim(claimId)
      setFlagState('done')
    } catch {
      setFlagState('error')
    }
  }

  return (
    <div className="mb-3.5 grid grid-cols-2 gap-2.5">
      <button
        type="button"
        onClick={handleShare}
        className="flex min-h-12 flex-col items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-[var(--green)]/40 hover:shadow-[0_6px_16px_rgba(0,0,0,0.05)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span className="text-sm font-bold text-[var(--text-primary)]">{t('shareFlag.shareAnswer')}</span>
      </button>

      <button
        type="button"
        onClick={handleFlag}
        disabled={flagState === 'sending' || flagState === 'done'}
        className="flex min-h-12 flex-col items-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-3 py-3.5 transition-all duration-150 hover:enabled:-translate-y-0.5 hover:enabled:border-[var(--amber)]/50 hover:enabled:shadow-[0_6px_16px_rgba(0,0,0,0.05)] disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        <span className="text-sm font-bold text-[var(--text-primary)]">
          {flagState === 'done'
            ? t('shareFlag.flagged')
            : flagState === 'error'
              ? t('shareFlag.tryAgain')
              : t('shareFlag.flagSuspicious')}
        </span>
      </button>
    </div>
  )
}
