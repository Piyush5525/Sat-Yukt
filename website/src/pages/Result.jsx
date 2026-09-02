import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'
import VerdictCard from '../components/VerdictCard'
import SourceCard from '../components/SourceCard'
import ActionCard from '../components/ActionCard'
import ShareFlagButtons from '../components/ShareFlagButtons'
import { useClaim } from '../context/ClaimContext'

export default function Result() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { claim, verdict, language, clearClaimResult } = useClaim()

  useEffect(() => {
    if (!verdict) {
      navigate('/', { replace: true })
    }
  }, [verdict, navigate])

  if (!verdict) return null

  const handleCheckAnother = () => {
    clearClaimResult()
    navigate('/')
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-lg px-4 pb-16 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label={t('result.goBack')}
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--bg-muted)] transition-colors duration-150 hover:bg-[var(--green-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>

        <p className="mb-1 text-sm text-[var(--text-secondary)]">{t('result.ready')}</p>
        <h1 className="mb-5 font-[var(--font-display)] text-2xl font-bold text-[var(--text-primary)]">
          {t('result.title')}
        </h1>

        {claim && (
          <p className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3 text-sm italic text-[var(--text-secondary)]">
            “{claim}”
          </p>
        )}

        <div className="mb-4">
          <VerdictCard
            verdict={verdict.verdict}
            confidence={verdict.confidence}
            explanation={verdict.explanation}
            language={language}
          />
        </div>

        <SourceCard sourceName={verdict.source_name} sourceUrl={verdict.source_url} />
        <ActionCard verdict={verdict.verdict} />
        <ShareFlagButtons
          claimId={verdict.claim_id}
          verdict={verdict.verdict}
          explanation={verdict.explanation}
        />

        <button
          type="button"
          onClick={handleCheckAnother}
          className="mb-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--green)] px-4 py-3.5 text-sm font-bold text-white transition-all duration-150 hover:bg-[var(--green-hover)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          </svg>
          {t('result.checkAnother')}
        </button>

        <p className="text-center text-xs leading-relaxed text-[var(--text-secondary)]">
          {t('result.footnote')}
        </p>
      </main>
    </div>
  )
}
