import { useState } from 'react'
import { analyzeByDoi, analyzeByText } from './api.js'

// ── Colores ───────────────────────────────────────────────────────
const C = {
  navy:    '#0f2942',
  blue:    '#1a6bb5',
  blue2:   '#2980b9',
  teal:    '#16a085',
  orange:  '#e67e22',
  red:     '#e74c3c',
  gray:    '#64748b',
  light:   '#f0f4f8',
  white:   '#ffffff',
}

const OXFORD_COLOR = {
  '1a': C.navy, '1b': C.blue, '2a': C.blue2, '2b': '#3498db',
  '3a': C.teal, '3b': '#1abc9c', '4': C.orange, '5': '#95a5a6',
}
const GRADE_COLOR   = { A: C.navy, B: C.blue2, C: C.orange, D: C.red }
const QUALITY_COLOR = { Alta: C.blue, Moderada: C.teal, Baja: C.orange, 'Muy baja': C.red }

// ── UI Atoms ─────────────────────────────────────────────────────
const s = {
  card: {
    background: C.white, borderRadius: 16,
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    padding: '1.25rem', marginBottom: '1rem',
  },
  sectionTitle: {
    margin: '0 0 .75rem', color: C.navy, fontSize: '.85rem',
    fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  body: { margin: 0, color: '#1e293b', lineHeight: 1.8, fontSize: '.9rem' },
}

function Badge({ label, value, color }) {
  return (
    <span style={{
      background: color, borderRadius: 8, padding: '3px 10px',
      display: 'inline-flex', alignItems: 'center', gap: 5,
    }}>
      <span style={{ color: 'rgba(255,255,255,.65)', fontSize: '.7rem' }}>{label}:</span>
      <span style={{ color: '#fff', fontWeight: 700, fontSize: '.8rem' }}>{value}</span>
    </span>
  )
}

function Chip({ label, value }) {
  return (
    <span style={{
      background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
      padding: '3px 12px', display: 'inline-flex', gap: 5, alignItems: 'center',
    }}>
      <span style={{ color: '#94a3b8', fontSize: '.72rem', fontWeight: 600 }}>{label}:</span>
      <span style={{ color: '#334155', fontSize: '.8rem', fontWeight: 700 }}>{value}</span>
    </span>
  )
}

function Section({ icon, title, children }) {
  return (
    <div style={s.card}>
      <h3 style={s.sectionTitle}><span>{icon}</span>{title}</h3>
      {children}
    </div>
  )
}

// ── Input Panel ───────────────────────────────────────────────────
function InputPanel({ onResult }) {
  const [mode, setMode]       = useState('doi')   // 'doi' | 'text'
  const [doi, setDoi]         = useState('')
  const [text, setText]       = useState('')
  const [textDoi, setTextDoi] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus]   = useState('')
  const [error, setError]     = useState('')

  const canSubmit = mode === 'doi' ? doi.trim().length > 5 : text.trim().length > 100

  async function submit() {
    setLoading(true); setError(''); setStatus('Consultando...')
    try {
      let result
      if (mode === 'doi') {
        setStatus('Buscando en CrossRef y Unpaywall...')
        result = await analyzeByDoi(doi.trim())
      } else {
        setStatus('Enviando texto a Claude...')
        result = await analyzeByText(text.trim(), textDoi.trim() || null)
      }
      setStatus('¡Listo!')
      onResult(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false); setStatus('')
    }
  }

  const tabStyle = (active) => ({
    flex: 1, padding: '.6rem', border: 'none', cursor: 'pointer',
    borderRadius: 10, fontWeight: 700, fontSize: '.85rem',
    background: active ? C.navy : 'transparent',
    color: active ? '#fff' : C.gray,
    transition: 'all .2s',
  })

  const inputStyle = {
    width: '100%', padding: '.75rem 1rem', boxSizing: 'border-box',
    border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: '.9rem',
    fontFamily: "'Georgia', serif", outline: 'none', color: '#1e293b',
    background: '#fff',
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Mode Tabs */}
      <div style={{
        display: 'flex', gap: 6, background: '#e2e8f0',
        borderRadius: 12, padding: 4, marginBottom: '1.5rem',
      }}>
        <button style={tabStyle(mode === 'doi')}  onClick={() => { setMode('doi');  setError('') }}>
          🔗 Por DOI
        </button>
        <button style={tabStyle(mode === 'text')} onClick={() => { setMode('text'); setError('') }}>
          📝 Por Texto
        </button>
      </div>

      {mode === 'doi' ? (
        <div>
          <label style={{ display: 'block', fontWeight: 700, color: C.navy, fontSize: '.85rem', marginBottom: 8 }}>
            DOI del artículo
          </label>
          <input
            value={doi}
            onChange={e => { setDoi(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && canSubmit && submit()}
            placeholder="10.1056/NEJMoa1302413  ó  https://doi.org/10.1056/..."
            style={inputStyle}
            onFocus={e => e.target.style.borderColor = C.blue2}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
          />
          <p style={{ margin: '6px 0 0', color: C.gray, fontSize: '.78rem' }}>
            El backend busca automáticamente el paper en CrossRef y Unpaywall (open access).
          </p>
        </div>
      ) : (
        <div>
          <label style={{ display: 'block', fontWeight: 700, color: C.navy, fontSize: '.85rem', marginBottom: 8 }}>
            Pega el abstract o texto del paper
          </label>
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError('') }}
            placeholder="Pega aquí el abstract, introducción, métodos o texto completo..."
            rows={8}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            onFocus={e => e.target.style.borderColor = C.blue2}
            onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
          />
          <input
            value={textDoi}
            onChange={e => setTextDoi(e.target.value)}
            placeholder="DOI (opcional)"
            style={{ ...inputStyle, marginTop: 8, fontSize: '.82rem' }}
          />
        </div>
      )}

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 10, padding: '.75rem 1rem', marginTop: '1rem',
          color: '#dc2626', fontSize: '.85rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={submit}
        disabled={loading || !canSubmit}
        style={{
          marginTop: '1.5rem', width: '100%', padding: '1rem', border: 'none',
          borderRadius: 12, fontSize: '1rem', fontWeight: 700, cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
          background: loading || !canSubmit
            ? '#94a3b8'
            : `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
          color: '#fff',
          boxShadow: loading || !canSubmit ? 'none' : '0 4px 15px rgba(15,76,129,.3)',
        }}
      >
        {loading ? `⚙️ ${status}` : '🔍 Analizar Paper'}
      </button>

      {/* Feature chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: '1.25rem', justifyContent: 'center' }}>
        {['Oxford', 'GRADE', 'PICO', 'Contexto Chile', 'Crítica científica'].map(f => (
          <span key={f} style={{
            background: '#e0f2fe', color: '#0369a1',
            borderRadius: 20, padding: '3px 11px', fontSize: '.72rem', fontWeight: 600,
          }}>✓ {f}</span>
        ))}
      </div>
    </div>
  )
}

// ── Result Panel ──────────────────────────────────────────────────
function ResultPanel({ result, onReset }) {
  const score = result.puntuacion_calidad ?? 0
  const scoreColor = score >= 75 ? C.blue : score >= 50 ? C.teal : score >= 30 ? C.orange : C.red

  return (
    <div>
      {/* Header Card */}
      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-block', background: '#e0f2fe', color: '#0369a1',
              borderRadius: 6, padding: '2px 10px', fontSize: '.72rem',
              fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
            }}>{result.categoria}</span>

            <h2 style={{ margin: '0 0 6px', color: C.navy, fontSize: '1.15rem', lineHeight: 1.4 }}>
              {result.titulo}
            </h2>
            <p style={{ margin: 0, color: C.gray, fontSize: '.82rem' }}>
              {result.autores} · {result.revista}
            </p>
            {result.doi && (
              <a
                href={`https://doi.org/${result.doi}`}
                target="_blank" rel="noreferrer"
                style={{ fontSize: '.75rem', color: C.blue2, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}
              >
                🔗 doi.org/{result.doi}
              </a>
            )}
          </div>

          {/* Score ring */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              border: `5px solid ${scoreColor}`,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '1.35rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{score}</span>
              <span style={{ fontSize: '.52rem', color: '#94a3b8', textTransform: 'uppercase' }}>calidad</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: '1rem' }}>
          <Badge label="Oxford"         value={result.nivel_evidencia_oxford}              color={OXFORD_COLOR[result.nivel_evidencia_oxford] || C.gray} />
          <Badge label="Recomendación"  value={`Grado ${result.grado_recomendacion}`}      color={GRADE_COLOR[result.grado_recomendacion]   || C.gray} />
          <Badge label="GRADE"          value={result.calidad_grade}                        color={QUALITY_COLOR[result.calidad_grade]        || C.gray} />
          <Badge label="Diseño"         value={result.tipo_estudio}                         color="#475569" />
          <Badge label="Fuente"         value={result.fuente === 'fulltext' ? '📄 Texto completo' : '📋 Abstract'} color={result.fuente === 'fulltext' ? C.teal : C.orange} />
        </div>
      </div>

      {/* PICO */}
      <Section icon="🎯" title="Marco PICO">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 10 }}>
          {[
            { k: 'P', label: 'Población',    val: result.pico?.poblacion },
            { k: 'I', label: 'Intervención', val: result.pico?.intervencion },
            { k: 'C', label: 'Comparador',   val: result.pico?.comparador },
            { k: 'O', label: 'Outcome',      val: result.pico?.outcome },
          ].map(({ k, label, val }) => (
            <div key={k} style={{ background: '#f8fafc', borderRadius: 10, padding: '.75rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                <span style={{ background: C.navy, color: '#fff', borderRadius: 6, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.75rem' }}>{k}</span>
                <span style={{ fontWeight: 700, color: C.navy, fontSize: '.78rem' }}>{label}</span>
              </div>
              <p style={{ margin: 0, color: '#475569', fontSize: '.82rem', lineHeight: 1.5 }}>{val || '—'}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Resumen */}
      <Section icon="📋" title="Resumen Ejecutivo">
        <p style={s.body}>{result.resumen_ejecutivo}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          {result.tamano_muestra && <Chip label="N"            value={result.tamano_muestra} />}
          {result.seguimiento    && <Chip label="Seguimiento"  value={result.seguimiento}    />}
        </div>
      </Section>

      {/* Hallazgos */}
      <Section icon="🔑" title="Hallazgos Clave">
        {result.hallazgos_clave?.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 9, alignItems: 'flex-start' }}>
            <span style={{ background: C.navy, color: '#fff', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.68rem', fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{i + 1}</span>
            <p style={{ margin: 0, color: '#334155', lineHeight: 1.6, fontSize: '.88rem' }}>{h}</p>
          </div>
        ))}
      </Section>

      {/* Limitaciones */}
      <Section icon="⚠️" title="Limitaciones">
        {result.limitaciones?.map((l, i) => (
          <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, alignItems: 'flex-start' }}>
            <span style={{ color: C.orange, flexShrink: 0, marginTop: 3 }}>▸</span>
            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6, fontSize: '.88rem' }}>{l}</p>
          </div>
        ))}
      </Section>

      {/* Aplicabilidad */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
        <Section icon="🏥" title="Aplicabilidad Clínica">
          <p style={s.body}>{result.aplicabilidad_clinica}</p>
        </Section>
        <Section icon="🇨🇱" title="Contexto Chile / LATAM">
          <p style={s.body}>{result.aplicabilidad_chile}</p>
        </Section>
      </div>

      {/* Crítica */}
      <Section icon="🧠" title="Evaluación Crítica">
        <div style={{ background: `linear-gradient(135deg, ${C.navy}, #1a4a7a)`, borderRadius: 12, padding: '1.25rem' }}>
          <p style={{ margin: 0, color: 'rgba(255,255,255,.9)', lineHeight: 1.8, fontSize: '.92rem', fontStyle: 'italic' }}>
            "{result.conclusion_critica}"
          </p>
        </div>
      </Section>

      {/* Oxford info */}
      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 20 }}>ℹ️</span>
        <div>
          <p style={{ margin: '0 0 2px', fontWeight: 700, color: '#0369a1', fontSize: '.83rem' }}>
            Nivel de Evidencia Oxford {result.nivel_evidencia_oxford}
          </p>
          <p style={{ margin: 0, color: '#0c4a6e', fontSize: '.83rem' }}>{result.nivel_evidencia_descripcion}</p>
        </div>
      </div>

      <button onClick={onReset} style={{
        width: '100%', padding: '.9rem', border: 'none', borderRadius: 12,
        background: `linear-gradient(135deg, ${C.navy}, ${C.blue})`,
        color: '#fff', fontSize: '.95rem', fontWeight: 700, cursor: 'pointer',
        boxShadow: '0 4px 15px rgba(15,76,129,.3)',
      }}>
        ← Analizar otro paper
      </button>
    </div>
  )
}

// ── App Root ──────────────────────────────────────────────────────
export default function App() {
  const [result, setResult] = useState(null)

  return (
    <div style={{ minHeight: '100vh', background: C.light, fontFamily: "'Georgia', serif" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.navy} 0%, #1a4a7a 60%, #0f4c81 100%)`,
        padding: '1.5rem 2rem', borderBottom: '4px solid #2980b9',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10,
            background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>🔬</div>
          <div>
            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontWeight: 700 }}>EvidenciaMed</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,.55)', fontSize: '.68rem', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Analizador Crítico de Literatura Científica · Clever Salud / ICA
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {result
          ? <ResultPanel result={result} onReset={() => setResult(null)} />
          : <InputPanel  onResult={setResult} />
        }
      </div>
    </div>
  )
          }
          
