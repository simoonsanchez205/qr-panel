import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const SU = 'https://wcubgenvkefmbxeuepjz.supabase.co'
const AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdWJnZW52a2VmbWJ4ZXVlcGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMTQ5NTQsImV4cCI6MjEwMzg5MDk1NH0.7inMvYnlbylbd5b4VWWL5BEj5Ikled8FSyqjvvvxahY'
const DAYS = ['Lu','Ma','Mi','Ju','Vi','Sa','Do']

function hdr(t) {
  return { 'apikey':AK, 'Authorization':`Bearer ${t||AK}`, 'Content-Type':'application/json', 'Prefer':'return=representation' }
}
function daysSince(d) {
  if (!d) return '—'
  const x = Math.floor((Date.now()-new Date(d).getTime())/86400000)
  return x===0?'Hoy':`${x}d`
}

function Btn({ onClick, variant='ac', children, full, disabled, style={} }) {
  const base = { display:'inline-flex', alignItems:'center', gap:6, padding:'10px 20px', borderRadius:10, fontSize:13, fontWeight:600, cursor:disabled?'default':'pointer', border:'none', fontFamily:'inherit', transition:'all .2s', opacity:disabled?.5:1, ...style }
  const variants = {
    ac: { background:'var(--ac)', color:'#fff' },
    gh: { background:'var(--s2)', color:'var(--tx2)', border:'1px solid var(--bdr)' },
    out: { background:'transparent', color:'var(--mu)', border:'1px solid var(--bdr)', fontSize:12, padding:'8px 14px' },
    warn: { background:'rgba(234,179,8,0.1)', color:'#ca8a04', border:'1px solid rgba(234,179,8,0.3)', fontSize:12, padding:'8px 14px' },
  }
  return <button onClick={disabled?undefined:onClick} style={{...base,...variants[variant],...(full?{width:'100%',justifyContent:'center',padding:13}:{}),}}>{children}</button>
}

function Field({ label, children }) {
  return (
    <div style={{marginBottom:'1.25rem'}}>
      <label style={{display:'block',fontSize:11,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.8px'}}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type='text', placeholder, onKeyDown, style={} }) {
  return <input value={value} onChange={onChange} type={type} placeholder={placeholder} onKeyDown={onKeyDown} style={{width:'100%',border:'1px solid var(--bdr)',borderRadius:10,padding:'12px 14px',fontSize:14,fontFamily:'inherit',background:'var(--bg)',color:'var(--tx)',...style}}/>
}

function Modal({ open, onClose, children, width=460 }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',backdropFilter:'blur(8px)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div onClick={e=>e.stopPropagation()} style={{background:'var(--s1)',borderRadius:20,padding:'2rem',width,maxWidth:'92vw',border:'1px solid var(--bdr)',boxShadow:'0 30px 70px rgba(0,0,0,.5)',maxHeight:'90vh',overflowY:'auto'}}>
        {children}
      </div>
    </div>
  )
}

function MH({ title, sub }) {
  return <div style={{marginBottom:'1.75rem'}}><h3 style={{fontSize:18,fontWeight:700,color:'var(--tx)',marginBottom:4}}>{title}</h3>{sub&&<div style={{fontSize:13,color:'var(--mu)'}}>{sub}</div>}</div>
}
function MF({ onCancel, onSave, saveLabel='Guardar', disabled }) {
  return <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1.75rem'}}><Btn variant="gh" onClick={onCancel}>Cancelar</Btn><Btn onClick={onSave} disabled={disabled}>{saveLabel}</Btn></div>
}

function Toast({ msg }) {
  if (!msg) return null
  return <div style={{position:'fixed',bottom:24,right:24,background:'var(--s1)',border:'1px solid var(--bdr)',color:'var(--tx)',padding:'14px 24px',borderRadius:14,fontSize:13,fontWeight:500,zIndex:200,boxShadow:'0 12px 40px rgba(0,0,0,.35)',display:'flex',alignItems:'center',gap:10,animation:'fadeUp .3s ease'}}><div style={{width:8,height:8,borderRadius:'50%',background:'var(--ok)',flexShrink:0}}/>{msg}</div>
}

function Badge({ status }) {
  const s = status==='sold'
  return <span style={{display:'inline-flex',padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:600,background:s?'var(--acbg)':'var(--okbg)',color:s?'var(--ac2)':'var(--ok)'}}>{s?'Vendido':'Disponible'}</span>
}
function TagBadge({ tag, onClick }) {
  if (!tag) return null
  return <span onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:20,fontSize:10,fontWeight:600,background:'rgba(234,179,8,0.08)',color:'#ca8a04',border:'1px solid rgba(234,179,8,0.2)',cursor:onClick?'pointer':'default',marginTop:3}}>🏷 {tag}</span>
}
function Metric({ label, value, color='var(--tx)' }) {
  return (
    <div style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:16,padding:'1.5rem 1.25rem',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:0,right:0,width:100,height:100,background:'radial-gradient(circle at top right,var(--acbg),transparent 60%)',pointerEvents:'none'}}/>
      <div style={{fontSize:11,color:'var(--mu)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.7px',fontWeight:600}}>{label}</div>
      <div style={{fontSize:36,fontWeight:700,letterSpacing:-2,lineHeight:1,color}}>{value}</div>
    </div>
  )
}

