import { useState, useEffect } from 'react'
import { analyzeByDoi, analyzeByText } from './api.js'

const BASE = import.meta.env.VITE_API_URL || '/api'
const KEY  = import.meta.env.VITE_API_KEY  || ''

const headers = () => ({ 'Content-Type': 'application/json', 'X-API-Key': KEY })

async function getScreener(stream) {
  const r = await fetch(`${BASE}/screener/${stream}`, { headers: headers() })
  if (!r.ok) throw new Error(`Error ${r.status}`)
  return r.json()
}

async function refreshScreener(stream) {
  const r = await fetch(`${BASE}/screener/${stream}/refresh`, { method: 'POST', headers: headers() })
  if (!r.ok) throw new Error(`Error ${r.status}`)
  return r.json()
}

async function searchByTopic(query, maxResults=10) {
  const r = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ query, max_results: maxResults })
  })
  if (!r.ok) throw new Error(`Error ${r.status}`)
  return r.json()
}

const C = {
  navy:'#0f2942', blue:'#1a6bb5', blue2:'#2980b9',
  teal:'#16a085', orange:'#e67e22', red:'#e74c3c',
  gray:'#64748b', light:'#f0f4f8', white:'#ffffff',
}
const OXFORD_COLOR = {'1a':C.navy,'1b':C.blue,'2a':C.blue2,'2b':'#3498db','3a':C.teal,'3b':'#1abc9c','4':C.orange,'5':'#95a5a6'}
const GRADE_COLOR   = {A:C.navy,B:C.blue2,C:C.orange,D:C.red}
const QUALITY_COLOR = {Alta:C.blue,Moderada:C.teal,Baja:C.orange,'Muy baja':C.red}

// Identificador único de paper, independiente de la fuente:
// PubMed siempre trae pmid, SciELO siempre trae doi (pmid=null).
// Fallback a title solo por seguridad extrema.
function paperId(paper){
  return paper.doi || paper.pmid || paper.title
}

