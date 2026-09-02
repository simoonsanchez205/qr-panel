import { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'

const SU = 'https://wcubgenvkefmbxeuepjz.supabase.co'
const AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdWJnZW52a2VmbWJ4ZXVlcGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMTQ5NTQsImV4cCI6MjEwMzg5MDk1NH0.7inMvYnlbylbd5b4VWWL5BEj5Ikled8FSyqjvvvxahY'
const days = ['Lu','Ma','Mi','Ju','Vi','Sa','Do']

function hdr(t) {
  return { 'apikey': AK, 'Authorization': `Bearer ${t||AK}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
}

function daysSince(d) {
  if (!d) return '—'
  const x = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  return x === 0 ? 'Hoy' : `${x}d`
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      position:'fixed',bottom:24,right:24,background:'var(--s1)',border:'1px solid var(--bdr)',
      color:'var(--tx)',padding:'14px 24px',borderRadius:14,fontSize:13,fontWeight:500,
      zIndex:200,boxShadow:'0 12px 40px rgba(0,0,0,.35)',display:'flex',alignItems:'center',gap:10,
      animation:'fadeUp .3s ease'
    }}>
      <div style={{width:8,height:8,borderRadius:'50%',background:'var(--ok)',flexShrink:0}}/>
      {msg}
    </div>
  )
}

function Modal({ open, onClose, children }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position:'fixed',inset:0,background:'rgba(0,0,0,.7)',backdropFilter:'blur(6px)',
      zIndex:100,display:'flex',alignItems:'center',justifyContent:'center'
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'var(--s1)',borderRadius:20,padding:'2rem',border:'1px solid var(--bdr)',
        boxShadow:'0 30px 60px rgba(0,0,0,.5)',minWidth:440,maxWidth:'90vw'
      }}>
        {children}
      </div>
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
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState('')
  const [progress, setProgress] = useState(null)
  const [modal, setModal] = useState(null) // 'assign' | 'gen' | 'qr' | 'analytics'
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name:'', phone:'', link:'' })
  const [genCount, setGenCount] = useState(50)
  const [analytics, setAnalytics] = useState(null)
  const [curQR, setCurQR] = useState(null)

  useEffect(() => {
    const t = localStorage.getItem('esc_th') || 'dark'
    const tk = localStorage.getItem('esc_tk')
    setTheme(t)
    document.documentElement.setAttribute('data-t', t)
    if (tk) { setToken(tk) }
  }, [])

  useEffect(() => {
    if (token) load()
  }, [token])

  const togTheme = () => {
    const nt = theme === 'dark' ? 'light' : 'dark'
    setTheme(nt)
    document.documentElement.setAttribute('data-t', nt)
    localStorage.setItem('esc_th', nt)
  }

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(''), 3000) }

  const load = useCallback(async () => {
    const r = await fetch(`${SU}/rest/v1/qrs?select=*&order=code.asc`, { headers: hdr(token) })
    const d = await r.json()
    if (Array.isArray(d)) setQrs(d)
  }, [token])

  const doLogin = async () => {
    setLoginErr(false)
    const r = await fetch(`${SU}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': AK, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    })
    const d = await r.json()
    if (d.access_token) {
      localStorage.setItem('esc_tk', d.access_token)
      setToken(d.access_token)
    } else {
      setLoginErr(true)
    }
  }

  const doLogout = () => {
    localStorage.removeItem('esc_tk')
    setToken(null)
    setQrs([])
  }

  const filtered = qrs.filter(q => {
    const mf = filter === 'all' || q.status === filter
    const ms = q.code.toLowerCase().includes(search.toLowerCase()) ||
               (q.name||'').toLowerCase().includes(search.toLowerCase()) ||
               (q.phone||'').includes(search)
    return mf && ms
  })

  const openAssign = (q) => {
    setEditing(q)
    setForm({ name: q.name||'', phone: q.phone||'', link: q.link||'' })
    setModal('assign')
  }

  const saveAssign = async () => {
    if (!form.name || !form.link) return
    const body = { name: form.name, phone: form.phone, link: form.link, status: 'sold' }
    if (!editing.sold_at) body.sold_at = new Date().toISOString()
    await fetch(`${SU}/rest/v1/qrs?code=eq.${editing.code}`, {
      method: 'PATCH', headers: hdr(token), body: JSON.stringify(body)
    })
    setModal(null)
    showToast('Tarjeta asignada correctamente')
    load()
  }

  const genQRs = async () => {
    const mx = qrs.reduce((m,q) => Math.max(m, parseInt(q.code.replace('QR-',''))||0), 0)
    const arr = Array.from({ length: genCount }, (_, i) => ({
      code: `QR-${String(mx+i+1).padStart(3,'0')}`,
      name: '', phone: '', link: '', status: 'available', scans: 0
    }))
    setModal(null)
    setProgress({ val: 10, txt: `Generando ${genCount} QRs...` })
    await fetch(`${SU}/rest/v1/qrs`, { method: 'POST', headers: hdr(token), body: JSON.stringify(arr) })
    setProgress({ val: 100, txt: 'Completado' })
    showToast(`${genCount} QRs generados`)
    setTimeout(() => setProgress(null), 2000)
    load()
  }

  const showQR = (q) => {
    setCurQR(q)
    setModal('qr')
    setTimeout(() => {
      const w = document.getElementById('qr-render')
      if (!w || !window.QRCode) return
      w.innerHTML = ''
      new window.QRCode(w, {
        text: `${location.origin}/s/${q.code}`,
        width: 220, height: 220,
        colorDark: '#111', colorLight: '#fff',
        correctLevel: window.QRCode.CorrectLevel.H
      })
    }, 100)
  }

  const dlQR = () => {
    const w = document.getElementById('qr-render')
    const cv = w?.querySelector('canvas')
    const im = w?.querySelector('img')
    const a = document.createElement('a')
    a.download = `${curQR.code}.png`
    a.href = cv ? cv.toDataURL('image/png') : (im ? im.src : '')
    a.click()
    showToast('QR descargado')
  }

  const showAnalytics = async (q) => {
    const r = await fetch(`${SU}/rest/v1/scans?qr_code=eq.${q.code}&order=scanned_at.desc`, { headers: hdr(token) })
    const scans = await r.json()
    const today = scans.filter(s => new Date(s.scanned_at).toDateString() === new Date().toDateString()).length
    const wk = [0,0,0,0,0,0,0]
    const now = new Date()
    scans.forEach(s => { const d = Math.floor((now - new Date(s.scanned_at)) / 86400000); if (d<7) wk[6-d]++ })
    const mx = Math.max(...wk, 1)
    setAnalytics({ q, scans, today, wk, mx, last: scans[0] ? new Date(scans[0].scanned_at).toLocaleDateString('es-AR') : '—' })
    setModal('analytics')
  }

  const genPDF = async () => {
    if (!window.jspdf) return
    const { jsPDF } = window.jspdf
    const doc = new jsPDF('p','mm','a4')
    const cols=3, rows=4, pp=cols*rows, mX=15, mY=15
    const cW=(210-2*mX)/cols, cH=(297-2*mY)/rows, qS=Math.min(cW,cH)-14
    const ls = qrs.slice()
    const tot = ls.length
    let dn = 0
    setProgress({ val:3, txt:'Preparando PDF...' })
    const tmp = document.createElement('div')
    tmp.style.cssText = 'position:absolute;left:-9999px;top:-9999px'
    document.body.appendChild(tmp)

    const pages = []
    for (let i=0; i<ls.length; i+=pp) pages.push(ls.slice(i,i+pp))

    const processPage = (items) => new Promise(resolve => {
      let p = 0
      items.forEach((q, idx) => {
        const col=idx%cols, row=Math.floor(idx/cols)
        const x=mX+col*cW, y=mY+row*cH
        doc.setDrawColor(180); doc.setLineWidth(.15)
        doc.line(x,y,x+3,y); doc.line(x,y,x,y+3)
        doc.line(x+cW,y,x+cW-3,y); doc.line(x+cW,y,x+cW,y+3)
        doc.line(x,y+cH,x+3,y+cH); doc.line(x,y+cH,x,y+cH-3)
        doc.line(x+cW,y+cH,x+cW-3,y+cH); doc.line(x+cW,y+cH,x+cW,y+cH-3)
        const qd = document.createElement('div')
        tmp.appendChild(qd)
        new window.QRCode(qd, { text:`${location.origin}/s/${q.code}`, width:300, height:300, colorDark:'#000', colorLight:'#fff', correctLevel:window.QRCode.CorrectLevel.H })
        setTimeout(() => {
          const cv=qd.querySelector('canvas'), im=qd.querySelector('img')
          const sr=cv?cv.toDataURL('image/png'):(im?im.src:'')
          if (sr) {
            const cx=x+(cW-qS)/2, cy=y+(cH-qS-8)/2+2
            doc.addImage(sr,'PNG',cx,cy,qS,qS)
            doc.setFontSize(8); doc.setTextColor(100)
            doc.text(q.code, x+cW/2, cy+qS+5, {align:'center'})
          }
          dn++
          setProgress({ val:Math.round((dn/tot)*100), txt:`Procesando ${dn} de ${tot}` })
          p++
          if (p===items.length) resolve()
        }, 120)
      })
    })

    for (let i=0; i<pages.length; i++) {
      if (i>0) doc.addPage()
      await processPage(pages[i])
    }

    document.body.removeChild(tmp)
    doc.save('Escala_Plus_QRs.pdf')
    setProgress(null)
    showToast(`PDF descargado con ${tot} QRs`)
  }

  const metrics = {
    total: qrs.length,
    avail: qrs.filter(q=>q.status==='available').length,
    sold: qrs.filter(q=>q.status==='sold').length,
    scans: qrs.reduce((a,q)=>a+(q.scans||0),0)
  }

  if (!token) {
    return (
      <>
        <Head><title>Escala + | Panel</title></Head>
        <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
          <div style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:20,padding:'2.5rem',width:420,position:'relative',overflow:'hidden'}}>
            <div style={{position:'absolute',top:-80,right:-60,width:250,height:250,background:'radial-gradient(circle,var(--acbg),transparent 70%)',pointerEvents:'none'}}/>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:'-.5px',marginBottom:4}}>
              Escala <span style={{background:'linear-gradient(135deg,var(--ac),var(--ac3))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>+</span>
            </div>
            <div style={{fontSize:13,color:'var(--mu)',marginBottom:'2rem'}}>Panel de gestión · Acceso privado</div>
            {loginErr && <div style={{fontSize:13,color:'var(--err)',marginBottom:'1rem',padding:'10px 14px',background:'rgba(239,68,68,.06)',borderRadius:10,border:'1px solid rgba(239,68,68,.15)'}}>Email o contraseña incorrectos</div>}
            <div style={{marginBottom:'1.25rem'}}>
              <label style={{display:'block',fontSize:11,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.8px'}}>Email</label>
              <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="tu@email.com" onKeyDown={e=>e.key==='Enter'&&doLogin()} style={{width:'100%',border:'1px solid var(--bdr)',borderRadius:10,padding:'12px 14px',fontSize:14,fontFamily:'inherit',background:'var(--bg)',color:'var(--tx)'}}/>
            </div>
            <div style={{marginBottom:'1.5rem'}}>
              <label style={{display:'block',fontSize:11,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.8px'}}>Contraseña</label>
              <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={e=>e.key==='Enter'&&doLogin()} style={{width:'100%',border:'1px solid var(--bdr)',borderRadius:10,padding:'12px 14px',fontSize:14,fontFamily:'inherit',background:'var(--bg)',color:'var(--tx)'}}/>
            </div>
            <button onClick={doLogin} style={{width:'100%',background:'var(--ac)',color:'#fff',border:'none',borderRadius:10,padding:13,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              Iniciar sesión
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Escala + | Panel</title></Head>
      <div style={{maxWidth:1120,margin:'0 auto',padding:'2rem 1.5rem'}}>
        {/* HEADER */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'2.5rem'}}>
          <div>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:'-.5px'}}>
              Escala <span style={{background:'linear-gradient(135deg,var(--ac),var(--ac3))',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>+</span>
            </div>
            <div style={{fontSize:13,color:'var(--mu)',marginTop:4}}>Gestión de tarjetas NFC y códigos QR</div>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button onClick={()=>setModal('gen')} style={{background:'var(--ac)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              + Generar QRs
            </button>
            <button onClick={genPDF} style={{background:'var(--s2)',color:'var(--tx2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              ↓ PDF masivo
            </button>
            <button onClick={togTheme} title={theme==='dark'?'Modo claro':'Modo oscuro'} style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 12px',fontSize:16,cursor:'pointer',lineHeight:1}}>
              {theme==='dark'?'☀️':'🌙'}
            </button>
            <button onClick={doLogout} style={{background:'transparent',color:'var(--mu)',border:'1px solid var(--bdr)',borderRadius:10,padding:'8px 14px',fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
              Salir
            </button>
          </div>
        </div>

        {/* METRICS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:'2rem'}}>
          {[
            {l:'Total QRs',v:metrics.total,c:'var(--tx)'},
            {l:'Disponibles',v:metrics.avail,c:'var(--ok)'},
            {l:'Vendidos',v:metrics.sold,c:'var(--ac2)'},
            {l:'Escaneos',v:metrics.scans,c:'var(--tx)'},
          ].map(({l,v,c},i) => (
            <div key={i} style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:16,padding:'1.5rem 1.25rem',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,right:0,width:100,height:100,background:'radial-gradient(circle at top right,var(--acbg),transparent 60%)',pointerEvents:'none'}}/>
              <div style={{fontSize:11,color:'var(--mu)',marginBottom:10,textTransform:'uppercase',letterSpacing:'.7px',fontWeight:600}}>{l}</div>
              <div style={{fontSize:36,fontWeight:700,letterSpacing:-2,lineHeight:1,color:c}}>{v}</div>
            </div>
          ))}
        </div>

        {/* PROGRESS */}
        {progress && (
          <div style={{marginBottom:'1.5rem'}}>
            <div style={{height:4,background:'var(--bdr)',borderRadius:4,overflow:'hidden'}}>
              <div style={{height:'100%',background:'linear-gradient(90deg,var(--ac),var(--ac3))',borderRadius:4,width:`${progress.val}%`,transition:'width .3s'}}/>
            </div>
            <div style={{fontSize:12,color:'var(--mu)',marginTop:8}}>{progress.txt}</div>
          </div>
        )}

        {/* TOOLBAR */}
        <div style={{display:'flex',gap:8,marginBottom:'1.25rem',alignItems:'center',flexWrap:'wrap'}}>
          {['all','available','sold'].map(f => (
            <button key={f} onClick={()=>setFilter(f)} style={{
              background: filter===f?'var(--acbg)':'var(--s1)',
              border: filter===f?'1px solid rgba(99,102,241,.3)':'1px solid var(--bdr)',
              color: filter===f?'var(--ac2)':'var(--mu)',
              padding:'8px 20px',borderRadius:24,fontSize:12,cursor:'pointer',fontFamily:'inherit',fontWeight:500
            }}>
              {f==='all'?'Todos':f==='available'?'Disponibles':'Vendidos'}
            </button>
          ))}
          <div style={{marginLeft:'auto'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar..." style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:10,padding:'9px 14px',fontSize:13,color:'var(--tx)',width:240,fontFamily:'inherit'}}/>
          </div>
        </div>

        {/* TABLE */}
        <div style={{background:'var(--s1)',border:'1px solid var(--bdr)',borderRadius:16,overflow:'hidden'}}>
          <table style={{width:'100%',borderCollapse:'collapse',tableLayout:'fixed'}}>
            <thead>
              <tr>
                {['Negocio','Estado','Link','Vendido','Días','Scans','Acciones'].map((h,i) => (
                  <th key={i} style={{
                    padding:'14px 16px',fontSize:10,fontWeight:600,color:'var(--mu)',
                    textAlign:'left',borderBottom:'1px solid var(--bdr)',textTransform:'uppercase',
                    letterSpacing:'.8px',background:'var(--s2)',
                    width:i===0?160:i===1?85:i===3?82:i===4?52:i===5?62:i===6?100:undefined
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:'4rem',color:'var(--mu)',fontSize:13}}>
                  {qrs.length===0?'Cargando...':'Sin resultados'}
                </td></tr>
              ) : filtered.map(q => (
                <tr key={q.code} style={{transition:'background .1s'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(99,102,241,.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{padding:'14px 16px',fontSize:13,borderBottom:'1px solid var(--bdr)',color:'var(--tx)'}}>
                    {q.name?<div style={{fontWeight:600,fontSize:14}}>{q.name}</div>:<div style={{color:'var(--mu)'}}>Sin nombre</div>}
                    <div style={{fontFamily:'monospace',fontSize:11,color:'var(--mu)',marginTop:2}}>{q.code}</div>
                    {q.phone&&<div style={{fontSize:11,color:'var(--mu)',marginTop:2}}>{q.phone}</div>}
                  </td>
                  <td style={{padding:'14px 16px',borderBottom:'1px solid var(--bdr)'}}>
                    <span style={{
                      display:'inline-flex',padding:'5px 14px',borderRadius:20,fontSize:11,fontWeight:600,
                      background:q.status==='sold'?'var(--acbg)':'var(--okbg)',
                      color:q.status==='sold'?'var(--ac2)':'var(--ok)'
                    }}>
                      {q.status==='sold'?'Vendido':'Disponible'}
                    </span>
                  </td>
                  <td style={{padding:'14px 16px',fontSize:12,borderBottom:'1px solid var(--bdr)',color:q.link?'var(--ac2)':'var(--mu)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:220}}>
                    {q.link||'Sin asignar'}
                  </td>
                  <td style={{padding:'14px 16px',fontSize:11,color:'var(--mu)',borderBottom:'1px solid var(--bdr)'}}>
                    {q.sold_at?new Date(q.sold_at).toLocaleDateString('es-AR'):'—'}
                  </td>
                  <td style={{padding:'14px 16px',fontSize:11,color:'var(--mu)',borderBottom:'1px solid var(--bdr)'}}>
                    {daysSince(q.sold_at)}
                  </td>
                  <td style={{padding:'14px 16px',fontWeight:700,fontSize:13,borderBottom:'1px solid var(--bdr)',color:'var(--tx)'}}>
                    {q.scans>0?q.scans:'—'}
                  </td>
                  <td style={{padding:'14px 16px',borderBottom:'1px solid var(--bdr)'}}>
                    <div style={{display:'flex',gap:2}}>
                      <button onClick={()=>openAssign(q)} title={q.status==='sold'?'Editar':'Asignar'} style={{background:'transparent',border:'none',cursor:'pointer',padding:8,borderRadius:8,fontSize:15}}>
                        {q.status==='sold'?'✏️':'🔗'}
                      </button>
                      <button onClick={()=>showQR(q)} title="Ver QR" style={{background:'transparent',border:'none',cursor:'pointer',padding:8,borderRadius:8,fontSize:15}}>⬛</button>
                      {q.scans>0&&<button onClick={()=>showAnalytics(q)} title="Analytics" style={{background:'transparent',border:'none',cursor:'pointer',padding:8,borderRadius:8,fontSize:15}}>📊</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{textAlign:'center',padding:'2.5rem 0 1.5rem',fontSize:11,color:'var(--mu)',borderTop:'1px solid var(--bdr)',marginTop:'3rem'}}>
          Escala + · Panel de gestión de tarjetas NFC
        </div>
      </div>

      {/* MODAL ASSIGN */}
      <Modal open={modal==='assign'} onClose={()=>setModal(null)}>
        <h3 style={{fontSize:18,fontWeight:600,marginBottom:4,color:'var(--tx)'}}>{editing?.status==='sold'?'Editar tarjeta':'Asignar tarjeta'}</h3>
        <div style={{fontSize:13,color:'var(--mu)',marginBottom:'1.75rem'}}>{editing?.code}</div>
        {[{id:'name',label:'Nombre del negocio',ph:'Ej: Pizzería Don Carlos',type:'text'},{id:'phone',label:'Teléfono',ph:'2236123456',type:'tel'},{id:'link',label:'Link de reseñas de Google',ph:'https://g.page/r/negocio/review',type:'text'}].map(f=>(
          <div key={f.id} style={{marginBottom:'1.25rem'}}>
            <label style={{display:'block',fontSize:11,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.8px'}}>{f.label}</label>
            <input value={form[f.id]} onChange={e=>setForm({...form,[f.id]:e.target.value})} type={f.type} placeholder={f.ph} style={{width:'100%',border:'1px solid var(--bdr)',borderRadius:10,padding:'12px 14px',fontSize:14,fontFamily:'inherit',background:'var(--bg)',color:'var(--tx)'}}/>
          </div>
        ))}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1.75rem'}}>
          <button onClick={()=>setModal(null)} style={{background:'var(--s2)',color:'var(--tx2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
          <button onClick={saveAssign} style={{background:'var(--ac)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Guardar</button>
        </div>
      </Modal>

      {/* MODAL GEN */}
      <Modal open={modal==='gen'} onClose={()=>setModal(null)}>
        <h3 style={{fontSize:18,fontWeight:600,marginBottom:4,color:'var(--tx)'}}>Generar QRs en lote</h3>
        <div style={{fontSize:13,color:'var(--mu)',marginBottom:'1.75rem'}}>Se crean QRs listos para asignar cuando vendas las tarjetas</div>
        <div style={{marginBottom:'1.25rem'}}>
          <label style={{display:'block',fontSize:11,color:'var(--mu)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.8px'}}>Cantidad de QRs</label>
          <input value={genCount} onChange={e=>setGenCount(parseInt(e.target.value)||50)} type="number" min={1} max={500} style={{width:'100%',border:'1px solid var(--bdr)',borderRadius:10,padding:'12px 14px',fontSize:14,fontFamily:'inherit',background:'var(--bg)',color:'var(--tx)'}}/>
        </div>
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1.75rem'}}>
          <button onClick={()=>setModal(null)} style={{background:'var(--s2)',color:'var(--tx2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Cancelar</button>
          <button onClick={genQRs} style={{background:'var(--ac)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Generar</button>
        </div>
      </Modal>

      {/* MODAL QR */}
      <Modal open={modal==='qr'} onClose={()=>setModal(null)}>
        <div style={{textAlign:'center'}}>
          <h3 style={{fontSize:18,fontWeight:600,marginBottom:4,color:'var(--tx)'}}>{curQR?.name||curQR?.code}</h3>
          <div style={{fontSize:13,color:'var(--mu)',marginBottom:'1.25rem'}}>{curQR?.code}</div>
          <div style={{display:'flex',justifyContent:'center',marginBottom:'1.5rem',background:'#fff',padding:20,borderRadius:14}}>
            <div id="qr-render"/>
          </div>
          <div style={{display:'flex',gap:8,justifyContent:'center'}}>
            <button onClick={()=>setModal(null)} style={{background:'var(--s2)',color:'var(--tx2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Cerrar</button>
            <button onClick={dlQR} style={{background:'var(--ac)',color:'#fff',border:'none',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>↓ Descargar PNG</button>
          </div>
        </div>
      </Modal>

      {/* MODAL ANALYTICS */}
      <Modal open={modal==='analytics'} onClose={()=>setModal(null)}>
        {analytics&&<>
          <h3 style={{fontSize:18,fontWeight:600,marginBottom:'1.25rem',color:'var(--tx)'}}>{analytics.q.name||analytics.q.code} · Analytics</h3>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:'1.25rem'}}>
            {[{l:'Totales',v:analytics.q.scans||0},{l:'Hoy',v:analytics.today},{l:'Último',v:analytics.last}].map(({l,v},i)=>(
              <div key={i}>
                <div style={{fontSize:10,color:'var(--mu)',marginBottom:6,textTransform:'uppercase',letterSpacing:'.7px',fontWeight:600}}>{l}</div>
                <div style={{fontSize:28,fontWeight:700,letterSpacing:-1}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:6,height:70}}>
            {analytics.wk.map((v,i)=>(
              <div key={i} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flex:1}}>
                <div style={{background:'var(--acbg)',borderRadius:'4px 4px 0 0',width:'100%',height:Math.round((v/analytics.mx)*60)||3}}/>
                <div style={{fontSize:10,color:'var(--mu)'}}>{days[i]}</div>
              </div>
            ))}
          </div>
          <div style={{marginTop:'1.75rem',display:'flex',justifyContent:'flex-end'}}>
            <button onClick={()=>setModal(null)} style={{background:'var(--s2)',color:'var(--tx2)',border:'1px solid var(--bdr)',borderRadius:10,padding:'10px 20px',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Cerrar</button>
          </div>
        </>}
      </Modal>

      <Toast msg={toast}/>
    </>
  )
}
