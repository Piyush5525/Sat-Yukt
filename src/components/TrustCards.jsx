import { useTranslation } from 'react-i18next'

const ICONS = [
  (
    <>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    </>
  ),
  (
    <>
      <path d="M11 5 6 9H2v6h4l5 4V5z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </>
  ),
  (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" />
    </>
  ),
]

export default function TrustCards() {
  const { t } = useTranslation()
  const cards = t('home.trustCards.cards', { returnObjects: true })

  return (
    <section id="about" className="px-4 py-14 sm:px-12 sm:py-20">
      <div className="mx-auto mb-11 max-w-xl text-center">
        <p className="mb-2.5 text-sm font-bold text-[var(--green)]">{t('home.trustCards.eyebrow')}</p>
        <h2 className="font-[var(--font-display)] text-3xl font-bold text-[var(--text-primary)] sm:text-[32px]">
          {t('home.trustCards.title')}
        </h2>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4.5 sm:grid-cols-3">
        {cards.map((card, i) => (
          <div
            key={card.title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5.5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--green)]/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--green)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3.5"
              aria-hidden="true"
            >
              {ICONS[i]}
            </svg>
            <h4 className="mb-1.5 text-[14.5px] font-bold text-[var(--text-primary)]">{card.title}</h4>
            <p className="text-[13px] text-[var(--text-secondary)]">{card.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
