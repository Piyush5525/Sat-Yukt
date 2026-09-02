import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useReducedMotion } from '../lib/useReducedMotion'

const WAVEFORM_BARS = [0, 1, 2, 3, 4]

/**
 * @param {{ status: 'idle' | 'recording' | 'processing', onClick: () => void, disabled?: boolean }} props
 */
export default function MicButton({ status, onClick, disabled }) {
  const { t } = useTranslation()
  const isRecording = status === 'recording'
  const isProcessing = status === 'processing'
  const reducedMotion = useReducedMotion()

  const label = isRecording
    ? t('micButton.recordingLabel')
    : isProcessing
      ? t('micButton.processingLabel')
      : t('micButton.idleLabel')

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-[148px] w-[148px] items-center justify-center">
        {status === 'idle' && (
          <span className="mic-idle-pulse absolute inset-0 rounded-full bg-[var(--green-tint)]" />
        )}
        <span className="absolute inset-0 rounded-full bg-[var(--green-tint)]" />

        <motion.button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className="relative flex h-[108px] min-h-[100px] w-[108px] min-w-[100px] flex-col items-center justify-center gap-1.5 rounded-full border-none bg-[var(--green)] text-white shadow-[0_4px_16px_rgba(63,122,78,0.35)] transition-shadow duration-150 hover:enabled:shadow-[0_6px_22px_rgba(63,122,78,0.45)] disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green)] focus-visible:ring-offset-2"
          animate={isProcessing && !reducedMotion ? { scale: [1, 0.96, 1] } : { scale: 1 }}
          transition={isProcessing && !reducedMotion ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
          whileHover={!disabled ? { scale: 1.04 } : {}}
          whileTap={{ scale: 0.94 }}
        >
          {isRecording ? (
            <div className="flex h-8 items-end gap-1" aria-hidden="true">
              {WAVEFORM_BARS.map((bar) => (
                <motion.span
                  key={bar}
                  className="w-1 rounded-full bg-white"
                  animate={reducedMotion ? { height: '60%' } : { height: ['30%', '100%', '45%', '80%', '30%'] }}
                  transition={
                    reducedMotion
                      ? { duration: 0.2 }
                      : { duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: bar * 0.08 }
                  }
                />
              ))}
            </div>
          ) : isProcessing ? (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            </svg>
          )}
          <span className="text-xs font-bold">
            {isRecording ? t('micButton.recording') : isProcessing ? t('micButton.processing') : t('micButton.idle')}
          </span>
        </motion.button>
      </div>

      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .mic-idle-pulse {
            animation: mic-pulse 2.2s ease-out infinite;
          }
        }
        @keyframes mic-pulse {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.55); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
