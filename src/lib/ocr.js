import { createWorker } from 'tesseract.js'

// Maps our language keys (matching LanguageGrid) to Tesseract's trained-data
// language codes. OCR runs entirely client-side — no image or extracted text
// is sent anywhere until the user submits the resulting text for verification.
export const OCR_LANGUAGES = {
  en: 'eng',
  hi: 'hin',
  ta: 'tam',
  te: 'tel',
  bn: 'ben',
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

export function isImageFile(file) {
  return file && file.type?.startsWith('image/')
}

export function isFileTooLarge(file) {
  return file && file.size > MAX_FILE_SIZE_BYTES
}

/**
 * Extracts text from an image file using Tesseract.js, entirely in the browser.
 * @param {File} file
 * @param {string} languageKey - one of OCR_LANGUAGES keys
 * @param {(progress: number) => void} [onProgress] - 0 to 1
 * @returns {Promise<string>} the extracted, trimmed text
 */
export async function extractTextFromImage(file, languageKey, onProgress) {
  const tesseractLang = OCR_LANGUAGES[languageKey] || 'eng'

  const worker = await createWorker(tesseractLang, undefined, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(m.progress)
      }
    },
  })

  try {
    const {
      data: { text },
    } = await worker.recognize(file)
    return text.trim()
  } finally {
    await worker.terminate()
  }
}