export default function App() {
  const [theme, setTheme] = useState('dark')
  const [token, setToken] = useState(null)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loginErr, setLoginErr] = useState(false)
  const [qrs, setQrs] = useState([])
  const [filter, setFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [progress, setProgress] = useState(null)
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({name:'',phone:'',link:'',tag:''})
  const [genCount, setGenCount] = useState(50)
  const [genTag, setGenTag] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [curQR, setCurQR] = useState(null)
  const [allTags, setAllTags] = useState([])
  const [selected, setSelected] = useState(new Set()) // QRs seleccionados para PDF
  const [selectMode, setSelectMode] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('esc_th')||'dark'
    const tk = localStorage.getItem('esc_tk')
    setTheme(t); document.documentElement.setAttribute('data-t',t)
    if (tk) setToken(tk)
  }, [])

  useEffect(() => { if (token) load() }, [token])
  useEffect(() => {
    const tags = [...new Set(qrs.map(q=>q.tag).filter(Boolean))].sort()
    setAllTags(tags)
  }, [qrs])

  const togTheme = () => {
    const nt = theme==='dark'?'light':'dark'
    setTheme(nt); document.documentElement.setAttribute('data-t',nt); localStorage.setItem('esc_th',nt)
  }
  const showToast = (m) => { setToast(m); setTimeout(()=>setToast(''),3000) }
  const load = useCallback(async () => {
    const r = await fetch(`${SU}/rest/v1/qrs?select=*&order=code.asc`,{headers:hdr(token)})
    const d = await r.json()
    if (Array.isArray(d)) setQrs(d)
  }, [token])

  const doLogin = async () => {
    setLoginErr(false)
    const r = await fetch(`${SU}/auth/v1/token?grant_type=password`,{method:'POST',headers:{'apikey':AK,'Content-Type':'application/json'},body:JSON.stringify({email,password:pass})})
    const d = await r.json()
    if (d.access_token) { localStorage.setItem('esc_tk',d.access_token); setToken(d.access_token) }
    else setLoginErr(true)
  }
  const doLogout = () => { localStorage.removeItem('esc_tk'); setToken(null); setQrs([]) }

  const filtered = qrs.filter(q => {
    const mf = filter==='all'||q.status===filter
    const mt = tagFilter==='all'||q.tag===tagFilter
    const ms = q.code.toLowerCase().includes(search.toLowerCase())||(q.name||'').toLowerCase().includes(search.toLowerCase())||(q.phone||'').includes(search)||(q.tag||'').toLowerCase().includes(search.toLowerCase())
    return mf&&mt&&ms
  })

  // SELECCIÓN
  const toggleSelect = (code) => {
    const ns = new Set(selected)
    ns.has(code)?ns.delete(code):ns.add(code)
    setSelected(ns)
  }
  const selectAll = () => {
    if (selected.size===filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(q=>q.code)))
  }
  const exitSelectMode = () => { setSelectMode(false); setSelected(new Set()) }

  const openAssign = (q) => {
    setEditing(q)
    setForm({name:q.name||'',phone:q.phone||'',link:q.link||'',tag:q.tag||''})
    setModal('assign')
  }
  const saveAssign = async () => {
    if (!form.name||!form.link) return showToast('Completá nombre y link')
    const body = {name:form.name,phone:form.phone,link:form.link,tag:form.tag,status:'sold'}
    if (!editing.sold_at) body.sold_at = new Date().toISOString()
    await fetch(`${SU}/rest/v1/qrs?code=eq.${editing.code}`,{method:'PATCH',headers:hdr(token),body:JSON.stringify(body)})
    setModal(null); showToast('Tarjeta asignada'); load()
  }

  const genQRs = async () => {
    const mx = qrs.reduce((m,q)=>Math.max(m,parseInt(q.code.replace('QR-',''))||0),0)
    const arr = Array.from({length:genCount},(_,i)=>({code:`QR-${String(mx+i+1).padStart(3,'0')}`,name:'',phone:'',link:'',tag:genTag,status:'available',scans:0}))
    setModal(null)
    setProgress({val:10,txt:`Generando ${genCount} QRs${genTag?` · "${genTag}"`:''}...`})
    await fetch(`${SU}/rest/v1/qrs`,{method:'POST',headers:hdr(token),body:JSON.stringify(arr)})
    setProgress({val:100,txt:'Completado'})
    showToast(`${genCount} QRs generados`)
    setTimeout(()=>setProgress(null),2000); load()
  }

  const copyLink = (code) => { navigator.clipboard.writeText(`${location.origin}/s/${code}`); showToast('Link copiado') }
  const openWA = (phone) => { const c=phone.replace(/\D/g,''); window.open(`https://wa.me/54${c}`,'_blank') }

  const showQR = (q) => {
    setCurQR(q); setModal('qr')
    setTimeout(()=>{
      const w=document.getElementById('qr-render')
      if(!w||!window.QRCode) return
      w.innerHTML=''
      new window.QRCode(w,{text:`${location.origin}/s/${q.code}`,width:240,height:240,colorDark:'#000',colorLight:'#fff',correctLevel:window.QRCode.CorrectLevel.H})
    },150)
  }
  const dlQR = () => {
    const w=document.getElementById('qr-render'),cv=w?.querySelector('canvas'),im=w?.querySelector('img')
    const a=document.createElement('a'); a.download=`${curQR.code}.png`
    a.href=cv?cv.toDataURL('image/png'):(im?im.src:''); a.click(); showToast('QR descargado')
  }

  const showAnalytics = async (q) => {
    const r=await fetch(`${SU}/rest/v1/scans?qr_code=eq.${q.code}&order=scanned_at.desc`,{headers:hdr(token)})
    const scans=await r.json()
    const today=scans.filter(s=>new Date(s.scanned_at).toDateString()===new Date().toDateString()).length
    const wk=[0,0,0,0,0,0,0],now=new Date()
    scans.forEach(s=>{const d=Math.floor((now-new Date(s.scanned_at))/86400000);if(d<7)wk[6-d]++})
    const mx=Math.max(...wk,1)
    setAnalytics({q,scans,today,wk,mx,last:scans[0]?new Date(scans[0].scanned_at).toLocaleDateString('es-AR'):'—'})
    setModal('analytics')
  }

  const genPDF = async (qrsToExport) => {
    if (!window.jspdf) return showToast('Espera que cargue la librería...')
    if (!qrsToExport.length) return showToast('No hay QRs para exportar')
    const {jsPDF} = window.jspdf
    const doc = new jsPDF('p','mm','a4')
    const cols=3,rows=4,pp=cols*rows,mX=15,mY=20
    const cW=(210-2*mX)/cols,cH=(297-2*mY)/rows,qS=46
    const tot=qrsToExport.length; let dn=0
    setModal(null)
    setProgress({val:3,txt:`Generando ${tot} QRs para PDF...`})

    // Generar todas las imágenes primero
    const tmp=document.createElement('div')
    tmp.style.cssText='position:absolute;left:-9999px;top:-9999px;width:500px'
    document.body.appendChild(tmp)

    const qrImages = await Promise.all(qrsToExport.map(q=>new Promise(resolve=>{
      const div=document.createElement('div'); tmp.appendChild(div)
      new window.QRCode(div,{text:`${location.origin}/s/${q.code}`,width:400,height:400,colorDark:'#000000',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.H})
      setTimeout(()=>{
        const cv=div.querySelector('canvas'),im=div.querySelector('img')
        resolve(cv?cv.toDataURL('image/png'):(im?im.src:null))
      },350)
    })))

    document.body.removeChild(tmp)
    setProgress({val:60,txt:'Armando PDF...'})

    qrsToExport.forEach((q,idx)=>{
      if (idx>0&&idx%pp===0) doc.addPage()
      const i=idx%pp,col=i%cols,row=Math.floor(i/cols)
      const x=mX+col*cW,y=mY+row*cH

      // Marcas de corte
      doc.setDrawColor(200); doc.setLineWidth(0.2)
      const m=2
      doc.line(x+m,y,x+m+5,y); doc.line(x,y+m,x,y+m+5)
      doc.line(x+cW-m,y,x+cW-m-5,y); doc.line(x+cW,y+m,x+cW,y+m+5)
      doc.line(x+m,y+cH,x+m+5,y+cH); doc.line(x,y+cH-m,x,y+cH-m-5)
      doc.line(x+cW-m,y+cH,x+cW-m-5,y+cH); doc.line(x+cW,y+cH-m,x+cW,y+cH-m-5)

      // QR
      const cx=x+(cW-qS)/2,cy=y+(cH-qS-12)/2+2
      if (qrImages[idx]) doc.addImage(qrImages[idx],'PNG',cx,cy,qS,qS,undefined,'FAST')

      // Código
      doc.setFontSize(7.5); doc.setTextColor(100); doc.setFont('helvetica','normal')
      doc.text(q.code,x+cW/2,cy+qS+4,{align:'center'})
      // Nombre
      if (q.name) { doc.setFontSize(6.5); doc.setTextColor(60); doc.text(q.name.length>24?q.name.substring(0,24)+'…':q.name,x+cW/2,cy+qS+8,{align:'center'}) }
      // Etiqueta
      if (q.tag) { doc.setFontSize(6); doc.setTextColor(150); doc.text(q.tag,x+cW/2,cy+qS+11.5,{align:'center'}) }

      dn++
      setProgress({val:60+Math.round((dn/tot)*40),txt:`Procesando ${dn}/${tot}`})
    })

    doc.save(`Escala_QRs_${tot}.pdf`)
    setProgress(null)
    showToast(`PDF descargado · ${tot} QRs`)
    exitSelectMode()
  }

  const exportCSV = () => {
    const rows=[['Código','Nombre','Teléfono','Link','Etiqueta','Estado','Fecha venta','Días','Escaneos']]
    filtered.forEach(q=>rows.push([q.code,q.name||'',q.phone||'',q.link||'',q.tag||'',q.status==='sold'?'Vendido':'Disponible',q.sold_at?new Date(q.sold_at).toLocaleDateString('es-AR'):'',daysSince(q.sold_at),q.scans||0]))
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv); a.download='Escala_Clientes.csv'; a.click()
    showToast('CSV exportado')
  }

  const metrics = { total:qrs.length, avail:qrs.filter(q=>q.status==='available').length, sold:qrs.filter(q=>q.status==='sold').length, scans:qrs.reduce((a,q)=>a+(q.scans||0),0) }

  // ---- LOGIN ----
  if (!token) return (
    <>
      <Head><title>Escala + | Panel</title></Head>
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
        <div style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:20,padding:'2.5rem',width:420,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-80,right:-60,width:250,height:250,background:'radial-gradient(circle,var(--acbg),transparent 70%)',pointerEvents:'none'}}/>
          <div style={{fontSize:28,fontWeight:700,letterSpacing:'-.5px',marginBottom:4}}>Escala <span style={{background:'linear-gradient(135deg,var(--ac),var(--ac3))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>+</span></div>
          <div style={{fontSize:13,color:'var(--mu)',marginBottom:'2rem'}}>Panel de gestión · Acceso privado</div>
          {loginErr&&<div style={{fontSize:13,color:'var(--err)',marginBottom:'1rem',padding:'10px 14px',background:'rgba(239,68,68,.06)',borderRadius:10,border:'1px solid rgba(239,68,68,.15)'}}>Email o contraseña incorrectos</div>}
          <Field label="Email"><Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="tu@email.com" onKeyDown={e=>e.key==='Enter'&&doLogin()}/></Field>
          <Field label="Contraseña"><Input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&doLogin()}/></Field>
          <div style={{marginTop:'1.5rem'}}><Btn onClick={doLogin} full>Iniciar sesión</Btn></div>
        </div>
      </div>
    </>
  )

  // ---- APP ----
  return (
    <>
      <Head><title>Escala + | Panel</title></Head>
      <div style={{maxWidth:1180,margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2.5rem',flexWrap:'wrap',gap:12}}>
          <div>
            <div style={{fontSize:28,fontWeight:700,letterSpacing:'-.5px'}}>Escala <span style={{background:'linear-gradient(135deg,var(--ac),var(--ac3))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>+</span></div>
            <div style={{fontSize:13,color:'var(--mu)',marginTop:4}}>Gestión de tarjetas NFC y códigos QR</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            {!selectMode ? <>
              <Btn onClick={()=>setModal('gen')}>+ Generar QRs</Btn>
              <Btn variant="gh" onClick={()=>setSelectMode(true)}>☑ Seleccionar para PDF</Btn>
              <Btn variant="gh" onClick={exportCSV}>⬇ CSV</Btn>
              <button onClick={togTheme} style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 12px',fontSize:16,cursor:'pointer',lineHeight:1}}>
                {theme==='dark'?'☀️':'🌙'}
              </button>
              <Btn variant="out" onClick={doLogout}>Salir</Btn>
            </> : <>
              <div style={{fontSize:13,color:'var(--mu)',padding:'8px 14px',background:'var(--s2)',borderRadius:10,border:'1px solid var(--bdr)'}}>
                {selected.size} QRs seleccionados
              </div>
              <Btn variant="warn" onClick={selectAll}>
                {selected.size===filtered.length?'Destildar todo':'Tildar todo'}
              </Btn>
              <Btn onClick={()=>genPDF(qrs.filter(q=>selected.has(q.code)))} disabled={selected.size===0}>
                ↓ PDF ({selected.size})
              </Btn>
              <Btn variant="gh" onClick={()=>genPDF(filtered)}>
                ↓ PDF visibles ({filtered.length})
              </Btn>
              <Btn variant="out" onClick={exitSelectMode}>Cancelar</Btn>
            </>}
          </div>
        </div>

        {/* BANNER SELECCIÓN */}
        {selectMode && (
          <div style={{background:'rgba(234,179,8,0.06)',border:'1px solid rgba(234,179,8,0.2)',borderRadius:12,padding:'12px 16px',marginBottom:'1.5rem',fontSize:13,color:'#ca8a04',display:'flex',alignItems:'center',gap:10}}>
            <span>🏷</span>
            <span>Modo selección activo — tildá los QRs que querés incluir en el PDF, o usá los filtros y hacé clic en "PDF visibles"</span>
          </div>
        )}

        {/* METRICS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:'2rem'}}>
          <Metric label="Total QRs" value={metrics.total}/>
          <Metric label="Disponibles" value={metrics.avail} color="var(--ok)"/>
          <Metric label="Vendidos" value={metrics.sold} color="var(--ac2)"/>
          <Metric label="Escaneos" value={metrics.scans}/>
        </div>

        {/* PROGRESS */}
        {progress&&(
          <div style={{marginBottom:'1.5rem'}}>
            <div style={{height:4,background:'var(--bdr)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',background:'linear-gradient(90deg,var(--ac),var(--ac3))',borderRadius:4,width:`${progress.val}%`,transition:'width .3s'}}/>
            </div>
            <div style={{fontSize:12,color:'var(--mu)',marginTop:8}}>{progress.txt}</div>
          </div>
        )}

        {/* TOOLBAR FILTROS */}
        <div style={{display:'flex',gap:8,marginBottom:'1rem',alignItems:'center',flexWrap:'wrap'}}>
          {['all','available','sold'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{background:filter===f?'var(--acbg)':'var(--s1)',border:filter===f?'1px solid rgba(99,102,241,.3)':'1px solid var(--bdr)',color:filter===f?'var(--ac2)':'var(--mu)',padding:'8px 20px',borderRadius:24,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:500}}>
              {f==='all'?'Todos':f==='available'?'Disponibles':'Vendidos'}
            </button>
          ))}
          {allTags.length>0&&<>
            <div style={{width:1,height:20,background:'var(--bdr)',margin:'0 4px'}}/>
            <button onClick={()=>setTagFilter('all')} style={{background:tagFilter==='all'?'rgba(234,179,8,0.08)':'var(--s1)',border:tagFilter==='all'?'1px solid rgba(234,179,8,0.3)':'1px solid var(--bdr)',color:tagFilter==='all'?'#ca8a04':'var(--mu)',padding:'8px 16px',borderRadius:24,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:500}}>🏷 Todas</button>
            {allTags.map(t=>(
              <button key={t} onClick={()=>setTagFilter(t===tagFilter?'all':t)} style={{background:tagFilter===t?'rgba(234,179,8,0.08)':'var(--s1)',border:tagFilter===t?'1px solid rgba(234,179,8,0.3)':'1px solid var(--bdr)',color:tagFilter===t?'#ca8a04':'var(--mu)',padding:'8px 16px',borderRadius:24,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:500}}>{t}</button>
            ))}
          </>}
          <div style={{marginLeft:'auto'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:10,padding:'9px 14px',fontSize:13,color:'var(--tx)',width:220,fontFamily:'inherit'}}/>
          </div>
        </div>

        <div style={{fontSize:12,color:'var(--mu)',marginBottom:12}}>
          Mostrando {filtered.length} de {qrs.length} QRs
          {tagFilter!=='all'&&<span style={{marginLeft:8,color:'#ca8a04'}}>· Etiqueta: {tagFilter}</span>}
          {selectMode&&selected.size>0&&<span style={{marginLeft:8,color:'var(--ac2)'}}>· {selected.size} seleccionados</span>}
        </div>

        {/* TABLE */}
        <div style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:16,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
            <thead>
              <tr style={{background:'var(--s2)'}}>
                {selectMode&&<th style={{padding:'13px 16px',width:50,borderBottom:'1px solid var(--bdr)'}}>
                  <input type="checkbox" checked={selected.size>0&&selected.size===filtered.length} onChange={selectAll} style={{cursor:'pointer',width:16,height:16,accentColor:'var(--ac)'}}/>
                </th>}
                {[{l:'Negocio',w:160},{l:'Estado',w:90},{l:'Etiqueta',w:110},{l:'Link'},{l:'Vendido',w:82},{l:'Días',w:52},{l:'Scans',w:62},{l:'Acciones',w:selectMode?80:110}].map(({l,w},i)=>(
                  <th key={i} style={{padding:'13px 16px',fontSize:10,fontWeight:600,color:'var(--mu)',textAlign:'left',borderBottom:'1px solid var(--bdr)',textTransform:'uppercase',letterSpacing:'.8px',width:w}}>{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0?(
                <tr><td colSpan={selectMode?9:8} style={{textAlign:'center',padding:'4rem',color:'var(--mu)',fontSize:13}}>{qrs.length===0?'Cargando...':'Sin resultados'}</td></tr>
              ):filtered.map(q=>{
                const inactive=q.status==='sold'&&q.sold_at&&Math.floor((Date.now()-new Date(q.sold_at).getTime())/86400000)>30&&!q.scans
                const isSel=selected.has(q.code)
                return (
                  <tr key={q.code} onClick={selectMode?()=>toggleSelect(q.code):undefined}
                    style={{borderBottom:'1px solid var(--bdr)',cursor:selectMode?'pointer':'default',background:isSel?'rgba(99,102,241,0.04)':''}}
                    onMouseEnter={e=>!isSel&&(e.currentTarget.style.background='rgba(99,102,241,.02)')}
                    onMouseLeave={e=>!isSel&&(e.currentTarget.style.background='')}>
                    {selectMode&&<td style={{padding:'13px 16px'}}>
                      <input type="checkbox" checked={isSel} onChange={()=>toggleSelect(q.code)} onClick={e=>e.stopPropagation()} style={{cursor:'pointer',width:16,height:16,accentColor:'var(--ac)'}}/>
                    </td>}
                    <td style={{padding:'13px 16px',color:'var(--tx)'}}>
                      {q.name?<div style={{fontWeight:600,fontSize:13}}>{q.name}</div>:<div style={{color:'var(--mu)',fontSize:13}}>Sin nombre</div>}
                      <div style={{fontFamily:'monospace',fontSize:11,color:'var(--mu)',marginTop:2}}>{q.code}</div>
                      {q.phone&&<div onClick={e=>{e.stopPropagation();openWA(q.phone)}} style={{fontSize:11,color:'var(--ac2)',marginTop:2,cursor:'pointer'}}>📱 {q.phone}</div>}
                    </td>
                    <td style={{padding:'13px 16px'}}><Badge status={q.status}/></td>
                    <td style={{padding:'13px 16px'}}><TagBadge tag={q.tag} onClick={q.tag?()=>setTagFilter(q.tag):undefined}/></td>
                    <td style={{padding:'13px 16px',fontSize:12,color:q.link?'var(--ac2)':'var(--mu)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}>{q.link||'Sin asignar'}</td>
                    <td style={{padding:'13px 16px',fontSize:11,color:'var(--mu)'}}>{q.sold_at?new Date(q.sold_at).toLocaleDateString('es-AR'):'—'}</td>
                    <td style={{padding:'13px 16px',fontSize:11,color:inactive?'var(--err)':'var(--mu)',fontWeight:inactive?600:400}}>{daysSince(q.sold_at)}</td>
                    <td style={{padding:'13px 16px',fontWeight:700,fontSize:13,color:'var(--tx)'}}>{q.scans>0?q.scans:'—'}</td>
                    <td style={{padding:'13px 16px'}}>
                      {!selectMode&&<div style={{display:'flex',gap:2}}>
                        <button onClick={()=>openAssign(q)} title={q.status==='sold'?'Editar':'Asignar'} style={{background:'transparent',border:'none',cursor:'pointer',padding:7,borderRadius:8,fontSize:14}}>{q.status==='sold'?'✏️':'🔗'}</button>
                        <button onClick={()=>showQR(q)} title="Ver QR" style={{background:'transparent',border:'none',cursor:'pointer',padding:7,borderRadius:8,fontSize:14}}>⬛</button>
                        <button onClick={()=>copyLink(q.code)} title="Copiar link" style={{background:'transparent',border:'none',cursor:'pointer',padding:7,borderRadius:8,fontSize:14}}>📋</button>
                        {q.scans>0&&<button onClick={()=>showAnalytics(q)} title="Analytics" style={{background:'transparent',border:'none',cursor:'pointer',padding:7,borderRadius:8,fontSize:14}}>📊</button>}
                      </div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{textAlign:'center',padding:'2.5rem 0 1.5rem',fontSize:11,color:'var(--mu)',borderTop:'1px solid var(--bdr)',marginTop:'3rem'}}>
          Escala + · {qrs.length} tarjetas · {allTags.length} etiquetas
        </div>
      </div>

      {/* MODAL ASSIGN */}
      <Modal open={modal==='assign'} onClose={()=>setModal(null)}>
        <MH title={editing?.status==='sold'?'Editar tarjeta':'Asignar tarjeta'} sub={editing?.code}/>
        <Field label="Nombre del negocio"><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Ej: Pizzería Don Carlos"/></Field>
        <Field label="Teléfono"><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" placeholder="2236123456"/></Field>
        <Field label="Link de reseñas"><Input value={form.link} onChange={e=>setForm({...form,link:e.target.value})} placeholder="https://g.page/r/negocio/review"/></Field>
        <Field label="Etiqueta">
          <Input value={form.tag} onChange={e=>setForm({...form,tag:e.target.value})} placeholder="Ej: Juan Pérez · Lote A"/>
          {allTags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
            {allTags.map(t=><button key={t} onClick={()=>setForm({...form,tag:t})} style={{fontSize:11,padding:'4px 12px',borderRadius:20,background:form.tag===t?'rgba(234,179,8,0.12)':'var(--s2)',border:'1px solid '+(form.tag===t?'rgba(234,179,8,0.3)':'var(--bdr)'),color:form.tag===t?'#ca8a04':'var(--mu)',cursor:'pointer',fontFamily:'inherit'}}>{t}</button>)}
          </div>}
        </Field>
        <MF onCancel={()=>setModal(null)} onSave={saveAssign}/>
      </Modal>

      {/* MODAL GEN */}
      <Modal open={modal==='gen'} onClose={()=>setModal(null)}>
        <MH title="Generar QRs en lote" sub="Los QRs se crean listos para asignar cuando vendas las tarjetas"/>
        <Field label="Cantidad"><Input value={genCount} onChange={e=>setGenCount(parseInt(e.target.value)||50)} type="number"/></Field>
        <Field label="Etiqueta para este lote (opcional)">
          <Input value={genTag} onChange={e=>setGenTag(e.target.value)} placeholder="Ej: Juan Pérez · Marzo 2025"/>
          {allTags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
            {allTags.map(t=><button key={t} onClick={()=>setGenTag(t)} style={{fontSize:11,padding:'4px 12px',borderRadius:20,background:genTag===t?'rgba(234,179,8,0.12)':'var(--s2)',border:'1px solid '+(genTag===t?'rgba(234,179,8,0.3)':'var(--bdr)'),color:genTag===t?'#ca8a04':'var(--mu)',cursor:'pointer',fontFamily:'inherit'}}>{t}</button>)}
          </div>}
        </Field>
        <MF onCancel={()=>setModal(null)} onSave={genQRs} saveLabel="Generar"/>
      </Modal>

      {/* MODAL QR */}
      <Modal open={modal==='qr'} onClose={()=>setModal(null)} width={380}>
        <div style={{textAlign:'center'}}>
          <h3 style={{fontSize:18,fontWeight:700,marginBottom:4,color:'var(--tx)'}}>{curQR?.name||curQR?.code}</h3>
          <div style={{fontSize:13,color:'var(--mu)',marginBottom:'1.25rem'}}>{curQR?.code}</div>
          {curQR?.tag&&<div style={{marginBottom:12}}><TagBadge tag={curQR.tag}/></div>}
          <div style={{display:'flex',justifyContent:'center',marginBottom:'1.5rem',background:'#fff',padding:20,borderRadius:14,border:'1px solid var(--bdr)'}}><div id="qr-render"/></div>
          <div style={{fontSize:11,color:'var(--mu)',marginBottom:'1.25rem',wordBreak:'break-all'}}>{typeof location!=='undefined'?`${location.origin}/s/${curQR?.code}`:''}</div>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            <Btn variant="gh" onClick={()=>setModal(null)}>Cerrar</Btn>
            <Btn onClick={dlQR}>↓ Descargar PNG</Btn>
          </div>
        </div>
      </Modal>

      {/* MODAL ANALYTICS */}
      <Modal open={modal==='analytics'} onClose={()=>setModal(null)}>
        {analytics&&<>
          <MH title={`${analytics.q.name||analytics.q.code} · Analytics`}/>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:'1.5rem'}}>
            {[{l:'Totales',v:analytics.q.scans||0},{l:'Hoy',v:analytics.today},{l:'Último',v:analytics.last}].map(({l,v},i)=>(
              <div key={i} style={{background:'var(--s2)',borderRadius:12,padding:'1rem'}}>
                <div style={{fontSize:10,color:'var(--mu)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.7px',fontWeight:600}}>{l}</div>
                <div style={{fontSize:28,fontWeight:700,letterSpacing:-1,color:'var(--tx)'}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11,color:'var(--mu)',marginBottom:8,textTransform:'uppercase',letterSpacing:'.5px'}}>Últimos 7 días</div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:80,marginBottom:'1.5rem'}}>
            {analytics.wk.map((v,i)=>(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                <div style={{background:v>0?'var(--ac)':'var(--acbg)',borderRadius:'4px 4px 0 0',width:'100%',height:Math.max(Math.round((v/analytics.mx)*70),3)}}/>
                <div style={{fontSize:10,color:'var(--mu)'}}>{DAYS[i]}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}><Btn variant="gh" onClick={()=>setModal(null)}>Cerrar</Btn></div>
        </>}
      </Modal>

      <Toast msg={toast}/>
    </>
  )
}
