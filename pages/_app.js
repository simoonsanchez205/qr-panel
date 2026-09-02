import Head from 'next/head'

export default function MyApp({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Escala + | Panel</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js" defer/>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" defer/>
      </Head>
      <style global jsx>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html[data-t="dark"] {
          --bg: #09090b; --s1: #111113; --s2: #18181b; --s3: #1f1f23;
          --bdr: #27272a; --bdr2: #3f3f46;
          --tx: #fafafa; --tx2: #d4d4d8; --mu: #71717a;
          --ac: #6366f1; --ac2: #818cf8; --ac3: #a5b4fc;
          --acbg: rgba(99,102,241,0.08);
          --ok: #22c55e; --okbg: rgba(34,197,94,0.06);
          --err: #ef4444;
        }
        html[data-t="light"] {
          --bg: #f8f8f8; --s1: #ffffff; --s2: #f4f4f5; --s3: #e8e8e8;
          --bdr: #d4d4d8; --bdr2: #a1a1aa;
          --tx: #18181b; --tx2: #3f3f46; --mu: #71717a;
          --ac: #4f46e5; --ac2: #6366f1; --ac3: #4338ca;
          --acbg: rgba(79,70,229,0.06);
          --ok: #16a34a; --okbg: rgba(22,163,74,0.06);
          --err: #dc2626;
        }
        body {
          font-family: 'Inter', system-ui, sans-serif;
          background: var(--bg);
          color: var(--tx);
          min-height: 100vh;
          -webkit-font-smoothing: antialiased;
          transition: background .3s, color .3s;
        }
        ::selection { background: var(--ac); color: #fff; }
        input { transition: border-color .2s, box-shadow .2s; outline: none; }
        input:focus { border-color: var(--ac) !important; box-shadow: 0 0 0 3px var(--acbg); }
        button { transition: all .2s; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
