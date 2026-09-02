// Maps our language keys (matching LanguageGrid) to BCP-47 tags used by the Web Speech API.
export const LANGUAGE_LOCALES = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export function isSpeechRecognitionSupported() {
  return getSpeechRecognition() !== null
}

export function isSpeechSynthesisSupported() {
  return 'speechSynthesis' in window
}

let _voicesCache = null

/**
 * Returns the browser's available speechSynthesis voices, waiting for the
 * async voiceschanged event if the list isn't populated yet (common on first
 * call in Chrome). Cached after the first successful, non-empty read.
 */
function getVoices() {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisSupported()) {
      resolve([])
      return
    }
    if (_voicesCache && _voicesCache.length) {
      resolve(_voicesCache)
      return
    }

    const existing = window.speechSynthesis.getVoices()
    if (existing.length) {
      _voicesCache = existing
      resolve(existing)
      return
    }

    const onVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices()
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      _voicesCache = voices
      resolve(voices)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)

    // Some browsers never fire voiceschanged if voices were already ready;
    // fall back after a short wait so we don't hang forever.
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
      resolve(window.speechSynthesis.getVoices())
    }, 500)
  })
}

// Substrings that tend to indicate a higher-quality voice (cloud/neural
// voices, as opposed to a device's bare default robotic voice). Checked in
// order — first match wins.
const PREFERRED_VOICE_HINTS = ['Natural', 'Neural', 'Online', 'Google', 'Microsoft']

/**
 * Picks the best available voice for a given BCP-47 locale: prefers an exact
 * locale match with a "higher quality" name hint, then any exact locale
 * match, then any voice that at least matches the base language (e.g. "hi"
 * for "hi-IN"), else null (caller falls back to the browser's own default).
 */
function pickBestVoice(voices, locale) {
  if (!voices.length) return null

  const exactMatches = voices.filter((v) => v.lang === locale)
  const baseLang = locale.split('-')[0]
  const looseMatches = voices.filter((v) => v.lang?.split('-')[0] === baseLang)
  const pool = exactMatches.length ? exactMatches : looseMatches

  if (!pool.length) return null

  for (const hint of PREFERRED_VOICE_HINTS) {
    const match = pool.find((v) => v.name.includes(hint))
    if (match) return match
  }

  return pool[0]
}

/**
 * Starts listening for a single spoken utterance.
 * @param {string} languageKey - one of LANGUAGE_LOCALES keys
 * @param {{ onResult: (text: string) => void, onError: (errorCode: string) => void, onEnd?: () => void }} handlers
 *   onError receives 'not-allowed' for blocked mic access, otherwise a generic code — translate at the call site.
 * @returns {{ stop: () => void } | null} controller, or null if unsupported
 */
export function startListening(languageKey, { onResult, onError, onEnd }) {
  const SpeechRecognition = getSpeechRecognition()
  if (!SpeechRecognition) {
    onError('unsupported')
    return null
  }

  const recognition = new SpeechRecognition()
  recognition.lang = LANGUAGE_LOCALES[languageKey] || 'en-IN'
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript ?? ''
    onResult(transcript)
  }

  recognition.onerror = (event) => {
    onError(event.error === 'not-allowed' ? 'not-allowed' : 'no-speech')
  }

  if (onEnd) recognition.onend = onEnd

  recognition.start()
  return { stop: () => recognition.stop() }
}

/**
 * Reads text aloud using the browser's speechSynthesis, in the given language
 * where supported. Picks the best-quality voice available for that language
 * (preferring cloud/neural voices over the device's bare default) and uses a
 * slightly slower, calmer rate — clearer for a low-literacy audience than the
 * browser's default pace.
 * @param {string} text
 * @param {string} languageKey - one of LANGUAGE_LOCALES keys
 */
export async function speak(text, languageKey) {
  if (!isSpeechSynthesisSupported()) return

  const locale = LANGUAGE_LOCALES[languageKey] || 'en-IN'
  const voices = await getVoices()
  const bestVoice = pickBestVoice(voices, locale)

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = locale
  utterance.rate = 0.92
  utterance.pitch = 1
  if (bestVoice) utterance.voice = bestVoice
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel()
  }
}
