export default function Scan() { return null }

export async function getServerSideProps({ params, res }) {
  const { code } = params
  const SU = process.env.SUPABASE_URL
  const SK = process.env.SUPABASE_KEY
  const headers = { 'apikey': SK, 'Authorization': `Bearer ${SK}`, 'Content-Type': 'application/json' }

  try {
    const r = await fetch(`${SU}/rest/v1/qrs?code=eq.${code}&select=*`, { headers })
    const qrs = await r.json()
    if (!qrs.length || !qrs[0].link) return { props: {} }
    const qr = qrs[0]
    await fetch(`${SU}/rest/v1/scans`, { method:'POST', headers, body: JSON.stringify({ qr_code: code }) })
    await fetch(`${SU}/rest/v1/qrs?code=eq.${code}`, { method:'PATCH', headers, body: JSON.stringify({ scans: (qr.scans||0)+1 }) })
    return { redirect: { destination: qr.link, permanent: true } }
  } catch(e) {
    return { props: {} }
  }
}
