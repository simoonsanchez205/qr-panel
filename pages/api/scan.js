export default async function handler(req, res) {
  const { code } = req.query
  if (!code) return res.status(400).send('QR inválido')

  const SU = process.env.SUPABASE_URL
  const SK = process.env.SUPABASE_KEY

  const headers = {
    'apikey': SK,
    'Authorization': `Bearer ${SK}`,
    'Content-Type': 'application/json'
  }

  const r = await fetch(`${SU}/rest/v1/qrs?code=eq.${code}&select=*`, { headers })
  const qrs = await r.json()

  if (!qrs.length || !qrs[0].link) {
    return res.status(404).send('QR no configurado')
  }

  const qr = qrs[0]

  await fetch(`${SU}/rest/v1/scans`, {
    method: 'POST', headers,
    body: JSON.stringify({ qr_code: code })
  })

  await fetch(`${SU}/rest/v1/qrs?code=eq.${code}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ scans: (qr.scans || 0) + 1 })
  })

  res.redirect(301, qr.link)
}
