import { useTranslation } from 'react-i18next'

/**
 * @param {{ sourceName: string, sourceUrl: string }} props
 */
export default function SourceCard({ sourceName, sourceUrl }) {
  const { t } = useTranslation()

  return (
    <div className="mb-4 flex gap-3.5 rounded-2xl bg-[var(--bg-card)] p-4 shadow-[0_6px_18px_rgba(0,0,0,0.05)] transition-shadow duration-300 hover:shadow-[0_8px_22px_rgba(0,0,0,0.07)]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--green-tint)]">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="21" x2="21" y2="21" />
          <line x1="6" y1="18" x2="6" y2="11" />
          <line x1="10" y1="18" x2="10" y2="11" />
          <line x1="14" y1="18" x2="14" y2="11" />
          <line x1="18" y1="18" x2="18" y2="11" />
          <polygon points="12 2 20 8 4 8" />
        </svg>
      </div>
      <div>
        <b className="mb-0.5 block text-sm text-[var(--text-primary)]">{t('sourceCard.checkedWith')}</b>
        <div className="mb-1.5 text-sm text-[var(--text-secondary)]">{sourceName}</div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded text-sm font-bold text-[var(--green)] underline-offset-2 transition-colors duration-150 hover:text-[var(--green-hover)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
          >
            {t('sourceCard.viewSource')}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        )}
      </div>
    </div>
  )
}
