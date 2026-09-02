import { useTranslation } from 'react-i18next'

const MODES = [
  {
    key: 'voice',
    labelKey: 'inputModes.speak',
    icon: (
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z M19 10v2a7 7 0 0 1-14 0v-2" />
    ),
  },
  {
    key: 'photo',
    labelKey: 'inputModes.photo',
    icon: (
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    ),
  },
  {
    key: 'type',
    labelKey: 'inputModes.type',
    icon: <rect x="2" y="6" width="20" height="12" rx="2" />,
  },
]

/**
 * @param {{ mode: 'voice' | 'photo' | 'type', onChange: (mode: string) => void }} props
 */
export default function InputModeSelector({ mode, onChange }) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-2" role="tablist" aria-label={t('inputModes.ariaLabel')}>
      {MODES.map((m) => {
        const active = mode === m.key
        return (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m.key)}
            className={`flex min-h-12 flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 ${
              active
                ? 'border-[var(--green)] bg-[var(--green-tint)]'
                : 'border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--green)]/50 hover:bg-[var(--green-tint)]/50'
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={active ? 'var(--green-deep)' : 'var(--text-primary)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {m.icon}
            </svg>
            <span
              className="text-xs font-bold"
              style={{ color: active ? 'var(--green-deep)' : 'var(--text-secondary)' }}
            >
              {t(m.labelKey)}
            </span>
          </button>
        )
      })}
    </div>
  )
}
