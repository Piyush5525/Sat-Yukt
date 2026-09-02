/**
 * Central config. Only EXPO_PUBLIC_* vars may be read here — anything else
 * would be undefined at runtime anyway since Expo strips non-public env vars
 * from the client bundle. All real secrets (Gemini, Twilio, Wispr) live in
 * backend/.env and are never referenced from this file or anywhere in src/.
 */
const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  // Fail loud at startup rather than silently hitting undefined/undefined and
  // producing a confusing network error deep in a voice-recording flow.
  console.warn(
    "[Sat-Yukt] EXPO_PUBLIC_BACKEND_URL is not set. Copy .env.example to .env " +
      "and point it at your local backend's LAN address."
  );
}

export const CONFIG = {
  backendUrl: BACKEND_URL ?? "http://localhost:4000",
  requestTimeoutMs: 20000,
  maxRecordingSeconds: 60,
  asyncStorageKeys: {
    history: "@satyukt/history",
    languagePreference: "@satyukt/language",
    languageModeAuto: "@satyukt/language_mode_auto",
    userPhone: "@satyukt/user_phone",
    onboardingComplete: "@satyukt/onboarding_complete",
    userLocation: "@satyukt/user_location",
  },
} as const;
