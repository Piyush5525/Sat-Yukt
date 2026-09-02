import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../context/ThemeContext'
import logoLight from '../assets/logo-light.jpg'
import logoDark from '../assets/logo-dark.jpg'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <header className="flex items-center justify-between gap-3 bg-[var(--bg-hero)] px-4 py-4 sm:px-12">
      <Link
        to="/"
        className="flex items-center gap-2.5 shrink-0 rounded-md transition-opacity duration-150 hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]"
        aria-label={t('header.logoAlt')}
      >
        <img
          src={theme === 'dark' ? logoDark : logoLight}
          alt={t('header.logoAlt')}
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="font-[var(--font-display)] text-lg font-bold tracking-wide text-[var(--text-on-hero)] sm:text-xl">
          {t('brand')}
        </span>
      </Link>

      <nav className="hidden items-center gap-8 md:flex">
        <Link
          to="/#how"
          className="text-sm font-medium text-[var(--text-on-hero-muted)] transition-colors duration-150 hover:text-[var(--text-on-hero)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]"
        >
          {t('header.nav.how')}
        </Link>
        <Link
          to="/#verify"
          className="text-sm font-medium text-[var(--text-on-hero-muted)] transition-colors duration-150 hover:text-[var(--text-on-hero)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]"
        >
          {t('header.nav.verify')}
        </Link>
        <Link
          to="/#about"
          className="text-sm font-medium text-[var(--text-on-hero-muted)] transition-colors duration-150 hover:text-[var(--text-on-hero)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]"
        >
          {t('header.nav.about')}
        </Link>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)] ${
              isActive
                ? 'text-[var(--text-on-hero)]'
                : 'text-[var(--text-on-hero-muted)] hover:text-[var(--text-on-hero)]'
            }`
          }
        >
          {t('header.nav.history')}
        </NavLink>
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t('header.themeToggle.toLight') : t('header.themeToggle.toDark')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[var(--text-on-hero)] transition-colors duration-150 hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]"
        >
          {theme === 'dark' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={() => navigate('/#verify')}
          className="min-h-11 rounded-lg bg-[var(--green)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:bg-[var(--green-hover)] hover:-translate-y-0.5 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-hero)]"
        >
          {t('header.cta')}
        </button>
      </div>
    </header>
  )
}
