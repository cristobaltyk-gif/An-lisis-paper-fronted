// src/PacientesApp.jsx — archivo completo

import { useState } from 'react'
import { pacientesQuery } from './api.js'

const EXAMPLES = [
  'Artrosis de rodilla',
  'Dolor lumbar crónico',
  'Tendinitis de hombro',
  'Fractura de cadera',
  'Síndrome del túnel carpiano',
  'Prótesis de rodilla',
]

const OXFORD_COLOR = {
  '1a':'#0f2942','1b':'#1a6bb5','2a':'#2980b9','2b':'#3498db',
  '3a':'#16a085','3b':'#1abc9c','4':'#e67e22','5':'#95a5a6'
}
const GRADE_COLOR = { Alta:'#1a6bb5', Moderada:'#16a085', Baja:'#e67e22', 'Muy baja':'#e74c3c' }

// ── Parsing markdown simple ───────────────────────────────────────
function parseMarkdown(text) {
  const lines = text.split('\n')
  const els = []
  let key = 0
  for (const line of lines) {
    if (line.startsWith('### ')) {
      els.push(
        <h3 key={key++} style={{
          fontSize: '.95rem', fontWeight: 700, color: '#0f2942',
          margin: '1.4rem 0 .5rem',
          borderLeft: '3px solid #52B788', paddingLeft: 10,
        }}>
          {line.replace('### ', '')}
        </h3>
      )
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      els.push(
        <li key={key++} style={{ marginLeft: '1.2rem', marginBottom: 4, color: '#334155', lineHeight: 1.65, fontSize: '.9rem' }}>
          {line.replace(/^[-•] /, '')}
        </li>
      )
    } else if (line.trim() === '') {
      els.push(<br key={key++} />)
    } else {
      els.push(
        <p key={key++} style={{ margin: '0 0 6px', color: '#334155', lineHeight: 1.7, fontSize: '.9rem' }}>
          {line}
        </p>
      )
    }
  }
  return els
}

