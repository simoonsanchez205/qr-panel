const SU = 'https://wcubgenvkefmbxeuepjz.supabase.co'
const AK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjdWJnZW52a2VmbWJ4ZXVlcGp6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMTQ5NTQsImV4cCI6MjEwMzg5MDk1NH0.7inMvYnlbylbd5b4VWWL5BEj5Ikled8FSyqjvvvxahY'

export default function Scan() { return null }

export async function getServerSideProps({ params }) {
  const { code } = params
  const headers = {
    'apikey': AK,
    'Authorization': `Bearer ${AK}`,
    'Content-Type': 'application/json'
  }

  try {
    const r = await fetch(`${SU}/rest/v1/qrs?code=eq.${code}&select=*`, { headers })
    const qrs = await r.json()

    if (!qrs.length || !qrs[0].link) {
      return { props: {} }
    }

    const qr = qrs[0]

    // Registrar escaneo (sin await para no bloquear el redirect)
    fetch(`${SU}/rest/v1/scans`, {
      method: 'POST', headers,
      body: JSON.stringify({ qr_code: code })
    }).catch(() => {})

    fetch(`${SU}/rest/v1/qrs?code=eq.${code}`, {
      method: 'PATCH', headers,
      body: JSON.stringify({ scans: (qr.scans || 0) + 1 })
    }).catch(() => {})

    return {
      redirect: {
        destination: qr.link,
        permanent: false
      }
    }
  } catch(e) {
    return { props: {} }
  }
}
