import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from '../components/Header'
import MicButton from '../components/MicButton'
import InputModeSelector from '../components/InputModeSelector'
import LanguageGrid from '../components/LanguageGrid'
import HowItWorks from '../components/HowItWorks'
import TrustCards from '../components/TrustCards'
import ChannelCards from '../components/ChannelCards'
import VerdictLegend from '../components/VerdictLegend'
import { useClaim } from '../context/ClaimContext'
import { verifyClaim } from '../lib/api'
import { startListening, isSpeechRecognitionSupported } from '../lib/speech'
import { extractTextFromImage, isImageFile, isFileTooLarge } from '../lib/ocr'

export default function Home() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const { setClaimResult } = useClaim()

  const [mode, setMode] = useState('voice')
  const [text, setText] = useState('')
  const [micStatus, setMicStatus] = useState('idle')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [photoText, setPhotoText] = useState('')
  const [ocrStatus, setOcrStatus] = useState('idle') // idle | reading | done
  const [ocrProgress, setOcrProgress] = useState(0)
  const fileInputRef = useRef(null)

  const language = i18n.language
  const setLanguage = (lang) => i18n.changeLanguage(lang)

  useEffect(() => {
    return () => {
      if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    }
  }, [photoPreviewUrl])

  // Header nav links point at "/#how" etc. so they work from any page. When
  // that lands us here with a hash already in the URL, scroll to the target
  // section — React Router doesn't do this automatically on navigation.
  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.slice(1)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [location.hash])

  const runVerify = async (payloadText) => {
    setError('')
    setIsSubmitting(true)
    setMicStatus('processing')
    try {
      const result = await verifyClaim({ text: payloadText, language, mode })
      setClaimResult(payloadText, result, language)
      navigate('/result')
    } catch (err) {
      if (err.message === 'network') {
        setError(t('home.errors.networkError'))
      } else if (err.message === 'server') {
        setError(t('home.errors.serverError', { status: err.status }))
      } else {
        setError(t('home.errors.generic'))
      }
    } finally {
      setIsSubmitting(false)
      setMicStatus('idle')
    }
  }

  const handleMicClick = () => {
    if (micStatus === 'recording') return

    if (!isSpeechRecognitionSupported()) {
      setError(t('home.errors.voiceUnsupported'))
      setMode('type')
      return
    }

    setError('')
    setMicStatus('recording')
    startListening(language, {
      onResult: (transcript) => {
        setText(transcript)
        if (transcript.trim()) {
          runVerify(transcript)
        } else {
          setMicStatus('idle')
        }
      },
      onError: (errorKey) => {
        if (errorKey === 'not-allowed') {
          setError(t('home.errors.micBlocked'))
        } else if (errorKey === 'unsupported') {
          setError(t('home.errors.voiceUnsupported'))
        } else {
          setError(t('home.errors.couldNotHear'))
        }
        setMicStatus('idle')
      },
      onEnd: () => {
        setMicStatus((s) => (s === 'recording' ? 'idle' : s))
      },
    })
  }

  const handleTypeSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    runVerify(text.trim())
  }

  const handlePhotoSelected = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file later
    if (!file) return

    setError('')
    setPhotoText('')

    if (!isImageFile(file)) {
      setError(t('home.errors.notAnImage'))
      return
    }
    if (isFileTooLarge(file)) {
      setError(t('home.errors.photoTooLarge'))
      return
    }

    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
    setPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
    setOcrStatus('reading')
    setOcrProgress(0)

    try {
      const extracted = await extractTextFromImage(file, language, setOcrProgress)
      setPhotoText(extracted)
      if (!extracted) {
        setError(t('home.errors.ocrFailed'))
      }
    } catch {
      setError(t('home.errors.ocrFailed'))
    } finally {
      setOcrStatus('done')
    }
  }

  const handlePhotoSubmit = (e) => {
    e.preventDefault()
    if (!photoText.trim()) return
    runVerify(photoText.trim())
  }

  return (
    <div className="min-h-screen">
      <Header />

      {/* ============ HERO ============ */}
      <section
        id="verify"
        className="grid grid-cols-1 gap-10 bg-[var(--bg-hero)] px-4 py-12 sm:px-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-22"
      >
        <div>
          <div className="mb-5 flex flex-wrap gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--green)] bg-[rgba(63,122,78,0.15)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-on-hero)]">
              {t('home.pills.free')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--green)] bg-[rgba(63,122,78,0.15)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-on-hero)]">
              {t('home.pills.languages')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--green)] bg-[rgba(63,122,78,0.15)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-on-hero)]">
              {t('home.pills.noSignup')}
            </span>
          </div>

          <h1 className="mb-5 max-w-[11.5ch] font-[var(--font-display)] text-[34px] font-bold leading-tight text-[var(--text-on-hero)] sm:text-[46px]">
            {t('home.heroTitle')}
          </h1>
          <p className="mb-7 max-w-[46ch] text-base leading-relaxed text-[var(--text-on-hero-muted)] sm:text-[16.5px]">
            {t('home.heroLead')}
          </p>

          <div className="mb-9 flex flex-wrap items-center gap-4.5">
            <a
              href="#verify-card"
              className="inline-flex min-h-12 items-center gap-2.5 rounded-[10px] bg-[var(--green)] px-6.5 py-3.5 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-[var(--green-hover)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(63,122,78,0.35)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
              </svg>
              {t('home.speakYourDoubt')}
            </a>
            <a
              href="#verify-card"
              className="border-b border-white/25 pb-0.5 text-sm font-semibold text-[var(--text-on-hero-muted)] transition-colors duration-150 hover:border-white/60 hover:text-[var(--text-on-hero)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]"
            >
              {t('home.orTypeInstead')}
            </a>
          </div>

          <div className="flex flex-wrap gap-8.5">
            <div>
              <b className="block font-[var(--font-display)] text-2xl text-[var(--text-on-hero)]">
                12,400+
              </b>
              <span className="text-xs text-[var(--text-on-hero-muted)]">{t('home.stats.claimsChecked')}</span>
            </div>
            <div>
              <b className="block font-[var(--font-display)] text-2xl text-[var(--text-on-hero)]">8</b>
              <span className="text-xs text-[var(--text-on-hero-muted)]">{t('home.stats.languagesSupported')}</span>
            </div>
            <div>
              <b className="block font-[var(--font-display)] text-2xl text-[var(--text-on-hero)]">
                94%
              </b>
              <span className="text-xs text-[var(--text-on-hero-muted)]">
                {t('home.stats.trustworthy')}
              </span>
            </div>
          </div>
        </div>

        {/* ============ INPUT CARD ============ */}
        <div
          id="verify-card"
          className="rounded-[20px] bg-[var(--bg-card)] p-7 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-8"
        >
          <p className="mb-4.5 text-center text-[13px] font-semibold text-[var(--text-secondary)]">
            {t('home.inputCard.label')}
          </p>

          {mode === 'voice' && (
            <div className="mb-5.5 flex justify-center">
              <MicButton status={micStatus} onClick={handleMicClick} disabled={isSubmitting} />
            </div>
          )}

          {mode === 'type' && (
            <form onSubmit={handleTypeSubmit} className="mb-5.5">
              <label htmlFor="claim-text" className="mb-2 block text-sm font-bold text-[var(--text-primary)]">
                {t('home.inputCard.typeLabel')}
              </label>
              <textarea
                id="claim-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={4}
                placeholder={t('home.inputCard.placeholder')}
                className="mb-3 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]/30"
              />
              <button
                type="submit"
                disabled={isSubmitting || !text.trim()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-4 py-3 text-sm font-bold text-white transition-all duration-150 hover:enabled:bg-[var(--green-hover)] hover:enabled:-translate-y-0.5 active:enabled:translate-y-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
              >
                {isSubmitting ? t('home.inputCard.checking') : t('home.inputCard.submit')}
              </button>
            </form>
          )}

          {mode === 'photo' && (
            <div className="mb-5.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelected}
                className="hidden"
                id="claim-photo"
              />

              {!photoPreviewUrl && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-muted)] p-8 text-center transition-colors duration-150 hover:border-[var(--green)] hover:bg-[var(--green-tint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span className="text-sm font-bold text-[var(--text-primary)]">
                    {t('home.inputCard.photoUpload')}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">{t('home.inputCard.photoHint')}</span>
                </button>
              )}

              {photoPreviewUrl && (
                <div className="mb-3 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3">
                  <img
                    src={photoPreviewUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-12 flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm font-bold text-[var(--text-primary)] transition-colors duration-150 hover:border-[var(--green)] hover:text-[var(--green-deep)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
                  >
                    {t('home.inputCard.photoChange')}
                  </button>
                </div>
              )}

              {ocrStatus === 'reading' && (
                <div className="mb-3 rounded-xl bg-[var(--green-tint)] p-3">
                  <p className="mb-2 text-sm font-semibold text-[var(--green-deep)]">
                    {t('home.inputCard.photoReadingProgress', { percent: Math.round(ocrProgress * 100) })}
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-black/10">
                    <div
                      className="h-full rounded-full bg-[var(--green)] transition-[width]"
                      style={{ width: `${Math.round(ocrProgress * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {ocrStatus === 'done' && photoText && (
                <form onSubmit={handlePhotoSubmit}>
                  <label htmlFor="claim-photo-text" className="mb-2 block text-sm font-bold text-[var(--text-primary)]">
                    {t('home.inputCard.photoExtractedLabel')}
                  </label>
                  <textarea
                    id="claim-photo-text"
                    value={photoText}
                    onChange={(e) => setPhotoText(e.target.value)}
                    rows={4}
                    className="mb-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-muted)] p-3 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 focus:border-[var(--green)] focus-visible:ring-2 focus-visible:ring-[var(--green)]/30"
                  />
                  <p className="mb-3 text-xs text-[var(--text-secondary)]">{t('home.inputCard.photoExtractedHint')}</p>
                  <button
                    type="submit"
                    disabled={isSubmitting || !photoText.trim()}
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--green)] px-4 py-3 text-sm font-bold text-white transition-all duration-150 hover:enabled:bg-[var(--green-hover)] hover:enabled:-translate-y-0.5 active:enabled:translate-y-0 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
                  >
                    {isSubmitting ? t('home.inputCard.checking') : t('home.inputCard.submit')}
                  </button>
                </form>
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-[var(--verdict-false)] bg-[var(--amber-tint)] p-3 text-sm text-[var(--text-primary)]"
            >
              {error}
            </div>
          )}

          <div className="mb-5.5">
            <InputModeSelector mode={mode} onChange={setMode} />
          </div>

          <LanguageGrid language={language} onChange={setLanguage} />
        </div>
      </section>

      <HowItWorks />

      {/* ============ VERDICT DEMO ============ */}
      <section id="community" className="bg-[var(--bg-muted)] px-4 py-14 sm:px-12 sm:py-20">
        <div className="mx-auto mb-11 max-w-xl text-center">
          <p className="mb-2.5 text-sm font-bold text-[var(--green)]">{t('home.verdictDemo.eyebrow')}</p>
          <h2 className="mb-3 font-[var(--font-display)] text-3xl font-bold text-[var(--text-primary)] sm:text-[32px]">
            {t('home.verdictDemo.title')}
          </h2>
          <p className="text-[15px] text-[var(--text-secondary)]">
            {t('home.verdictDemo.lead')}
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-7 shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition-shadow duration-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.07)]">
            <div className="mb-4.5 flex flex-wrap items-center justify-between gap-2.5">
              <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(192,57,46,0.12)] px-4 py-2 text-sm font-bold text-[var(--verdict-false)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                {t('home.verdictDemo.badge')}
              </span>
              <span className="text-[13px] font-semibold text-[var(--text-secondary)]">{t('home.verdictDemo.confidence')}</span>
            </div>
            <p className="mb-3.5 border-b border-[var(--border)] pb-3.5 text-sm italic text-[var(--text-secondary)]">
              {t('home.verdictDemo.claim')}
            </p>
            <p className="mb-4.5 text-[15px] leading-relaxed text-[var(--text-primary)]">
              {t('home.verdictDemo.explanation')}
            </p>
            <div className="mb-5 flex items-center gap-2 text-[13px] font-semibold text-[var(--green)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              {t('home.verdictDemo.source')}
            </div>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                className="flex min-h-11 flex-1 min-w-[140px] items-center justify-center gap-1.5 rounded-[10px] bg-[var(--green-tint)] px-3 py-2.5 text-[13px] font-semibold text-[var(--green-deep)] transition-colors duration-150 hover:bg-[var(--green)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 5 6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
                {t('home.verdictDemo.readAloud')}
              </button>
              <button
                type="button"
                className="flex min-h-11 flex-1 min-w-[140px] items-center justify-center gap-1.5 rounded-[10px] border border-[var(--border)] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-secondary)] transition-colors duration-150 hover:border-[var(--amber)] hover:text-[var(--amber)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                {t('home.verdictDemo.flagAsSuspicious')}
              </button>
            </div>
          </div>

          <VerdictLegend />
        </div>
      </section>

      <TrustCards />

      <ChannelCards />

      {/* ============ FOOTER ============ */}
      <footer className="flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-hero)] px-4 py-8 sm:px-12">
        <Link to="/" className="flex items-center gap-2.5 rounded-md transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]">
          <span className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-[var(--green)] font-[var(--font-display)] text-sm font-bold text-[var(--bg-hero)]">
            S
          </span>
          <span className="font-[var(--font-display)] text-lg font-bold text-[var(--text-on-hero)]">
            {t('brand')}
          </span>
        </Link>
        <span className="text-xs text-[var(--text-on-hero-muted)]">
          {t('home.footer.tagline')}
        </span>
      </footer>
    </div>
  )
}
