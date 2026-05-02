const BASE = import.meta.env.VITE_API_URL || '/api'
const KEY  = import.meta.env.VITE_API_KEY  || ''

const headers = () => ({
  'Content-Type': 'application/json',
  'X-API-Key': KEY,
})

export async function analyzeByDoi(doi) {
  const r = await fetch(`${BASE}/analyze/doi`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ doi }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${r.status}`)
  }
  return r.json()
}

export async function analyzeByText(text, doi = null) {
  const r = await fetch(`${BASE}/analyze/text`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ text, doi }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${r.status}`)
  }
  return r.json()
}
