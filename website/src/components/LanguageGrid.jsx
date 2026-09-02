import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n'

/**
 * @param {{ language: string, onChange: (language: string) => void }} props
 */
export default function LanguageGrid({ language, onChange }) {
  const { t } = useTranslation()

  return (
    <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label={t('languageGrid.ariaLabel')}>
      {SUPPORTED_LANGUAGES.map((key) => {
        const active = language === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={`min-h-12 rounded-xl px-4 py-3.5 text-center text-base font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 ${
              active
                ? 'bg-[var(--green)] text-white'
                : 'bg-[var(--bg-muted)] text-[var(--text-primary)] hover:bg-[var(--green-tint)]'
            }`}
          >
            {t(`languageGrid.names.${key}`)}
          </button>
        )
      })}
    </div>
  )
}
