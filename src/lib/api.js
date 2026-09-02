const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function postJSON(path, body) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('network')
  }

  if (!response.ok) {
    const err = new Error('server')
    err.status = response.status
    throw err
  }

  return response.json()
}

async function getJSON(path) {
  let response
  try {
    response = await fetch(`${BASE_URL}${path}`)
  } catch {
    throw new Error('network')
  }

  if (!response.ok) {
    const err = new Error('server')
    err.status = response.status
    throw err
  }

  return response.json()
}

/**
 * @param {{ text?: string, language: string, mode: 'voice' | 'photo' | 'type' }} payload
 * @returns {Promise<{ claim_id: string, verdict: 'true'|'misleading'|'false'|'unverifiable', confidence: number, explanation: string, source_name: string, source_url: string }>}
 */
export function verifyClaim(payload) {
  return postJSON('/verify', payload)
}

/**
 * @param {string} claimId
 * @returns {Promise<{ status: string }>}
 */
export function flagClaim(claimId) {
  return postJSON('/flag', { claim_id: claimId })
}

/**
 * @returns {Promise<Array<{ claim_text: string, verdict: 'true'|'misleading'|'false'|'unverifiable', confidence: number, timestamp: string }>>}
 */
export function getRecentClaims() {
  return getJSON('/recent-claims')
}
