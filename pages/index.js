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

function Btn({ onClick, variant='ac', children, full, disabled, small, style={} }) {
  const variants = {
    ac: { background:'var(--ac)', color:'#fff', border:'none' },
    gh: { background:'var(--s2)', color:'var(--tx2)', border:'1px solid var(--bdr)' },
    out: { background:'transparent', color:'var(--mu)', border:'1px solid var(--bdr)' },
    warn: { background:'rgba(234,179,8,0.1)', color:'#ca8a04', border:'1px solid rgba(234,179,8,0.3)' },
    danger: { background:'rgba(239,68,68,0.06)', color:'var(--err)', border:'1px solid rgba(239,68,68,0.2)' },
  }
  return (
    <button onClick={disabled?undefined:onClick} style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6,
      padding: small?'8px 14px':'11px 18px',
      borderRadius:10, fontSize: small?12:13, fontWeight:600,
      cursor:disabled?'not-allowed':'pointer', fontFamily:'inherit',
      opacity:disabled?.4:1, width:full?'100%':undefined,
      transition:'all .15s', WebkitTapHighlightColor:'transparent',
      ...variants[variant], ...style
    }}>
      {children}
    </button>
  )
}

function Input({ value, onChange, type='text', placeholder, onKeyDown }) {
  return (
    <input value={value} onChange={onChange} type={type} placeholder={placeholder} onKeyDown={onKeyDown}
      style={{width:'100%',border:'1px solid var(--bdr)',borderRadius:10,padding:'13px 14px',fontSize:16,fontFamily:'inherit',background:'var(--bg)',color:'var(--tx)',WebkitAppearance:'none'}}/>
  )
}

function Modal({ open, onClose, children, width=460 }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.72)',backdropFilter:'blur(6px)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:'0'}}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--s1)',borderRadius:'20px 20px 0 0',padding:'1.5rem',
        width:'100%',maxWidth:Math.min(width,600),
        border:'1px solid var(--bdr)',borderBottom:'none',
        boxShadow:'0 -20px 60px rgba(0,0,0,.5)',
        maxHeight:'90vh',overflowY:'auto'
      }}>
        <div style={{width:36,height:4,background:'var(--bdr2)',borderRadius:2,margin:'0 auto 1.25rem'}}/>
        {children}
      </div>
    </div>
  )
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{position:'fixed',bottom:24,left:'50%',transform:'translateX(-50%)',background:'var(--s1)',border:'1px solid var(--bdr)',color:'var(--tx)',padding:'12px 20px',borderRadius:40,fontSize:13,fontWeight:500,zIndex:200,boxShadow:'0 8px 30px rgba(0,0,0,.35)',display:'flex',alignItems:'center',gap:8,whiteSpace:'nowrap',animation:'fadeUp .3s ease'}}>
      <div style={{width:7,height:7,borderRadius:'50%',background:'var(--ok)',flexShrink:0}}/>
      {msg}
    </div>
  )
}

function Badge({ status }) {
  const s = status==='sold'
  return <span style={{display:'inline-flex',padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:600,background:s?'var(--acbg)':'var(--okbg)',color:s?'var(--ac2)':'var(--ok)'}}>{s?'Vendido':'Disponible'}</span>
}

function TagPill({ tag, active, onClick }) {
  if (!tag) return null
  return (
    <button onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:20,fontSize:11,fontWeight:600,background:active?'rgba(234,179,8,0.12)':'rgba(234,179,8,0.06)',color:'#ca8a04',border:'1px solid '+(active?'rgba(234,179,8,0.4)':'rgba(234,179,8,0.2)'),cursor:'pointer',fontFamily:'inherit',WebkitTapHighlightColor:'transparent'}}>
      🏷 {tag}
    </button>
  )
}

