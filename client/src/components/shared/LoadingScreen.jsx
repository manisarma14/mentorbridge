export default function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px',
      background: 'var(--ink)',
    }}>
      <div style={{
        fontSize: '2rem', color: 'var(--accent)',
        animation: 'pulse-glow 2s infinite',
      }}>⬡</div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0,1,2].map(i => (
          <span key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', display: 'block',
            animation: `fadeIn .6s ${i * .15}s ease infinite alternate`,
            opacity: 0.3,
          }} />
        ))}
      </div>
    </div>
  )
}
