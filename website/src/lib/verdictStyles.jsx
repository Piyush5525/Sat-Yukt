// Shared verdict → icon/color mapping, used by VerdictCard (Result page) and
// History (recent claims list) so both render verdicts identically.

export const VERDICT_STYLES = {
  true: {
    iconBg: 'var(--green-tint)',
    iconStroke: 'var(--green-deep)',
    icon: (
      <>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </>
    ),
  },
  misleading: {
    iconBg: 'var(--amber-tint)',
    iconStroke: 'var(--amber)',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="13" />
        <line x1="12" y1="16" x2="12" y2="16" />
      </>
    ),
  },
  false: {
    iconBg: 'color-mix(in srgb, var(--verdict-false) 15%, var(--bg-card))',
    iconStroke: 'var(--verdict-false)',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </>
    ),
  },
  unverifiable: {
    iconBg: 'var(--bg-muted)',
    iconStroke: 'var(--verdict-unverifiable)',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="16" />
        <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" />
      </>
    ),
  },
}

export function getVerdictStyle(verdict) {
  return VERDICT_STYLES[verdict] || VERDICT_STYLES.unverifiable
}