function Badge({label,value,color}){
  return(
    <span style={{background:color,borderRadius:8,padding:'3px 10px',display:'inline-flex',alignItems:'center',gap:5}}>
      <span style={{color:'rgba(255,255,255,.65)',fontSize:'.7rem'}}>{label}:</span>
      <span style={{color:'#fff',fontWeight:700,fontSize:'.8rem'}}>{value}</span>
    </span>
  )
}
function Chip({label,value}){
  return(
    <span style={{background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:8,padding:'3px 12px',display:'inline-flex',gap:5,alignItems:'center'}}>
      <span style={{color:'#94a3b8',fontSize:'.72rem',fontWeight:600}}>{label}:</span>
      <span style={{color:'#334155',fontSize:'.8rem',fontWeight:700}}>{value}</span>
    </span>
  )
}
function Section({icon,title,children}){
  return(
    <div style={{background:C.white,borderRadius:16,boxShadow:'0 2px 12px rgba(0,0,0,0.06)',padding:'1.25rem',marginBottom:'1rem'}}>
      <h3 style={{margin:'0 0 .75rem',color:C.navy,fontSize:'.85rem',fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',display:'flex',alignItems:'center',gap:8}}>
        <span>{icon}</span>{title}
      </h3>
      {children}
    </div>
  )
}

function ScoreBadge({score}){
  const color = score>=75?C.blue:score>=50?C.teal:score>=30?C.orange:C.red
  return(
    <div style={{width:44,height:44,borderRadius:'50%',border:`3px solid ${color}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
      <span style={{fontSize:'.85rem',fontWeight:800,color,lineHeight:1}}>{score}</span>
    </div>
  )
}

// Badge de procedencia — PubMed vs SciELO, para distinguir a simple vista.
function FuenteBadge({fuente}){
  const isScielo = fuente==='scielo'
  return(
    <span style={{
      background:isScielo?'#fff7ed':'#eff6ff',
      color:isScielo?'#c2410c':'#1d4ed8',
      border:`1px solid ${isScielo?'#fed7aa':'#bfdbfe'}`,
      borderRadius:6,padding:'2px 8px',fontSize:'.7rem',fontWeight:700,
      display:'inline-flex',alignItems:'center',gap:4}}>
      {isScielo?'🇨🇱 SciELO':'🌐 PubMed'}
    </span>
  )
}

// Card individual de paper — reutilizada por ambas sub-pestañas.
function PaperCard({paper,idx,isSel,onToggle}){
  return(
    <div onClick={onToggle}
      style={{background:isSel?'#eff6ff':C.white,
        border:`2px solid ${isSel?C.blue:'#e2e8f0'}`,
        borderRadius:14,padding:'1rem',cursor:'pointer',transition:'all .15s',
        boxShadow:isSel?'0 0 0 3px rgba(26,107,181,0.1)':'0 2px 8px rgba(0,0,0,0.04)'}}>
      <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
        <div style={{fontSize:'.72rem',color:C.gray,fontWeight:700,flexShrink:0,marginTop:2,width:20,textAlign:'center'}}>#{idx+1}</div>
        <div style={{width:20,height:20,borderRadius:6,flexShrink:0,marginTop:2,
          border:`2px solid ${isSel?C.blue:'#cbd5e1'}`,
          background:isSel?C.blue:'transparent',
          display:'flex',alignItems:'center',justifyContent:'center'}}>
          {isSel&&<span style={{color:'#fff',fontSize:'.7rem',fontWeight:800}}>✓</span>}
        </div>
        <div style={{flex:1}}>
          <p style={{margin:'0 0 4px',fontWeight:700,color:C.navy,fontSize:'.9rem',lineHeight:1.4}}>{paper.title}</p>
          <p style={{margin:'0 0 8px',color:C.gray,fontSize:'.78rem'}}>{paper.authors} · <em>{paper.journal}</em> · {paper.year}</p>
          <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
            <FuenteBadge fuente={paper.fuente}/>
            {paper.open_access&&<span style={{background:'#dcfce7',color:'#16a34a',borderRadius:6,padding:'2px 8px',fontSize:'.7rem',fontWeight:700}}>✓ Open Access</span>}
            {paper.doi&&<span style={{background:'#e0f2fe',color:'#0369a1',borderRadius:6,padding:'2px 8px',fontSize:'.7rem',fontWeight:700}}>✓ DOI</span>}
            {paper.pmid&&<span style={{background:'#f1f5f9',color:C.gray,borderRadius:6,padding:'2px 8px',fontSize:'.7rem'}}>PMID: {paper.pmid}</span>}
          </div>
        </div>
        <ScoreBadge score={paper.score}/>
      </div>
    </div>
  )
}

// ── Topic Search ──────────────────────────────────────────────────
function TopicSearch({onAnalyze}){
  const [query,setQuery]         = useState('')
  const [maxResults,setMax]      = useState(10)
  const [loading,setLoading]     = useState(false)
  const [error,setError]         = useState('')
  const [papers,setPapers]       = useState([])
  const [selected,setSelected]   = useState(new Set())
  const [analyzing,setAnalyzing] = useState(false)
  const [progress,setProgress]   = useState('')
  const [sourceTab,setSourceTab] = useState('pubmed')

  async function handleSearch(){
    if(query.trim().length<3) return
    setLoading(true); setError(''); setPapers([]); setSelected(new Set()); setSourceTab('pubmed')
    try{
      const data = await searchByTopic(query.trim(), maxResults)
      setPapers(data.papers||[])
      if((data.papers||[]).length===0) setError('No se encontraron resultados.')
    }catch(e){ setError(e.message) }
    finally{ setLoading(false) }
  }

  function toggleSelect(id){
    setSelected(prev=>{
      const next=new Set(prev)
      next.has(id)?next.delete(id):next.add(id)
      return next
    })
  }

  async function analyzeSelected(){
    const toAnalyze = papers.filter(p=>selected.has(paperId(p)))
    if(!toAnalyze.length) return
    setAnalyzing(true)
    const list=[]
    for(let i=0;i<toAnalyze.length;i++){
      const paper=toAnalyze[i]
      setProgress(`Analizando ${i+1} de ${toAnalyze.length}: ${paper.title.slice(0,40)}...`)
      try{
        // Prioridad: fulltext ya extraído (SciELO) > DOI (PubMed, vía CrossRef/Unpaywall) > metadatos sueltos.
        const fulltext = (paper.fulltext||'').trim()
        let result
        if(fulltext.length>500){
          result = await analyzeByText(fulltext, paper.doi||null)
        }else if(paper.doi){
          result = await analyzeByDoi(paper.doi)
        }else{
          const metaTexto = `Title: ${paper.title}\nAuthors: ${paper.authors}\nJournal: ${paper.journal} (${paper.year})\n${paper.pmid?`PMID: ${paper.pmid}`:''}`
          result = await analyzeByText(metaTexto, null)
        }
        list.push(result)
      }catch(e){ console.error(e.message) }
    }
    setAnalyzing(false); setProgress('')
    if(list.length>0) onAnalyze(list)
  }

  const papersPubmed = papers.filter(p=>p.fuente!=='scielo')
  const papersScielo = papers.filter(p=>p.fuente==='scielo')
  const visiblePapers = sourceTab==='pubmed' ? papersPubmed : papersScielo

  const inp={width:'100%',padding:'.75rem 1rem',boxSizing:'border-box',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:'.9rem',fontFamily:"'Georgia',serif",outline:'none',color:'#1e293b',background:C.white}

  const sourceSubTab=(key,label,count)=>(
    <button onClick={()=>setSourceTab(key)} style={{
      flex:1,padding:'.5rem',border:'none',cursor:'pointer',borderRadius:9,
      fontWeight:700,fontSize:'.8rem',
      background:sourceTab===key?C.navy:'transparent',
      color:sourceTab===key?'#fff':C.gray,transition:'all .2s'}}>
      {label} ({count})
    </button>
  )

  return(
    <div style={{maxWidth:700,margin:'0 auto'}}>
      <div style={{background:C.white,borderRadius:16,padding:'1.25rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'1rem'}}>
        <label style={{display:'block',fontWeight:700,color:C.navy,fontSize:'.85rem',marginBottom:8}}>Buscar por tema en PubMed + SciELO</label>
        <input
          value={query}
          onChange={e=>{setQuery(e.target.value);setError('')}}
          onKeyDown={e=>e.key==='Enter'&&query.trim().length>=3&&handleSearch()}
          placeholder="ej: total hip arthroplasty ceramic bearing, fractura de cadera..."
          style={inp}
          onFocus={e=>e.target.style.borderColor=C.blue2}
          onBlur={e=>e.target.style.borderColor='#e2e8f0'}
        />
        <div style={{display:'flex',alignItems:'center',gap:12,marginTop:10}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flex:1}}>
            <label style={{color:C.gray,fontSize:'.8rem',whiteSpace:'nowrap'}}>Resultados por fuente:</label>
            <select value={maxResults} onChange={e=>setMax(Number(e.target.value))}
              style={{padding:'.4rem .7rem',border:'1.5px solid #e2e8f0',borderRadius:8,fontSize:'.85rem',color:'#1e293b',background:C.white,cursor:'pointer'}}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <button onClick={handleSearch} disabled={loading||query.trim().length<3}
            style={{padding:'.6rem 1.5rem',border:'none',borderRadius:10,
              background:loading||query.trim().length<3?'#94a3b8':`linear-gradient(135deg,${C.navy},${C.blue})`,
              color:'#fff',fontWeight:700,fontSize:'.85rem',
              cursor:loading||query.trim().length<3?'not-allowed':'pointer'}}>
            {loading?'⏳ Buscando...':'🔎 Buscar'}
          </button>
        </div>
      </div>

      {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'.75rem 1rem',marginBottom:'1rem',color:'#dc2626',fontSize:'.85rem'}}>⚠️ {error}</div>}

      {papers.length>0&&(
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.75rem',flexWrap:'wrap',gap:8}}>
            <p style={{margin:0,color:C.gray,fontSize:'.85rem'}}>
              <strong style={{color:C.navy}}>{papers.length}</strong> resultados totales
              {selected.size>0&&<span style={{color:C.blue,marginLeft:12}}>· {selected.size} seleccionados</span>}
            </p>
            {selected.size>0&&(
              <button onClick={analyzeSelected} disabled={analyzing}
                style={{padding:'.5rem 1rem',border:'none',borderRadius:8,
                  background:analyzing?'#94a3b8':`linear-gradient(135deg,${C.teal},#1abc9c)`,
                  color:'#fff',fontWeight:700,fontSize:'.82rem',
                  cursor:analyzing?'not-allowed':'pointer'}}>
                {analyzing?`⚙️ ${progress||'Analizando...'}`:`🔍 Analizar ${selected.size} seleccionado${selected.size>1?'s':''}`}
              </button>
            )}
          </div>

          <div style={{display:'flex',gap:6,background:'#f1f5f9',borderRadius:12,padding:4,marginBottom:'1rem'}}>
            {sourceSubTab('pubmed','🌐 PubMed',papersPubmed.length)}
            {sourceSubTab('scielo','🇨🇱 SciELO',papersScielo.length)}
          </div>

          {visiblePapers.length===0?(
            <div style={{textAlign:'center',padding:'2rem',color:C.gray,background:C.white,borderRadius:14,border:'1px dashed #e2e8f0'}}>
              Sin resultados de {sourceTab==='pubmed'?'PubMed':'SciELO'} para este tema.
            </div>
          ):(
            <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
              {visiblePapers.map((paper,idx)=>{
                const id=paperId(paper)
                return(
                  <PaperCard key={id} paper={paper} idx={idx} isSel={selected.has(id)} onToggle={()=>toggleSelect(id)}/>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
// ── Screener ──────────────────────────────────────────────────────
function Screener({onAnalyze}){
  const [stream,setStream]       = useState('cadera')
  const [data,setData]           = useState({cadera:null,rodilla:null})
  const [loading,setLoading]     = useState({cadera:false,rodilla:false})
  const [error,setError]         = useState('')
  const [selected,setSelected]   = useState(new Set())
  const [analyzing,setAnalyzing] = useState(false)
  const [progress,setProgress]   = useState('')
  const [refreshing,setRefreshing] = useState(false)

  useEffect(()=>{
    loadStream('cadera')
    loadStream('rodilla')
  },[])

  async function loadStream(s){
    setLoading(prev=>({...prev,[s]:true}))
    try{
      const result = await getScreener(s)
      setData(prev=>({...prev,[s]:result}))
    }catch(e){
      setError(e.message)
    }finally{
      setLoading(prev=>({...prev,[s]:false}))
    }
  }

  async function handleRefresh(){
    setRefreshing(true)
    try{
      await refreshScreener(stream)
      setTimeout(()=>loadStream(stream), 3000)
    }catch(e){
      setError(e.message)
    }finally{
      setRefreshing(false)
    }
  }

  function toggleSelect(pmid){
    setSelected(prev=>{
      const next=new Set(prev)
      next.has(pmid)?next.delete(pmid):next.add(pmid)
      return next
    })
  }

  async function analyzeSelected(){
    const currentData = data[stream]
    if(!currentData) return
    const toAnalyze = currentData.papers.filter(p=>selected.has(p.pmid))
    if(!toAnalyze.length) return
    setAnalyzing(true)
    const list=[]
    for(let i=0;i<toAnalyze.length;i++){
      const paper=toAnalyze[i]
      setProgress(`Analizando ${i+1} de ${toAnalyze.length}: ${paper.title.slice(0,40)}...`)
      try{
        const result=paper.doi
          ? await analyzeByDoi(paper.doi)
          : await analyzeByText(`Title: ${paper.title}\nAuthors: ${paper.authors}\nJournal: ${paper.journal} (${paper.year})\nPMID: ${paper.pmid}`)
        list.push(result)
      }catch(e){ console.error(e.message) }
    }
    setAnalyzing(false); setProgress('')
    if(list.length>0) onAnalyze(list)
  }

  const currentData = data[stream]
  const papers = currentData?.papers || []
  const updatedAt = currentData?.updated_at
    ? new Date(currentData.updated_at).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'})
    : null

  const streamTab=(s,label,emoji)=>(
    <button onClick={()=>{setStream(s);setSelected(new Set())}} style={{
      flex:1, padding:'.65rem', border:'none', cursor:'pointer', borderRadius:10,
      fontWeight:700, fontSize:'.85rem',
      background: stream===s ? C.navy : 'transparent',
      color: stream===s ? '#fff' : C.gray,
      transition:'all .2s',
    }}>{emoji} {label}</button>
  )

  return(
    <div style={{maxWidth:700,margin:'0 auto'}}>
      <div style={{background:C.white,borderRadius:16,padding:'1.25rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)',marginBottom:'1rem'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
          <div>
            <h2 style={{margin:0,color:C.navy,fontSize:'1rem',fontWeight:700}}>📡 Radar de Literatura</h2>
            <p style={{margin:'2px 0 0',color:C.gray,fontSize:'.75rem'}}>
              {updatedAt ? `Actualizado: ${updatedAt}` : 'Cargando...'}
              {' · '}Actualización automática semanal
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            style={{padding:'.45rem .9rem',border:`1px solid ${C.blue}`,borderRadius:8,
              background:'transparent',color:C.blue,fontWeight:700,fontSize:'.78rem',
              cursor:refreshing?'not-allowed':'pointer'}}>
            {refreshing?'⏳ Actualizando...':'🔄 Actualizar'}
          </button>
        </div>
        <div style={{display:'flex',gap:6,background:'#f1f5f9',borderRadius:12,padding:4}}>
          {streamTab('cadera','Cadera','🦴')}
          {streamTab('rodilla','Rodilla','🦿')}
        </div>
      </div>

      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'.75rem 1rem',marginBottom:'1rem',color:'#dc2626',fontSize:'.85rem'}}>⚠️ {error}</div>}

      {currentData?.status === 'generating' && (
        <div style={{background:'#fffbeb',border:'1px solid #fde68a',borderRadius:12,padding:'1.25rem',textAlign:'center',marginBottom:'1rem'}}>
          <p style={{margin:0,color:'#92400e',fontWeight:600}}>⚙️ Generando resultados por primera vez...</p>
          <p style={{margin:'4px 0 0',color:'#92400e',fontSize:'.82rem'}}>Tarda ~60 segundos. Haz clic en "Actualizar" en un momento.</p>
        </div>
      )}

      {loading[stream] && (
        <div style={{textAlign:'center',padding:'2rem',color:C.gray}}>⏳ Cargando papers...</div>
      )}

      {!loading[stream] && papers.length > 0 && (
        <>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'.75rem'}}>
            <p style={{margin:0,color:C.gray,fontSize:'.85rem'}}>
              <strong style={{color:C.navy}}>{papers.length}</strong> papers rankeados
              {selected.size>0 && <span style={{color:C.blue,marginLeft:12}}>· {selected.size} seleccionados</span>}
            </p>
            {selected.size>0 && (
              <button onClick={analyzeSelected} disabled={analyzing}
                style={{padding:'.5rem 1rem',border:'none',borderRadius:8,
                  background:analyzing?'#94a3b8':`linear-gradient(135deg,${C.teal},#1abc9c)`,
                  color:'#fff',fontWeight:700,fontSize:'.82rem',
                  cursor:analyzing?'not-allowed':'pointer'}}>
                {analyzing?`⚙️ ${progress||'Analizando...'}`:`🔍 Analizar ${selected.size} seleccionado${selected.size>1?'s':''}`}
              </button>
            )}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'.75rem'}}>
            {papers.map((paper,idx)=>{
              const isSel=selected.has(paper.pmid)
              return(
                <div key={paper.pmid} onClick={()=>toggleSelect(paper.pmid)}
                  style={{background:isSel?'#eff6ff':C.white,
                    border:`2px solid ${isSel?C.blue:'#e2e8f0'}`,
                    borderRadius:14,padding:'1rem',cursor:'pointer',transition:'all .15s',
                    boxShadow:isSel?'0 0 0 3px rgba(26,107,181,0.1)':'0 2px 8px rgba(0,0,0,0.04)'}}>
                  <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
                    <div style={{fontSize:'.72rem',color:C.gray,fontWeight:700,flexShrink:0,marginTop:2,width:20,textAlign:'center'}}>#{idx+1}</div>
                    <div style={{width:20,height:20,borderRadius:6,flexShrink:0,marginTop:2,
                      border:`2px solid ${isSel?C.blue:'#cbd5e1'}`,
                      background:isSel?C.blue:'transparent',
                      display:'flex',alignItems:'center',justifyContent:'center'}}>
                      {isSel&&<span style={{color:'#fff',fontSize:'.7rem',fontWeight:800}}>✓</span>}
                    </div>
                    <div style={{flex:1}}>
                      <p style={{margin:'0 0 4px',fontWeight:700,color:C.navy,fontSize:'.9rem',lineHeight:1.4}}>{paper.title}</p>
                      <p style={{margin:'0 0 8px',color:C.gray,fontSize:'.78rem'}}>{paper.authors} · <em>{paper.journal}</em> · {paper.year}</p>
                      <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                        {paper.open_access&&<span style={{background:'#dcfce7',color:'#16a34a',borderRadius:6,padding:'2px 8px',fontSize:'.7rem',fontWeight:700}}>✓ Open Access</span>}
                        {paper.doi&&<span style={{background:'#e0f2fe',color:'#0369a1',borderRadius:6,padding:'2px 8px',fontSize:'.7rem',fontWeight:700}}>✓ DOI</span>}
                        <span style={{background:'#f1f5f9',color:C.gray,borderRadius:6,padding:'2px 8px',fontSize:'.7rem'}}>PMID: {paper.pmid}</span>
                      </div>
                    </div>
                    <ScoreBadge score={paper.score}/>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Input Panel ───────────────────────────────────────────────────
function InputPanel({onResult,initialMode='doi'}){
  const [mode,setMode]       = useState(initialMode)
  const [doi,setDoi]         = useState('')
  const [text,setText]       = useState('')
  const [textDoi,setTextDoi] = useState('')
  const [loading,setLoading] = useState(false)
  const [status,setStatus]   = useState('')
  const [error,setError]     = useState('')
  const canSubmit = mode==='doi'?doi.trim().length>5:text.trim().length>100

  async function submit(){
    setLoading(true);setError('');setStatus('Consultando...')
    try{
      let result
      if(mode==='doi'){setStatus('Buscando en CrossRef y Unpaywall...');result=await analyzeByDoi(doi.trim())}
      else{setStatus('Enviando texto a Claude...');result=await analyzeByText(text.trim(),textDoi.trim()||null)}
      onResult([result])
    }catch(e){setError(e.message)}
    finally{setLoading(false);setStatus('')}
  }

  const tabStyle=(active)=>({flex:1,padding:'.6rem',border:'none',cursor:'pointer',borderRadius:10,fontWeight:700,fontSize:'.85rem',background:active?C.navy:'transparent',color:active?'#fff':C.gray,transition:'all .2s'})
  const inp={width:'100%',padding:'.75rem 1rem',boxSizing:'border-box',border:'1.5px solid #e2e8f0',borderRadius:10,fontSize:'.9rem',fontFamily:"'Georgia',serif",outline:'none',color:'#1e293b',background:C.white}

  return(
    <div style={{maxWidth:700,margin:'0 auto'}}>
      <div style={{display:'flex',gap:6,background:'#e2e8f0',borderRadius:12,padding:4,marginBottom:'1.5rem'}}>
        <button style={tabStyle(mode==='doi')} onClick={()=>{setMode('doi');setError('')}}>🔗 Por DOI</button>
        <button style={tabStyle(mode==='text')} onClick={()=>{setMode('text');setError('')}}>📝 Por Texto</button>
      </div>
      {mode==='doi'?(
        <div>
          <label style={{display:'block',fontWeight:700,color:C.navy,fontSize:'.85rem',marginBottom:8}}>DOI del artículo</label>
          <input value={doi} onChange={e=>{setDoi(e.target.value);setError('')}} onKeyDown={e=>e.key==='Enter'&&canSubmit&&submit()} placeholder="10.1056/NEJMoa1302413" style={inp} onFocus={e=>e.target.style.borderColor=C.blue2} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
        </div>
      ):(
        <div>
          <label style={{display:'block',fontWeight:700,color:C.navy,fontSize:'.85rem',marginBottom:8}}>Texto del paper</label>
          <textarea value={text} onChange={e=>{setText(e.target.value);setError('')}} placeholder="Pega aquí el abstract o texto completo..." rows={8} style={{...inp,resize:'vertical',lineHeight:1.7}} onFocus={e=>e.target.style.borderColor=C.blue2} onBlur={e=>e.target.style.borderColor='#e2e8f0'}/>
          <input value={textDoi} onChange={e=>setTextDoi(e.target.value)} placeholder="DOI (opcional)" style={{...inp,marginTop:8,fontSize:'.82rem'}}/>
        </div>
      )}
      {error&&<div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:10,padding:'.75rem 1rem',marginTop:'1rem',color:'#dc2626',fontSize:'.85rem'}}>⚠️ {error}</div>}
      <button onClick={submit} disabled={loading||!canSubmit} style={{marginTop:'1.5rem',width:'100%',padding:'1rem',border:'none',borderRadius:12,background:loading||!canSubmit?'#94a3b8':`linear-gradient(135deg,${C.navy},${C.blue})`,color:'#fff',fontSize:'1rem',fontWeight:700,cursor:loading||!canSubmit?'not-allowed':'pointer',boxShadow:loading||!canSubmit?'none':'0 4px 15px rgba(15,76,129,.3)'}}>
        {loading?`⚙️ ${status||'Analizando...'}`:'🔍 Analizar Paper'}
      </button>
    </div>
  )
}

// ── Result Panel ──────────────────────────────────────────────────
function ResultPanel({results,onReset}){
  const [idx,setIdx]=useState(0)
  const result=results[idx]
  const score=result?.puntuacion_calidad??0
  const scoreColor=score>=75?C.blue:score>=50?C.teal:score>=30?C.orange:C.red

  return(
    <div>
      {results.length>1&&(
        <div style={{display:'flex',gap:8,marginBottom:'1rem',overflowX:'auto',paddingBottom:4}}>
          {results.map((r,i)=>(
            <button key={i} onClick={()=>setIdx(i)} style={{padding:'.4rem .9rem',border:'none',borderRadius:8,cursor:'pointer',background:i===idx?C.navy:'#e2e8f0',color:i===idx?'#fff':C.gray,fontSize:'.78rem',fontWeight:700,whiteSpace:'nowrap',flexShrink:0}}>
              {i+1}. {r.titulo?.slice(0,30)}...
            </button>
          ))}
        </div>
      )}
      <div style={{background:C.white,borderRadius:16,padding:'1.5rem',marginBottom:'1rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div style={{flex:1}}>
            <span style={{display:'inline-block',background:'#e0f2fe',color:'#0369a1',borderRadius:6,padding:'2px 10px',fontSize:'.72rem',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>{result.categoria}</span>
            <h2 style={{margin:'0 0 6px',color:C.navy,fontSize:'1.15rem',lineHeight:1.4}}>{result.titulo}</h2>
            <p style={{margin:0,color:C.gray,fontSize:'.82rem'}}>{result.autores} · {result.revista}</p>
            {result.doi&&<a href={`https://doi.org/${result.doi}`} target="_blank" rel="noreferrer" style={{fontSize:'.75rem',color:C.blue2,textDecoration:'none',marginTop:4,display:'inline-block'}}>🔗 doi.org/{result.doi}</a>}
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{width:72,height:72,borderRadius:'50%',border:`5px solid ${scoreColor}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
              <span style={{fontSize:'1.35rem',fontWeight:800,color:scoreColor,lineHeight:1}}>{score}</span>
              <span style={{fontSize:'.52rem',color:'#94a3b8',textTransform:'uppercase'}}>calidad</span>
            </div>
          </div>
        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:'1rem'}}>
          <Badge label="Oxford" value={result.nivel_evidencia_oxford} color={OXFORD_COLOR[result.nivel_evidencia_oxford]||C.gray}/>
          <Badge label="Recomendación" value={`Grado ${result.grado_recomendacion}`} color={GRADE_COLOR[result.grado_recomendacion]||C.gray}/>
          <Badge label="GRADE" value={result.calidad_grade} color={QUALITY_COLOR[result.calidad_grade]||C.gray}/>
          <Badge label="Diseño" value={result.tipo_estudio} color="#475569"/>
          <Badge label="Fuente" value={result.fuente==='fulltext'?'📄 Texto completo':'📋 Abstract'} color={result.fuente==='fulltext'?C.teal:C.orange}/>
        </div>
      </div>
      <Section icon="🎯" title="Marco PICO">
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px,1fr))',gap:10}}>
          {[{k:'P',label:'Población',val:result.pico?.poblacion},{k:'I',label:'Intervención',val:result.pico?.intervencion},{k:'C',label:'Comparador',val:result.pico?.comparador},{k:'O',label:'Outcome',val:result.pico?.outcome}].map(({k,label,val})=>(
            <div key={k} style={{background:'#f8fafc',borderRadius:10,padding:'.75rem',border:'1px solid #e2e8f0'}}>
              <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:5}}>
                <span style={{background:C.navy,color:'#fff',borderRadius:6,width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:'.75rem'}}>{k}</span>
                <span style={{fontWeight:700,color:C.navy,fontSize:'.78rem'}}>{label}</span>
              </div>
              <p style={{margin:0,color:'#475569',fontSize:'.82rem',lineHeight:1.5}}>{val||'—'}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section icon="📋" title="Resumen Ejecutivo">
        <p style={{margin:0,color:'#1e293b',lineHeight:1.8,fontSize:'.9rem'}}>{result.resumen_ejecutivo}</p>
        <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
          {result.tamano_muestra&&<Chip label="N" value={result.tamano_muestra}/>}
          {result.seguimiento&&<Chip label="Seguimiento" value={result.seguimiento}/>}
        </div>
      </Section>
      <Section icon="🔑" title="Hallazgos Clave">
        {result.hallazgos_clave?.map((h,i)=>(
          <div key={i} style={{display:'flex',gap:10,marginBottom:9,alignItems:'flex-start'}}>
            <span style={{background:C.navy,color:'#fff',borderRadius:'50%',width:22,height:22,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'.68rem',fontWeight:800,flexShrink:0,marginTop:2}}>{i+1}</span>
            <p style={{margin:0,color:'#334155',lineHeight:1.6,fontSize:'.88rem'}}>{h}</p>
          </div>
        ))}
      </Section>
      <Section icon="⚠️" title="Limitaciones">
        {result.limitaciones?.map((l,i)=>(
          <div key={i} style={{display:'flex',gap:9,marginBottom:7,alignItems:'flex-start'}}>
            <span style={{color:C.orange,flexShrink:0,marginTop:3}}>▸</span>
            <p style={{margin:0,color:'#475569',lineHeight:1.6,fontSize:'.88rem'}}>{l}</p>
          </div>
        ))}
      </Section>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(260px,1fr))',gap:'1rem',marginBottom:'1rem'}}>
        <Section icon="🏥" title="Aplicabilidad Clínica"><p style={{margin:0,color:'#1e293b',lineHeight:1.7,fontSize:'.9rem'}}>{result.aplicabilidad_clinica}</p></Section>
        <Section icon="🇨🇱" title="Contexto Chile / LATAM"><p style={{margin:0,color:'#1e293b',lineHeight:1.7,fontSize:'.9rem'}}>{result.aplicabilidad_chile}</p></Section>
      </div>
      <Section icon="🧠" title="Evaluación Crítica">
        <div style={{background:`linear-gradient(135deg,${C.navy},#1a4a7a)`,borderRadius:12,padding:'1.25rem'}}>
          <p style={{margin:0,color:'rgba(255,255,255,.9)',lineHeight:1.8,fontSize:'.92rem',fontStyle:'italic'}}>"{result.conclusion_critica}"</p>
        </div>
      </Section>
      <div style={{background:'#f0f9ff',border:'1px solid #bae6fd',borderRadius:12,padding:'1rem',marginBottom:'1.5rem',display:'flex',gap:12}}>
        <span style={{fontSize:20}}>ℹ️</span>
        <div>
          <p style={{margin:'0 0 2px',fontWeight:700,color:'#0369a1',fontSize:'.83rem'}}>Nivel Oxford {result.nivel_evidencia_oxford}</p>
          <p style={{margin:0,color:'#0c4a6e',fontSize:'.83rem'}}>{result.nivel_evidencia_descripcion}</p>
        </div>
      </div>
      <button onClick={onReset} style={{width:'100%',padding:'.9rem',border:'none',borderRadius:12,background:`linear-gradient(135deg,${C.navy},${C.blue})`,color:'#fff',fontSize:'.95rem',fontWeight:700,cursor:'pointer',boxShadow:'0 4px 15px rgba(15,76,129,.3)'}}>
        ← Nueva búsqueda
      </button>
    </div>
  )
}

// ── App Root ──────────────────────────────────────────────────────
export default function App(){
  const [view,setView]       = useState('home')
  const [tab,setTab]         = useState('screener')
  const [results,setResults] = useState([])

  function handleResults(list){setResults(list);setView('results')}
  function reset(){setResults([]);setView('home')}

  const navTab=(key,label)=>(
    <button onClick={()=>setTab(key)} style={{flex:1,padding:'.55rem',border:'none',cursor:'pointer',borderRadius:9,fontWeight:700,fontSize:'.82rem',background:tab===key?C.navy:'transparent',color:tab===key?'#fff':C.gray,transition:'all .2s'}}>{label}</button>
  )

  return(
    <div style={{minHeight:'100vh',background:C.light,fontFamily:"'Georgia',serif"}}>
      <div style={{background:`linear-gradient(135deg,${C.navy} 0%,#1a4a7a 60%,#0f4c81 100%)`,padding:'1.5rem 2rem',borderBottom:'4px solid #2980b9'}}>
        <div style={{maxWidth:900,margin:'0 auto',display:'flex',alignItems:'center',gap:'1rem'}}>
          <div style={{width:44,height:44,borderRadius:10,background:'rgba(255,255,255,.14)',border:'1px solid rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🔬</div>
          <div>
            <h1 style={{margin:0,color:'#fff',fontSize:'1.4rem',fontWeight:700}}>Hipokratia Dossier</h1>
            <p style={{margin:0,color:'rgba(255,255,255,.55)',fontSize:'.68rem',letterSpacing:'2px',textTransform:'uppercase'}}>Análisis Crítico de Literatura Científica</p>
          </div>
        </div>
      </div>
      <div style={{maxWidth:900,margin:'0 auto',padding:'2rem 1.5rem'}}>
        {view==='results'?(
          <ResultPanel results={results} onReset={reset}/>
        ):(
          <>
            <div style={{display:'flex',gap:6,background:'#e2e8f0',borderRadius:12,padding:4,marginBottom:'1.5rem',maxWidth:700,margin:'0 auto 1.5rem'}}>
              {navTab('screener','📡 Radar')}
              {navTab('topic','🔎 Por Tema')}
              {navTab('doi','🔗 Por DOI')}
              {navTab('text','📝 Por Texto')}
            </div>
            {tab==='screener'&&<Screener onAnalyze={handleResults}/>}
            {tab==='topic'&&<TopicSearch onAnalyze={handleResults}/>}
            {(tab==='doi'||tab==='text')&&<InputPanel onResult={handleResults} initialMode={tab}/>}
          </>
        )}
      </div>
    </div>
  )
}
