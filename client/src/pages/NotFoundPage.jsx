import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:'16px',
      textAlign:'center', padding:'32px', background:'var(--ink)',
    }}>
      <div style={{fontSize:'5rem',fontFamily:'var(--font-mono)',color:'var(--accent)',fontWeight:700,lineHeight:1}}>404</div>
      <h2>Page not found</h2>
      <p style={{maxWidth:'340px'}}>The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-primary btn-lg">← Back to home</Link>
    </div>
  )
}
