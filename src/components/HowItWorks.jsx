import { useTranslation } from 'react-i18next'

export default function HowItWorks() {
  const { t } = useTranslation()
  const steps = t('home.howItWorks.steps', { returnObjects: true })

  return (
    <section id="how" className="px-4 py-14 sm:px-12 sm:py-20">
      <div className="mx-auto mb-11 max-w-xl text-center">
        <p className="mb-2.5 text-sm font-bold text-[var(--green)]">{t('home.howItWorks.eyebrow')}</p>
        <h2 className="mb-3 font-[var(--font-display)] text-3xl font-bold text-[var(--text-primary)] sm:text-[32px]">
          {t('home.howItWorks.title')}
        </h2>
        <p className="text-[15px] text-[var(--text-secondary)]">
          {t('home.howItWorks.lead')}
        </p>
      </div>
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--green)]/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          >
            <div className="mb-4 flex h-8.5 w-8.5 items-center justify-center rounded-full bg-[var(--green-tint)] text-sm font-bold text-[var(--green-deep)]">
              {i + 1}
            </div>
            <h3 className="mb-2 text-base font-bold text-[var(--text-primary)]">{step.title}</h3>
            <p className="text-[13.5px] text-[var(--text-secondary)]">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
