import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'
import { getRecentClaims } from '../lib/api'
import { getVerdictStyle } from '../lib/verdictStyles'
import { formatRelativeTime } from '../lib/relativeTime'

export default function History() {
  const { t, i18n } = useTranslation()
  const [claims, setClaims] = useState(null) // null = loading
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      setClaims(null)
      try {
        const data = await getRecentClaims()
        if (!cancelled) setClaims(data)
      } catch (err) {
        if (cancelled) return
        if (err.message === 'network') {
          setError(t('home.errors.networkError'))
        } else {
          setError(t('home.errors.generic'))
        }
        setClaims([])
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [t])

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-2xl px-4 pb-16 sm:px-6">
        <div className="pt-8 pb-6 text-center sm:pt-12">
          <p className="mb-2.5 text-sm font-bold text-[var(--green)]">{t('history.eyebrow')}</p>
          <h1 className="mb-3 font-[var(--font-display)] text-3xl font-bold text-[var(--text-primary)] sm:text-[32px]">
            {t('history.title')}
          </h1>
          <p className="text-[15px] text-[var(--text-secondary)]">{t('history.lead')}</p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-[var(--verdict-false)] bg-[var(--amber-tint)] p-3 text-sm text-[var(--text-primary)]"
          >
            {error}
          </div>
        )}

        {claims === null && !error && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--green)]" />
            <p className="text-sm text-[var(--text-secondary)]">{t('history.loading')}</p>
          </div>
        )}

        {claims !== null && claims.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-muted)] p-10 text-center">
            <p className="text-sm text-[var(--text-secondary)]">{t('history.empty')}</p>
          </div>
        )}

        {claims !== null && claims.length > 0 && (
          <ul className="flex flex-col gap-3">
            {claims.map((claim, i) => {
              const style = getVerdictStyle(claim.verdict)
              const label = t(`verdictCard.labels.${claim.verdict}`, t('verdictCard.labels.unverifiable'))
              return (
                <li
                  key={`${claim.timestamp}-${i}`}
                  className="flex gap-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: style.iconBg }}
                  >
                    <svg
                      width="20"
                      height="20"
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
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-sm font-bold text-[var(--text-primary)]">{label}</span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {formatRelativeTime(claim.timestamp, i18n.language)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{claim.claim_text}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-black/10">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${claim.confidence}%`, background: 'var(--green)' }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">
                        {claim.confidence}%
                      </span>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </div>
  )
}
