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

function getConfiabilidad(score) {
  if (score === null || score === undefined) return null
  if (score >= 75) return {
    emoji: '🟢', label: 'Muy confiable',
    sub: 'Estudios de alta calidad lo respaldan',
    color: '#16a085', bg: '#e6f7f3', border: '#b7dfc9',
  }
  if (score >= 50) return {
    emoji: '🟡', label: 'Moderadamente confiable',
    sub: 'Hay evidencia con algunas limitaciones',
    color: '#b7800a', bg: '#fffbeb', border: '#fde68a',
  }
  if (score >= 30) return {
    emoji: '🟠', label: 'Evidencia limitada',
    sub: 'Pocos estudios o calidad moderada',
    color: '#c05621', bg: '#fff7ed', border: '#fed7aa',
  }
  return {
    emoji: '🔴', label: 'Evidencia insuficiente',
    sub: 'Tema poco estudiado en la literatura',
    color: '#dc2626', bg: '#fef2f2', border: '#fecaca',
  }
}

function ConfiabilidadBadge({ score }) {
  const info = getConfiabilidad(score)
  if (!info) return null
  return (
    <div style={{
      background: info.bg, border: `1.5px solid ${info.border}`,
      borderRadius: 14, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 14, marginBottom: '1rem',
    }}>
      <span style={{ fontSize: '1.8rem', lineHeight: 1 }}>{info.emoji}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, color: info.color, fontSize: '.95rem' }}>{info.label}</div>
        <div style={{ fontSize: '.78rem', color: '#64748b', marginTop: 2 }}>{info.sub}</div>
      </div>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: `3px solid ${info.color}`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ fontSize: '1rem', fontWeight: 800, color: info.color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: '.5rem', color: '#94a3b8', textTransform: 'uppercase' }}>/ 100</span>
      </div>
    </div>
  )
}

function parseMarkdown(text) {
  const lines = text.split('\n')
  const els = []
  let key = 0
  for (const line of lines) {
    if (line.startsWith('### ')) {
      els.push(<h3 key={key++} style={{ fontSize: '.95rem', fontWeight: 700, color: '#0f2942', margin: '1.4rem 0 .5rem', borderLeft: '3px solid #52B788', paddingLeft: 10 }}>{line.replace('### ', '')}</h3>)
    } else if (line.startsWith('- ') || line.startsWith('• ')) {
      els.push(<li key={key++} style={{ marginLeft: '1.2rem', marginBottom: 4, color: '#334155', lineHeight: 1.65, fontSize: '.9rem' }}>{line.replace(/^[-•] /, '').replace(/\*\*/g, '')}</li>)
    } else if (line.trim() === '') {
      els.push(<br key={key++} />)
    } else {
      els.push(<p key={key++} style={{ margin: '0 0 6px', color: '#334155', lineHeight: 1.7, fontSize: '.9rem' }}>{line.replace(/\*\*/g, '')}</p>)
    }
  }
  return els
}