// ── Componente paper badge ────────────────────────────────────────
function PaperBadge({ paper, index }) {
  const score = paper.puntuacion_calidad || 0
  const scoreColor = score >= 75 ? '#1a6bb5' : score >= 50 ? '#16a085' : score >= 30 ? '#e67e22' : '#e74c3c'

  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '.75rem 1rem',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: '50%',
        border: `3px solid ${scoreColor}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: '.78rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f2942', fontSize: '.82rem', lineHeight: 1.4 }}>
          {paper.titulo || 'Sin título'}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {paper.tipo_estudio && (
            <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 6, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700 }}>
              {paper.tipo_estudio}
            </span>
          )}
          {paper.nivel_evidencia_oxford && (
            <span style={{
              background: OXFORD_COLOR[paper.nivel_evidencia_oxford] || '#64748b',
              color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700,
            }}>
              Oxford {paper.nivel_evidencia_oxford}
            </span>
          )}
          {paper.calidad_grade && (
            <span style={{
              background: GRADE_COLOR[paper.calidad_grade] || '#64748b',
              color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700,
            }}>
              GRADE: {paper.calidad_grade}
            </span>
          )}
          {paper.doi && (
            <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer"
              style={{ color: '#2980b9', fontSize: '.68rem', textDecoration: 'none', padding: '2px 4px' }}>
              🔗 DOI
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────
function StepIndicator({ step }) {
  const steps = [
    { id: 1, label: 'Buscando papers en PubMed', icon: '🔍' },
    { id: 2, label: 'Analizando evidencia científica', icon: '🧬' },
    { id: 3, label: 'Generando respuesta para ti', icon: '✍️' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '1rem 0' }}>
      {steps.map(s => (
        <div key={s.id} style={{
          display: 'flex', gap: 10, alignItems: 'center',
          opacity: step >= s.id ? 1 : 0.3,
          transition: 'opacity .4s ease',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: step > s.id ? '#16a085' : step === s.id ? '#1a6bb5' : '#e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.75rem',
            transition: 'background .4s ease',
          }}>
            {step > s.id ? '✓' : s.icon}
          </div>
          <span style={{
            fontSize: '.85rem', fontWeight: step === s.id ? 700 : 500,
            color: step === s.id ? '#0f2942' : '#64748b',
          }}>
            {s.label}
            {step === s.id && (
              <span style={{ marginLeft: 6 }}>
                {['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'][Math.floor(Date.now() / 200) % 10]}
              </span>
            )}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── App principal ─────────────────────────────────────────────────
export default function PacientesApp() {
  const [query, setQuery]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [step, setStep]             = useState(0)
  const [papers, setPapers]         = useState([])
  const [response, setResponse]     = useState('')
  const [error, setError]           = useState('')
  const [hasResult, setHasResult]   = useState(false)

  async function handleSubmit(q) {
    const text = (q || query).trim()
    if (!text || loading) return

    setLoading(true)
    setStep(1)
    setPapers([])
    setResponse('')
    setError('')
    setHasResult(false)

    try {
      await pacientesQuery(text, {
        onPapersMeta: (papersData) => {
          setPapers(papersData)
          setStep(3)
        },
        onText: (chunk) => {
          setStep(3)
          setResponse(prev => prev + chunk)
        },
        onSearching: () => setStep(1),
        onAnalyzing: () => setStep(2),
      })
      setHasResult(true)
    } catch (e) {
      setError(e.message || 'Error al procesar tu consulta.')
    } finally {
      setLoading(false)
      setStep(0)
    }
  }

  function reset() {
    setQuery('')
    setPapers([])
    setResponse('')
    setError('')
    setHasResult(false)
    setStep(0)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f0faf5 0%, #e8f5ee 50%, #f5faf7 100%)',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      <style>{`
        * { box-sizing: border-box; }
        .pill:hover { background: #2D6A4F !important; color: white !important; }
        .pill { transition: all .2s ease !important; cursor: pointer; }
        textarea:focus { outline: none; border-color: #2D6A4F !important; }
      `}</style>

      {/* Header */}
      <header style={{
        background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(82,183,136,.2)',
        padding: '0 20px', position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'linear-gradient(135deg, #2D6A4F, #52B788)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(45,106,79,.3)',
          }}>🌿</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a3a2a' }}>Tu Salud en Simple</div>
            <div style={{ fontSize: '.73rem', color: '#52B788', fontWeight: 500 }}>Instituto de Cirugía Articular · Basado en evidencia científica real</div>
          </div>
          {hasResult && (
            <button onClick={reset} style={{
              marginLeft: 'auto', padding: '.4rem .9rem',
              border: '1.5px solid #b7dfc9', borderRadius: 20,
              background: 'transparent', color: '#2D6A4F',
              fontSize: '.8rem', fontWeight: 600, cursor: 'pointer',
            }}>← Nueva consulta</button>
          )}
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 60px' }}>

        {/* Landing */}
        {!hasResult && !loading && (
          <div style={{ paddingTop: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🩺</div>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800,
              color: '#1a3a2a', marginBottom: 10, lineHeight: 1.25,
            }}>
              ¿Qué dice la ciencia<br />sobre tu diagnóstico?
            </h1>
            <p style={{ color: '#4a7a5a', fontSize: '1rem', lineHeight: 1.65, maxWidth: 480, margin: '0 auto 32px' }}>
              Buscamos en la literatura médica mundial y te explicamos en palabras simples qué dice la evidencia sobre tu condición.
            </p>

            {/* Disclaimer */}
            <div style={{
              background: 'rgba(255,255,255,.7)', border: '1px solid #d8ede5',
              borderRadius: 12, padding: '12px 18px', marginBottom: 32,
              fontSize: '.8rem', color: '#4a7a5a', lineHeight: 1.5,
            }}>
              ⚠️ Esta herramienta es <strong>educativa</strong> y no reemplaza la consulta médica.
            </div>

            {/* Examples */}
            <p style={{ fontSize: '.78rem', color: '#6a9a7a', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Condiciones frecuentes
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
              {EXAMPLES.map(ex => (
                <button key={ex} className="pill" onClick={() => { setQuery(ex); handleSubmit(ex) }}
                  style={{
                    background: 'white', border: '1.5px solid #b7dfc9',
                    color: '#2D6A4F', borderRadius: 24, padding: '7px 16px',
                    fontSize: '.85rem', fontWeight: 500,
                  }}>
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {!hasResult && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '1.25rem',
            boxShadow: '0 2px 16px rgba(45,106,79,.08)',
            border: '1px solid #d8ede5', marginBottom: '1.5rem',
          }}>
            <label style={{ display: 'block', fontWeight: 700, color: '#1a3a2a', fontSize: '.85rem', marginBottom: 8 }}>
              Tu diagnóstico o condición
            </label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() } }}
              placeholder="Ej: artrosis de rodilla, dolor lumbar, tendinitis de hombro..."
              rows={2}
              style={{
                width: '100%', border: '1.5px solid #d8ede5', borderRadius: 10,
                padding: '.75rem 1rem', fontSize: '.95rem', fontFamily: 'inherit',
                resize: 'none', color: '#1a3a2a', lineHeight: 1.5,
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={loading || !query.trim()}
              style={{
                marginTop: 12, width: '100%', padding: '.85rem',
                border: 'none', borderRadius: 10,
                background: loading || !query.trim()
                  ? '#b7dfc9'
                  : 'linear-gradient(135deg, #2D6A4F, #52B788)',
                color: 'white', fontSize: '1rem', fontWeight: 700,
                cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                boxShadow: loading || !query.trim() ? 'none' : '0 4px 14px rgba(45,106,79,.3)',
              }}>
              🔬 Buscar evidencia científica
            </button>
          </div>
        )}

        {/* Loading steps */}
        {loading && (
          <div style={{
            background: 'white', borderRadius: 16, padding: '1.5rem',
            boxShadow: '0 2px 16px rgba(45,106,79,.08)', border: '1px solid #d8ede5',
            marginBottom: '1.5rem',
          }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, color: '#1a3a2a', fontSize: '.9rem' }}>
              Consultando: <em style={{ color: '#2D6A4F' }}>{query}</em>
            </p>
            <StepIndicator step={step} />
            {papers.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ margin: '0 0 8px', fontSize: '.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  {papers.length} papers analizados
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {papers.map((p, i) => <PaperBadge key={i} paper={p} index={i} />)}
                </div>
              </div>
            )}
            {response && (
              <div style={{ marginTop: 20, borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
                {parseMarkdown(response)}
              </div>
            )}
          </div>
        )}

        {/* Resultado final */}
        {hasResult && (
          <div style={{ paddingTop: 24 }}>
            {/* Papers usados */}
            {papers.length > 0 && (
              <div style={{
                background: 'white', borderRadius: 16, padding: '1.25rem',
                boxShadow: '0 2px 12px rgba(45,106,79,.07)', border: '1px solid #d8ede5',
                marginBottom: '1rem',
              }}>
                <p style={{ margin: '0 0 12px', fontSize: '.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                  🔬 Basado en {papers.length} publicaciones científicas
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {papers.map((p, i) => <PaperBadge key={i} paper={p} index={i} />)}
                </div>
              </div>
            )}

            {/* Respuesta */}
            <div style={{
              background: 'white', borderRadius: 16, padding: '1.5rem',
              boxShadow: '0 2px 12px rgba(45,106,79,.07)', border: '1px solid #d8ede5',
            }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #52B788, #95D5B2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                }}>🩺</div>
                <div>
                  <div style={{ fontWeight: 700, color: '#1a3a2a', fontSize: '.9rem' }}>Respuesta basada en evidencia</div>
                  <div style={{ fontSize: '.73rem', color: '#52B788' }}>Instituto de Cirugía Articular · ICA Chile</div>
                </div>
              </div>
              {parseMarkdown(response)}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: 12, padding: '1rem', color: '#dc2626', fontSize: '.88rem',
          }}>
            ⚠️ {error}
          </div>
        )}

      </main>
    </div>
  )
}