// Card para mobile
function QRCard({ q, onAssign, onQR, onCopy, onWA, onStats, selectMode, selected, onToggle }) {
  const inactive = q.status==='sold' && q.sold_at && Math.floor((Date.now()-new Date(q.sold_at).getTime())/86400000)>30 && !q.scans
  return (
    <div onClick={selectMode?onToggle:undefined} style={{
      background:'var(--s1)', border:'1px solid '+(selected?'var(--ac)':inactive?'rgba(239,68,68,0.3)':'var(--bdr)'),
      borderRadius:14, padding:'1rem', marginBottom:10,
      cursor:selectMode?'pointer':'default',
      background:selected?'rgba(99,102,241,0.04)':'var(--s1)',
      transition:'all .15s'
    }}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
            {selectMode && (
              <div style={{width:20,height:20,borderRadius:6,border:'2px solid '+(selected?'var(--ac)':'var(--bdr2)'),background:selected?'var(--ac)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {selected && <span style={{color:'#fff',fontSize:12,lineHeight:1}}>✓</span>}
              </div>
            )}
            {q.name
              ? <span style={{fontWeight:700,fontSize:15,color:'var(--tx)'}}>{q.name}</span>
              : <span style={{fontSize:14,color:'var(--mu)',fontStyle:'italic'}}>Sin nombre</span>
            }
            <Badge status={q.status}/>
          </div>
          <div style={{fontFamily:'monospace',fontSize:12,color:'var(--mu)',marginBottom:q.tag?6:0}}>{q.code}</div>
          {q.tag && <TagPill tag={q.tag}/>}
        </div>
        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
          {q.scans>0 && <span style={{fontSize:13,fontWeight:700,color:'var(--tx)'}}>{q.scans} scans</span>}
          {q.sold_at && <span style={{fontSize:11,color:inactive?'var(--err)':'var(--mu)',fontWeight:inactive?600:400}}>{daysSince(q.sold_at)}</span>}
        </div>
      </div>

      {q.link && (
        <div style={{fontSize:12,color:'var(--ac2)',marginTop:8,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.link}</div>
      )}
      {!q.link && q.status==='available' && (
        <div style={{fontSize:12,color:'var(--mu)',marginTop:8}}>Sin link asignado</div>
      )}

      {!selectMode && (
        <div style={{display:'flex',gap:6,marginTop:12,flexWrap:'wrap'}}>
          <Btn variant={q.status==='sold'?'gh':'ac'} small onClick={e=>{e.stopPropagation();onAssign(q)}}>
            {q.status==='sold'?'✏️ Editar':'🔗 Asignar'}
          </Btn>
          <Btn variant="gh" small onClick={e=>{e.stopPropagation();onQR(q)}}>⬛ QR</Btn>
          <Btn variant="gh" small onClick={e=>{e.stopPropagation();onCopy(q.code)}}>📋</Btn>
          {q.phone && <Btn variant="gh" small onClick={e=>{e.stopPropagation();onWA(q.phone)}}>📱</Btn>}
          {q.scans>0 && <Btn variant="gh" small onClick={e=>{e.stopPropagation();onStats(q)}}>📊</Btn>}
        </div>
      )}
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
  const [selected, setSelected] = useState(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const t = localStorage.getItem('esc_th')||'dark'
    const tk = localStorage.getItem('esc_tk')
    setTheme(t); document.documentElement.setAttribute('data-t', t)
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

  const toggleSelect = (code) => {
    const ns = new Set(selected)
    ns.has(code)?ns.delete(code):ns.add(code)
    setSelected(ns)
  }
  const selectAll = () => {
    selected.size===filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(q=>q.code)))
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
    setProgress({val:10,txt:`Generando ${genCount} QRs...`})
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
      new window.QRCode(w,{text:`${location.origin}/s/${q.code}`,width:220,height:220,colorDark:'#000',colorLight:'#fff',correctLevel:window.QRCode.CorrectLevel.H})
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
    setAnalytics({q,scans,today,wk,mx:Math.max(...wk,1),last:scans[0]?new Date(scans[0].scanned_at).toLocaleDateString('es-AR'):'—'})
    setModal('analytics')
  }

  const genPDF = async (qrsToExport) => {
    if (!window.jspdf) return showToast('Cargando librería, intentá en unos segundos...')
    if (!qrsToExport.length) return showToast('No hay QRs para exportar')
    const {jsPDF} = window.jspdf
    const doc = new jsPDF('p','mm','a4')
    const cols=3,rows=4,pp=cols*rows,mX=15,mY=20
    const cW=(210-2*mX)/cols,cH=(297-2*mY)/rows,qS=46
    const tot=qrsToExport.length; let dn=0
    setModal(null)
    setProgress({val:3,txt:`Preparando ${tot} QRs...`})
    const tmp=document.createElement('div')
    tmp.style.cssText='position:absolute;left:-9999px;top:-9999px;width:500px'
    document.body.appendChild(tmp)
    const qrImages = await Promise.all(qrsToExport.map(q=>new Promise(resolve=>{
      const div=document.createElement('div'); tmp.appendChild(div)
      new window.QRCode(div,{text:`${location.origin}/s/${q.code}`,width:400,height:400,colorDark:'#000000',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel.H})
      setTimeout(()=>{const cv=div.querySelector('canvas'),im=div.querySelector('img');resolve(cv?cv.toDataURL('image/png'):(im?im.src:null))},350)
    })))
    document.body.removeChild(tmp)
    setProgress({val:60,txt:'Armando PDF...'})
    qrsToExport.forEach((q,idx)=>{
      if(idx>0&&idx%pp===0) doc.addPage()
      const i=idx%pp,col=i%cols,row=Math.floor(i/cols)
      const x=mX+col*cW,y=mY+row*cH
      doc.setDrawColor(200); doc.setLineWidth(0.2)
      const m=2
      doc.line(x+m,y,x+m+5,y); doc.line(x,y+m,x,y+m+5)
      doc.line(x+cW-m,y,x+cW-m-5,y); doc.line(x+cW,y+m,x+cW,y+m+5)
      doc.line(x+m,y+cH,x+m+5,y+cH); doc.line(x,y+cH-m,x,y+cH-m-5)
      doc.line(x+cW-m,y+cH,x+cW-m-5,y+cH); doc.line(x+cW,y+cH-m,x+cW,y+cH-m-5)
      const cx=x+(cW-qS)/2,cy=y+(cH-qS-12)/2+2
      if(qrImages[idx]) doc.addImage(qrImages[idx],'PNG',cx,cy,qS,qS,undefined,'FAST')
      doc.setFontSize(7.5); doc.setTextColor(100); doc.setFont('helvetica','normal')
      doc.text(q.code,x+cW/2,cy+qS+4,{align:'center'})
      if(q.name){doc.setFontSize(6.5);doc.setTextColor(60);doc.text(q.name.length>24?q.name.substring(0,24)+'…':q.name,x+cW/2,cy+qS+8,{align:'center'})}
      if(q.tag){doc.setFontSize(6);doc.setTextColor(150);doc.text(q.tag,x+cW/2,cy+qS+11.5,{align:'center'})}
      dn++; setProgress({val:60+Math.round((dn/tot)*40),txt:`${dn}/${tot} QRs`})
    })
    doc.save(`Escala_QRs_${tot}.pdf`)
    setProgress(null); showToast(`PDF · ${tot} QRs descargado`)
    exitSelectMode()
  }

  const exportCSV = () => {
    const rows=[['Código','Nombre','Teléfono','Link','Etiqueta','Estado','Fecha venta','Días','Escaneos']]
    filtered.forEach(q=>rows.push([q.code,q.name||'',q.phone||'',q.link||'',q.tag||'',q.status==='sold'?'Vendido':'Disponible',q.sold_at?new Date(q.sold_at).toLocaleDateString('es-AR'):'',daysSince(q.sold_at),q.scans||0]))
    const csv=rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
    const a=document.createElement('a'); a.href='data:text/csv;charset=utf-8,\uFEFF'+encodeURIComponent(csv); a.download='Escala_Clientes.csv'; a.click()
    showToast('CSV exportado')
  }

  const metrics = {total:qrs.length,avail:qrs.filter(q=>q.status==='available').length,sold:qrs.filter(q=>q.status==='sold').length,scans:qrs.reduce((a,q)=>a+(q.scans||0),0)}
  const p = isMobile ? '1rem' : '2rem 1.5rem'

  // ---- LOGIN ----
  if (!token) return (
    <>
      <Head><title>Escala + | Panel</title></Head>
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:'1rem'}}>
        <div style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:20,padding:'2rem',width:'100%',maxWidth:420,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-80,right:-60,width:250,height:250,background:'radial-gradient(circle,var(--acbg),transparent 70%)',pointerEvents:'none'}}/>
          <div style={{fontSize:28,fontWeight:700,letterSpacing:'-.5px',marginBottom:4}}>
            Escala <span style={{background:'linear-gradient(135deg,var(--ac),var(--ac3))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>+</span>
          </div>
          <div style={{fontSize:14,color:'var(--mu)',marginBottom:'2rem'}}>Panel de gestión · Acceso privado</div>
          {loginErr&&<div style={{fontSize:14,color:'var(--err)',marginBottom:'1rem',padding:'12px 14px',background:'rgba(239,68,68,.06)',borderRadius:10,border:'1px solid rgba(239,68,68,.15)'}}>Email o contraseña incorrectos</div>}
          <div style={{marginBottom:'1rem'}}>
            <label style={{display:'block',fontSize:12,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.6px'}}>Email</label>
            <Input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="tu@email.com" onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
          </div>
          <div style={{marginBottom:'1.5rem'}}>
            <label style={{display:'block',fontSize:12,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.6px'}}>Contraseña</label>
            <Input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
          </div>
          <Btn onClick={doLogin} full>Iniciar sesión</Btn>
        </div>
      </div>
    </>
  )

  // ---- APP ----
  return (
    <>
      <Head><title>Escala + | Panel</title></Head>
      <div style={{maxWidth:1180,margin:'0 auto',padding:p}}>

        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',gap:12}}>
          <div>
            <div style={{fontSize:isMobile?22:28,fontWeight:700,letterSpacing:'-.5px',lineHeight:1.1}}>
              Escala <span style={{background:'linear-gradient(135deg,var(--ac),var(--ac3))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>+</span>
            </div>
            {!isMobile && <div style={{fontSize:13,color:'var(--mu)',marginTop:4}}>Gestión de tarjetas NFC y códigos QR</div>}
          </div>
          <div style={{display:'flex',gap:6,alignItems:'center'}}>
            {!selectMode ? <>
              <button onClick={togTheme} style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 12px',fontSize:16,cursor:'pointer',lineHeight:1,WebkitTapHighlightColor:'transparent'}}>
                {theme==='dark'?'☀️':'🌙'}
              </button>
              <Btn variant="ac" onClick={()=>setModal('actions')}>≡</Btn>
            </> : <>
              <div style={{fontSize:12,fontWeight:600,color:'var(--ac2)',padding:'8px 12px',background:'var(--acbg)',borderRadius:10,border:'1px solid rgba(99,102,241,.2)'}}>
                {selected.size} sel.
              </div>
              <Btn variant="warn" small onClick={selectAll}>{selected.size===filtered.length?'Ninguno':'Todos'}</Btn>
              <Btn small onClick={()=>genPDF(qrs.filter(q=>selected.has(q.code)))} disabled={selected.size===0}>PDF</Btn>
              <Btn variant="gh" small onClick={exitSelectMode}>✕</Btn>
            </>}
          </div>
        </div>

        {/* METRICS - scroll horizontal en mobile */}
        <div style={{display:'flex',gap:10,marginBottom:'1.25rem',overflowX:'auto',paddingBottom:4,scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
          {[
            {l:'Total',v:metrics.total,c:'var(--tx)'},
            {l:'Disponibles',v:metrics.avail,c:'var(--ok)'},
            {l:'Vendidos',v:metrics.sold,c:'var(--ac2)'},
            {l:'Escaneos',v:metrics.scans,c:'var(--tx)'},
          ].map(({l,v,c},i)=>(
            <div key={i} style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:14,padding:'1rem 1.25rem',flexShrink:0,minWidth:isMobile?100:140,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,right:0,width:60,height:60,background:'radial-gradient(circle at top right,var(--acbg),transparent 70%)',pointerEvents:'none'}}/>
              <div style={{fontSize:10,color:'var(--mu)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.6px',fontWeight:600}}>{l}</div>
              <div style={{fontSize:isMobile?26:32,fontWeight:700,letterSpacing:-1.5,lineHeight:1,color:c}}>{v}</div>
            </div>
          ))}
        </div>

        {/* PROGRESS */}
        {progress&&(
          <div style={{marginBottom:'1.25rem'}}>
            <div style={{height:4,background:'var(--bdr)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',background:'linear-gradient(90deg,var(--ac),var(--ac3))',borderRadius:4,width:`${progress.val}%`,transition:'width .3s'}}/>
            </div>
            <div style={{fontSize:12,color:'var(--mu)',marginTop:6}}>{progress.txt}</div>
          </div>
        )}

        {/* SELECT MODE BANNER */}
        {selectMode && (
          <div style={{background:'rgba(234,179,8,0.06)',border:'1px solid rgba(234,179,8,0.2)',borderRadius:12,padding:'10px 14px',marginBottom:'1rem',fontSize:13,color:'#ca8a04'}}>
            Tocá las tarjetas para seleccionarlas. PDF con {selected.size} seleccionadas.
          </div>
        )}

        {/* SEARCH */}
        <div style={{marginBottom:'1rem'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar por nombre, código o etiqueta..." style={{width:'100%',border:'1px solid var(--bdr)',borderRadius:12,padding:'13px 16px',fontSize:16,fontFamily:'inherit',background:'var(--s1)',color:'var(--tx)',WebkitAppearance:'none'}}/>
        </div>

        {/* FILTROS scroll horizontal */}
        <div style={{display:'flex',gap:8,marginBottom:'1rem',overflowX:'auto',paddingBottom:4,scrollbarWidth:'none',WebkitOverflowScrolling:'touch'}}>
          {['all','available','sold'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              background:filter===f?'var(--acbg)':'var(--s1)',
              border:filter===f?'1px solid rgba(99,102,241,.3)':'1px solid var(--bdr)',
              color:filter===f?'var(--ac2)':'var(--mu)',
              padding:'8px 16px',borderRadius:24,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:600,flexShrink:0,
              WebkitTapHighlightColor:'transparent'
            }}>
              {f==='all'?`Todos (${qrs.length})`:f==='available'?`Disponibles (${metrics.avail})`:`Vendidos (${metrics.sold})`}
            </button>
          ))}
          {allTags.map(t=>(
            <TagPill key={t} tag={t} active={tagFilter===t} onClick={()=>setTagFilter(t===tagFilter?'all':t)}/>
          ))}
        </div>

        {/* CARDS o TABLE */}
        {isMobile ? (
          <div>
            {filtered.length===0 ? (
              <div style={{textAlign:'center',padding:'3rem',color:'var(--mu)',fontSize:14}}>{qrs.length===0?'Cargando...':'Sin resultados'}</div>
            ) : filtered.map(q=>(
              <QRCard key={q.code} q={q} selectMode={selectMode} selected={selected.has(q.code)}
                onToggle={()=>toggleSelect(q.code)} onAssign={openAssign} onQR={showQR}
                onCopy={copyLink} onWA={openWA} onStats={showAnalytics}/>
            ))}
          </div>
        ) : (
          <div style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:16,overflow:'hidden'}}>
            <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
              <thead>
                <tr style={{background:'var(--s2)'}}>
                  {selectMode&&<th style={{padding:'13px 16px',width:50,borderBottom:'1px solid var(--bdr)'}}>
                    <input type="checkbox" checked={selected.size>0&&selected.size===filtered.length} onChange={selectAll} style={{cursor:'pointer',width:16,height:16,accentColor:'var(--ac)'}}/>
                  </th>}
                  {[{l:'Negocio',w:165},{l:'Estado',w:90},{l:'Etiqueta',w:110},{l:'Link'},{l:'Vendido',w:82},{l:'Días',w:52},{l:'Scans',w:62},{l:'Acciones',w:110}].map(({l,w},i)=>(
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
                      onMouseEnter={e=>{if(!isSel)e.currentTarget.style.background='rgba(99,102,241,.02)'}}
                      onMouseLeave={e=>{if(!isSel)e.currentTarget.style.background=''}}>
                      {selectMode&&<td style={{padding:'13px 16px'}}>
                        <input type="checkbox" checked={isSel} onChange={()=>toggleSelect(q.code)} onClick={e=>e.stopPropagation()} style={{cursor:'pointer',width:16,height:16,accentColor:'var(--ac)'}}/>
                      </td>}
                      <td style={{padding:'13px 16px'}}>
                        {q.name?<div style={{fontWeight:600,fontSize:13}}>{q.name}</div>:<div style={{color:'var(--mu)',fontSize:13}}>Sin nombre</div>}
                        <div style={{fontFamily:'monospace',fontSize:11,color:'var(--mu)',marginTop:2}}>{q.code}</div>
                        {q.phone&&<div onClick={e=>{e.stopPropagation();openWA(q.phone)}} style={{fontSize:11,color:'var(--ac2)',marginTop:2,cursor:'pointer'}}>📱 {q.phone}</div>}
                      </td>
                      <td style={{padding:'13px 16px'}}><Badge status={q.status}/></td>
                      <td style={{padding:'13px 16px'}}>{q.tag&&<TagPill tag={q.tag} onClick={()=>setTagFilter(q.tag)}/>}</td>
                      <td style={{padding:'13px 16px',fontSize:12,color:q.link?'var(--ac2)':'var(--mu)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{q.link||'Sin asignar'}</td>
                      <td style={{padding:'13px 16px',fontSize:11,color:'var(--mu)'}}>{q.sold_at?new Date(q.sold_at).toLocaleDateString('es-AR'):'—'}</td>
                      <td style={{padding:'13px 16px',fontSize:11,color:inactive?'var(--err)':'var(--mu)',fontWeight:inactive?600:400}}>{daysSince(q.sold_at)}</td>
                      <td style={{padding:'13px 16px',fontWeight:700,fontSize:13,color:'var(--tx)'}}>{q.scans>0?q.scans:'—'}</td>
                      <td style={{padding:'13px 16px'}}>
                        {!selectMode&&<div style={{display:'flex',gap:2}}>
                          <button onClick={()=>openAssign(q)} style={{background:'transparent',border:'none',cursor:'pointer',padding:7,borderRadius:8,fontSize:14}}>{q.status==='sold'?'✏️':'🔗'}</button>
                          <button onClick={()=>showQR(q)} style={{background:'transparent',border:'none',cursor:'pointer',padding:7,borderRadius:8,fontSize:14}}>⬛</button>
                          <button onClick={()=>copyLink(q.code)} style={{background:'transparent',border:'none',cursor:'pointer',padding:7,borderRadius:8,fontSize:14}}>📋</button>
                          {q.scans>0&&<button onClick={()=>showAnalytics(q)} style={{background:'transparent',border:'none',cursor:'pointer',padding:7,borderRadius:8,fontSize:14}}>📊</button>}
                        </div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{textAlign:'center',padding:'2rem 0 1rem',fontSize:11,color:'var(--mu)',borderTop:'1px solid var(--bdr)',marginTop:'2rem'}}>
          Escala + · {qrs.length} tarjetas · {allTags.length} etiquetas
        </div>
      </div>

      {/* MODAL ACCIONES (mobile menu) */}
      <Modal open={modal==='actions'} onClose={()=>setModal(null)} width={500}>
        <div style={{fontSize:16,fontWeight:700,color:'var(--tx)',marginBottom:'1.25rem'}}>Acciones</div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <Btn full onClick={()=>{setModal(null);setModal('gen')}}>+ Generar QRs en lote</Btn>
          <Btn variant="gh" full onClick={()=>{setModal(null);setSelectMode(true)}}>☑ Seleccionar QRs para PDF</Btn>
          <Btn variant="gh" full onClick={()=>{setModal(null);genPDF(filtered)}}>↓ PDF de visibles ({filtered.length})</Btn>
          <Btn variant="gh" full onClick={()=>{setModal(null);exportCSV()}}>⬇ Exportar CSV</Btn>
          <Btn variant="out" full onClick={doLogout}>Salir</Btn>
        </div>
      </Modal>

      {/* MODAL ASSIGN */}
      <Modal open={modal==='assign'} onClose={()=>setModal(null)}>
        <div style={{fontSize:17,fontWeight:700,color:'var(--tx)',marginBottom:4}}>{editing?.status==='sold'?'Editar tarjeta':'Asignar tarjeta'}</div>
        <div style={{fontSize:13,color:'var(--mu)',marginBottom:'1.5rem'}}>{editing?.code}</div>
        {[{k:'name',l:'Nombre del negocio',ph:'Ej: Pizzería Don Carlos',t:'text'},{k:'phone',l:'Teléfono',ph:'2236123456',t:'tel'},{k:'link',l:'Link de reseñas',ph:'https://g.page/r/negocio/review',t:'text'},{k:'tag',l:'Etiqueta / Mayorista',ph:'Ej: Juan Pérez',t:'text'}].map(({k,l,ph,t})=>(
          <div key={k} style={{marginBottom:'1rem'}}>
            <label style={{display:'block',fontSize:11,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.6px'}}>{l}</label>
            <Input value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} type={t} placeholder={ph}/>
            {k==='tag'&&allTags.length>0&&(
              <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
                {allTags.map(t=><button key={t} onClick={()=>setForm({...form,tag:t})} style={{fontSize:11,padding:'5px 12px',borderRadius:20,background:form.tag===t?'rgba(234,179,8,0.12)':'var(--s2)',border:'1px solid '+(form.tag===t?'rgba(234,179,8,0.3)':'var(--bdr)'),color:form.tag===t?'#ca8a04':'var(--mu)',cursor:'pointer',fontFamily:'inherit',WebkitTapHighlightColor:'transparent'}}>{t}</button>)}
              </div>
            )}
          </div>
        ))}
        <div style={{display:'flex',gap:8,marginTop:'1.5rem'}}>
          <Btn variant="gh" full onClick={()=>setModal(null)}>Cancelar</Btn>
          <Btn full onClick={saveAssign}>Guardar</Btn>
        </div>
      </Modal>

      {/* MODAL GEN */}
      <Modal open={modal==='gen'} onClose={()=>setModal(null)}>
        <div style={{fontSize:17,fontWeight:700,color:'var(--tx)',marginBottom:4}}>Generar QRs en lote</div>
        <div style={{fontSize:13,color:'var(--mu)',marginBottom:'1.5rem'}}>QRs disponibles para asignar al vender tarjetas</div>
        <div style={{marginBottom:'1rem'}}>
          <label style={{display:'block',fontSize:11,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.6px'}}>Cantidad</label>
          <Input value={genCount} onChange={e=>setGenCount(parseInt(e.target.value)||50)} type="number"/>
        </div>
        <div style={{marginBottom:'1.5rem'}}>
          <label style={{display:'block',fontSize:11,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.6px'}}>Etiqueta / Mayorista (opcional)</label>
          <Input value={genTag} onChange={e=>setGenTag(e.target.value)} placeholder="Ej: Juan Pérez"/>
          {allTags.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>
            {allTags.map(t=><button key={t} onClick={()=>setGenTag(t)} style={{fontSize:11,padding:'5px 12px',borderRadius:20,background:genTag===t?'rgba(234,179,8,0.12)':'var(--s2)',border:'1px solid '+(genTag===t?'rgba(234,179,8,0.3)':'var(--bdr)'),color:genTag===t?'#ca8a04':'var(--mu)',cursor:'pointer',fontFamily:'inherit',WebkitTapHighlightColor:'transparent'}}>{t}</button>)}
          </div>}
        </div>
        <div style={{display:'flex',gap:8}}>
          <Btn variant="gh" full onClick={()=>setModal(null)}>Cancelar</Btn>
          <Btn full onClick={genQRs}>Generar {genCount} QRs</Btn>
        </div>
      </Modal>

      {/* MODAL QR */}
      <Modal open={modal==='qr'} onClose={()=>setModal(null)} width={380}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:17,fontWeight:700,color:'var(--tx)',marginBottom:4}}>{curQR?.name||curQR?.code}</div>
          <div style={{fontSize:13,color:'var(--mu)',marginBottom:'1.25rem'}}>{curQR?.code}</div>
          {curQR?.tag&&<div style={{marginBottom:12}}><TagPill tag={curQR.tag}/></div>}
          <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem',background:'#fff',padding:20,borderRadius:14,border:'1px solid var(--bdr)'}}><div id="qr-render"/></div>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            <Btn variant="gh" onClick={()=>setModal(null)}>Cerrar</Btn>
            <Btn onClick={dlQR}>↓ Descargar PNG</Btn>
          </div>
        </div>
      </Modal>

      {/* MODAL ANALYTICS */}
      <Modal open={modal==='analytics'} onClose={()=>setModal(null)}>
        {analytics&&<>
          <div style={{fontSize:17,fontWeight:700,color:'var(--tx)',marginBottom:'1.25rem'}}>{analytics.q.name||analytics.q.code} · Analytics</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:'1.5rem'}}>
            {[{l:'Totales',v:analytics.q.scans||0},{l:'Hoy',v:analytics.today},{l:'Último',v:analytics.last}].map(({l,v},i)=>(
              <div key={i} style={{background:'var(--s2)',borderRadius:12,padding:'1rem'}}>
                <div style={{fontSize:10,color:'var(--mu)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.6px',fontWeight:600}}>{l}</div>
                <div style={{fontSize:24,fontWeight:700,color:'var(--tx)'}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:5,height:70,marginBottom:'1.5rem'}}>
            {analytics.wk.map((v,i)=>(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                <div style={{background:v>0?'var(--ac)':'var(--acbg)',borderRadius:'4px 4px 0 0',width:'100%',height:Math.max(Math.round((v/analytics.mx)*60),3)}}/>
                <div style={{fontSize:10,color:'var(--mu)'}}>{DAYS[i]}</div>
              </div>
            ))}
          </div>
          <Btn variant="gh" full onClick={()=>setModal(null)}>Cerrar</Btn>
        </>}
      </Modal>

      <Toast msg={toast}/>
    </>
  )
}
