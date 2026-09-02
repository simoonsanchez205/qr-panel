export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) return res.status(400).send('QR inválido');

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  const qrRes = await fetch(`${SUPABASE_URL}/rest/v1/qrs?code=eq.${code}&select=*`, { headers });
  const qrs = await qrRes.json();

  if (!qrs.length || !qrs[0].link) {
    return res.status(404).send('QR no configurado todavía');
  }

  const qr = qrs[0];

  await fetch(`${SUPABASE_URL}/rest/v1/scans`, {
    method: 'POST', headers,
    body: JSON.stringify({ qr_code: code })
  });

  await fetch(`${SUPABASE_URL}/rest/v1/qrs?code=eq.${code}`, {
    method: 'PATCH', headers,
    body: JSON.stringify({ scans: (qr.scans || 0) + 1 })
  });

  res.redirect(301, qr.link);
}
