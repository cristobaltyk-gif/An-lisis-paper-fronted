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

export async function pacientesQuery(query, { onPapersMeta, onText, onSearching, onAnalyzing } = {}) {
  onSearching?.()

  const r = await fetch(`${BASE}/pacientes/chat`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query }),
  })

  if (!r.ok) {
    const err = await r.json().catch(() => ({}))
    throw new Error(err.detail || `Error ${r.status}`)
  }

  const reader = r.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') return

      try {
        const parsed = JSON.parse(raw)
        if (parsed.type === 'papers_meta') {
          onAnalyzing?.()
          onPapersMeta?.(parsed.papers, parsed.score_ponderado ?? null)
        } else if (parsed.type === 'text') {
          onText?.(parsed.text)
        }
      } catch {
        // chunk inválido, ignorar
      }
    }
  }
}
