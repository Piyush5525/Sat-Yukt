import { useTranslation } from 'react-i18next'

/**
 * @param {{ verdict: 'true'|'misleading'|'false'|'unverifiable' }} props
 */
export default function ActionCard({ verdict }) {
  const { t } = useTranslation()
  const text = t(`actionCard.text.${verdict}`, t('actionCard.text.unverifiable'))

  return (
    <div className="mb-4 flex gap-3 rounded-2xl bg-[var(--bg-soft-tan)] p-4">
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--amber)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
        aria-hidden="true"
      >
        <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" />
      </svg>
      <div>
        <b className="mb-0.5 block text-sm text-[var(--text-primary)]">{t('actionCard.title')}</b>
        <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{text}</p>
      </div>
    </div>
  )
}