function PaperBadge({ paper }) {
  const score = paper.puntuacion_calidad || 0
  const scoreColor = score >= 75 ? '#1a6bb5' : score >= 50 ? '#16a085' : score >= 30 ? '#e67e22' : '#e74c3c'
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '.75rem 1rem', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: `3px solid ${scoreColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ fontSize: '.78rem', fontWeight: 800, color: scoreColor }}>{score}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#0f2942', fontSize: '.82rem', lineHeight: 1.4 }}>{paper.titulo || 'Sin título'}</p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
          {paper.tipo_estudio && <span style={{ background: '#e0f2fe', color: '#0369a1', borderRadius: 6, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700 }}>{paper.tipo_estudio}</span>}
          {paper.nivel_evidencia_oxford && <span style={{ background: OXFORD_COLOR[paper.nivel_evidencia_oxford] || '#64748b', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700 }}>Oxford {paper.nivel_evidencia_oxford}</span>}
          {paper.calidad_grade && <span style={{ background: GRADE_COLOR[paper.calidad_grade] || '#64748b', color: '#fff', borderRadius: 6, padding: '2px 8px', fontSize: '.68rem', fontWeight: 700 }}>GRADE: {paper.calidad_grade}</span>}
          {paper.doi && <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" style={{ color: '#2980b9', fontSize: '.68rem', textDecoration: 'none' }}>🔗 DOI</a>}
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ step }) {
  const steps = [
    { id: 1, label: 'Buscando papers en PubMed', icon: '🔍' },
    { id: 2, label: 'Analizando evidencia científica', icon: '🧬' },
    { id: 3, label: 'Generando respuesta para ti', icon: '✍️' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '.75rem 0' }}>
      {steps.map(s => (
        <div key={s.id} style={{ display: 'flex', gap: 10, alignItems: 'center', opacity: step >= s.id ? 1 : 0.3, transition: 'opacity .4s ease' }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: step > s.id ? '#16a085' : step === s.id ? '#1a6bb5' : '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem' }}>
            {step > s.id ? '✓' : s.icon}
          </div>
          <span style={{ fontSize: '.83rem', fontWeight: step === s.id ? 700 : 500, color: step === s.id ? '#0f2942' : '#64748b' }}>{s.label}</span>
        </div>
      ))}
    </div>
  )
}

function ConsultaBlock({ consulta }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ background: 'linear-gradient(135deg, #2D6A4F, #52B788)', color: 'white', borderRadius: '18px 18px 4px 18px', padding: '10px 16px', maxWidth: '80%', fontSize: '.92rem', lineHeight: 1.5, boxShadow: '0 2px 8px rgba(45,106,79,.25)' }}>
          {consulta.query}
        </div>
      </div>

      {consulta.loading && (
        <div style={{ background: 'white', borderRadius: 14, padding: '1rem 1.25rem', border: '1px solid #d8ede5' }}>
          <StepIndicator step={consulta.step} />
          {consulta.papers?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <p style={{ margin: '0 0 8px', fontSize: '.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{consulta.papers.length} papers analizados</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{consulta.papers.map((p, i) => <PaperBadge key={i} paper={p} />)}</div>
            </div>
          )}
          {consulta.response && <div style={{ marginTop: 16, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>{parseMarkdown(consulta.response)}</div>}
        </div>
      )}

      {!consulta.loading && consulta.papers?.length > 0 && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #d8ede5', overflow: 'hidden', boxShadow: '0 2px 10px rgba(45,106,79,.06)' }}>
          <div style={{ padding: '1rem 1.25rem 0' }}>
            <ConfiabilidadBadge score={consulta.score_ponderado} />
          </div>
          <div style={{ padding: '0 1.25rem 1rem', borderBottom: '1px solid #f0f4f8' }}>
            <p style={{ margin: '0 0 8px', fontSize: '.73rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.05em' }}>🔬 {consulta.papers.length} publicaciones científicas analizadas</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{consulta.papers.map((p, i) => <PaperBadge key={i} paper={p} />)}</div>
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #52B788, #95D5B2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.95rem' }}>🩺</div>
              <span style={{ fontWeight: 700, color: '#1a3a2a', fontSize: '.85rem' }}>Respuesta basada en evidencia</span>
            </div>
            {parseMarkdown(consulta.response)}
          </div>
        </div>
      )}

      {!consulta.loading && consulta.error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem', color: '#dc2626', fontSize: '.88rem' }}>⚠️ {consulta.error}</div>
      )}
    </div>
  )
}

export default function PacientesApp() {
  const [query, setQuery]                 = useState('')
  const [consultas, setConsultas]         = useState([])
  const [followUp, setFollowUp]           = useState('')
  const [hasStarted, setHasStarted]       = useState(false)
  const [globalLoading, setGlobalLoading] = useState(false)

  async function runQuery(text) {
    if (!text.trim() || globalLoading) return
    const id = Date.now()
    setGlobalLoading(true)
    setHasStarted(true)
    setConsultas(prev => [...prev, { id, query: text, loading: true, step: 1, papers: [], response: '', error: '', score_ponderado: null }])
    const update = (patch) => setConsultas(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
    try {
      await pacientesQuery(text, {
        onSearching: () => update({ step: 1 }),
        onAnalyzing: () => update({ step: 2 }),
        onPapersMeta: (papers, score_ponderado) => update({ papers, score_ponderado, step: 3 }),
        onText: (chunk) => {
          update({ step: 3 })
          setConsultas(prev => prev.map(c => c.id === id ? { ...c, response: c.response + chunk } : c))
        },
      })
      update({ loading: false })
    } catch (e) {
      update({ loading: false, error: e.message || 'Error al procesar la consulta.' })
    }
    setGlobalLoading(false)
  }

  function handleInitial() { const t = query.trim(); if (!t) return; setQuery(''); runQuery(t) }
  function handleFollowUp() { const t = followUp.trim(); if (!t) return; setFollowUp(''); runQuery(t) }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #f0faf5 0%, #e8f5ee 50%, #f5faf7 100%)', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`* { box-sizing: border-box; } .pill:hover { background: #2D6A4F !important; color: white !important; } .pill { transition: all .2s ease !important; cursor: pointer; } textarea:focus, input:focus { outline: none; }`}</style>

      <header style={{ background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(82,183,136,.2)', padding: '0 20px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #2D6A4F, #52B788)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(45,106,79,.3)' }}>🌿</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1a3a2a' }}>Tu Salud en Simple</div>
            <div style={{ fontSize: '.73rem', color: '#52B788', fontWeight: 500 }}>Instituto de Cirugía Articular · Basado en evidencia científica real</div>
          </div>
          {hasStarted && <button onClick={() => { setConsultas([]); setHasStarted(false); setQuery('') }} style={{ marginLeft: 'auto', padding: '.4rem .9rem', border: '1.5px solid #b7dfc9', borderRadius: 20, background: 'transparent', color: '#2D6A4F', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}>← Nueva consulta</button>}
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '0 16px 120px' }}>
        {!hasStarted && (
          <div style={{ paddingTop: 48, textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🩺</div>
            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, color: '#1a3a2a', marginBottom: 10, lineHeight: 1.25 }}>¿Qué dice la ciencia<br />sobre tu diagnóstico?</h1>
            <p style={{ color: '#4a7a5a', fontSize: '1rem', lineHeight: 1.65, maxWidth: 480, margin: '0 auto 32px' }}>Buscamos en la literatura médica mundial y te explicamos en palabras simples qué dice la evidencia sobre tu condición.</p>
            <div style={{ background: 'rgba(255,255,255,.7)', border: '1px solid #d8ede5', borderRadius: 12, padding: '12px 18px', marginBottom: 32, fontSize: '.8rem', color: '#4a7a5a', lineHeight: 1.5 }}>⚠️ Esta herramienta es <strong>educativa</strong> y no reemplaza la consulta médica.</div>
            <p style={{ fontSize: '.78rem', color: '#6a9a7a', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Condiciones frecuentes</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
              {EXAMPLES.map(ex => <button key={ex} className="pill" onClick={() => runQuery(ex)} style={{ background: 'white', border: '1.5px solid #b7dfc9', color: '#2D6A4F', borderRadius: 24, padding: '7px 16px', fontSize: '.85rem', fontWeight: 500 }}>{ex}</button>)}
            </div>
            <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem', boxShadow: '0 2px 16px rgba(45,106,79,.08)', border: '1px solid #d8ede5' }}>
              <label style={{ display: 'block', fontWeight: 700, color: '#1a3a2a', fontSize: '.85rem', marginBottom: 8 }}>Tu diagnóstico o condición</label>
              <textarea value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInitial() } }} placeholder="Ej: artrosis de rodilla, dolor lumbar, tendinitis de hombro..." rows={2} style={{ width: '100%', border: '1.5px solid #d8ede5', borderRadius: 10, padding: '.75rem 1rem', fontSize: '.95rem', fontFamily: 'inherit', resize: 'none', color: '#1a3a2a', lineHeight: 1.5, outline: 'none' }} />
              <button onClick={handleInitial} disabled={!query.trim()} style={{ marginTop: 12, width: '100%', padding: '.85rem', border: 'none', borderRadius: 10, background: !query.trim() ? '#b7dfc9' : 'linear-gradient(135deg, #2D6A4F, #52B788)', color: 'white', fontSize: '1rem', fontWeight: 700, cursor: !query.trim() ? 'not-allowed' : 'pointer' }}>🔬 Buscar evidencia científica</button>
            </div>
          </div>
        )}

        {consultas.length > 0 && <div style={{ paddingTop: 24 }}>{consultas.map(c => <ConsultaBlock key={c.id} consulta={c} />)}</div>}
      </main>

      {hasStarted && !globalLoading && consultas.some(c => !c.loading) && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(82,183,136,.15)', padding: '12px 16px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, background: 'white', border: '1.5px solid #b7dfc9', borderRadius: 20, padding: '10px 16px', boxShadow: '0 2px 12px rgba(45,106,79,.08)' }}>
              <input value={followUp} onChange={e => setFollowUp(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleFollowUp() } }} placeholder="Pregunta algo más... ej: ¿sirve el ácido hialurónico?" disabled={globalLoading} style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '.92rem', color: '#1a3a2a', fontFamily: 'inherit' }} />
            </div>
            <button onClick={handleFollowUp} disabled={globalLoading || !followUp.trim()} style={{ width: 44, height: 44, borderRadius: '50%', border: 'none', background: globalLoading || !followUp.trim() ? '#b7dfc9' : '#2D6A4F', color: 'white', fontSize: '1.1rem', cursor: globalLoading || !followUp.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {globalLoading ? '⏳' : '➤'}
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '.7rem', color: '#8ab89a', margin: '6px 0 0' }}>Cada pregunta busca nueva evidencia científica · ICA Chile</p>
        </div>
      )}
    </div>
  )
}
