import { useTranslation } from 'react-i18next'

const LEGEND_ORDER = [
  { key: 'true', color: 'var(--verdict-true)' },
  { key: 'misleading', color: 'var(--verdict-misleading)' },
  { key: 'false', color: 'var(--verdict-false)' },
  { key: 'unverifiable', color: 'var(--verdict-unverifiable)' },
]

export default function VerdictLegend() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4">
      {LEGEND_ORDER.map((item) => (
        <div key={item.key} className="flex items-center gap-3.5">
          <span
            className="h-3.5 w-3.5 shrink-0 rounded-full"
            style={{ background: item.color }}
            aria-hidden="true"
          />
          <div>
            <b className="block text-sm text-[var(--text-primary)]">
              {t(`home.verdictDemo.legend.${item.key}.label`)}
            </b>
            <span className="text-[13px] text-[var(--text-secondary)]">
              {t(`home.verdictDemo.legend.${item.key}.desc`)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
