import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'
import './VerifyEmail.css'

export default function VerifyEmailPage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { login } = useAuth()

  const email = location.state?.email || ''
  const wasResent = location.state?.resent || false

  const [otp,       setOtp]       = useState(['','','','','',''])
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [resending, setResending] = useState(false)
  const [resent,    setResent]    = useState(false)
  const [countdown, setCountdown] = useState(60)

  const inputRefs = useRef([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Redirect if no email in state
  useEffect(() => {
    if (!email) navigate('/register')
  }, [email, navigate])

  const handleInput = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // take only last char
    setOtp(newOtp)
    setError('')

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all 6 filled
    if (value && index === 5) {
      const full = [...newOtp.slice(0,5), value.slice(-1)].join('')
      if (full.length === 6) submitOTP(full)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0)  inputRefs.current[index - 1]?.focus()
    if (e.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (!pasted) return
    const newOtp = [...otp]
    pasted.split('').forEach((ch, i) => { if (i < 6) newOtp[i] = ch })
    setOtp(newOtp)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
    if (pasted.length === 6) submitOTP(pasted)
  }

  const submitOTP = async (code) => {
    if (loading) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/verify-email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, otp: code }),
      })
      const data = await res.json()

      if (!data.success) {
        setError(data.message || 'Invalid OTP')
        setOtp(['','','','','',''])
        inputRefs.current[0]?.focus()
      } else {
        login(data.user, data.token)
        navigate('/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { setError('Please enter all 6 digits'); return }
    submitOTP(code)
  }

  const resendOTP = async () => {
    setResending(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/resend-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, type: 'verify' }),
      })
      const data = await res.json()
      if (data.success) {
        setResent(true)
        setCountdown(60)
        setOtp(['','','','','',''])
        inputRefs.current[0]?.focus()
        setTimeout(() => setResent(false), 4000)
      } else {
        setError(data.message)
      }
    } catch {
      setError('Failed to resend. Try again.')
    } finally {
      setResending(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg"><div className="auth-blob b1"/><div className="auth-blob b2"/><div className="auth-grid"/></div>
      <div className="auth-container">
        <Link to="/" className="auth-brand">
          <span style={{color:'var(--accent)',fontSize:'1.4rem'}}>⬡</span>
          <span>MentorBridge</span>
        </Link>

        <div className="auth-card verify-card">
          <div className="verify-icon">📧</div>
          <div className="auth-hdr" style={{textAlign:'center'}}>
            <h2>Verify your email</h2>
            <p>We sent a 6-digit code to</p>
            <strong className="verify-email">{email}</strong>
          </div>

          {wasResent && (
            <div className="auth-alert" style={{background:'rgba(255,184,48,.1)',borderColor:'rgba(255,184,48,.3)',color:'var(--accent-amber)',marginTop:'12px'}}>
              <span>◎</span> Already registered but not verified — a fresh OTP has been sent.
            </div>
          )}

          {wasResent && (
            <div className="auth-alert" style={{background:'rgba(255,184,48,.1)',borderColor:'rgba(255,184,48,.3)',color:'var(--accent-amber)'}}>
              <span>◎</span> This email was already registered but not verified. A fresh OTP has been sent.
            </div>
          )}

          {error && (
            <div className="auth-alert"><span>⚠</span> {error}</div>
          )}

          {resent && (
            <div className="auth-alert" style={{background:'rgba(0,212,170,.1)',borderColor:'rgba(0,212,170,.3)',color:'var(--accent-mint)'}}>
              <span>✓</span> New OTP sent to your email
            </div>
          )}

          <form onSubmit={handleSubmit} className="otp-form">
            <div className="otp-inputs" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`otp-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                  autoFocus={i === 0}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            <button type="submit" className="auth-submit btn-primary" disabled={loading || otp.join('').length < 6}>
              {loading ? <><span className="spinner"/> Verifying…</> : 'Verify Email →'}
            </button>
          </form>

          <div className="verify-resend">
            {countdown > 0 ? (
              <p className="mono" style={{fontSize:'.8rem',color:'var(--text-muted)'}}>
                Resend in {countdown}s
              </p>
            ) : (
              <button
                className="resend-btn"
                onClick={resendOTP}
                disabled={resending}
              >
                {resending ? 'Sending…' : "Didn't receive it? Resend code"}
              </button>
            )}
          </div>

          <p style={{textAlign:'center',fontSize:'.78rem',color:'var(--text-muted)',marginTop:'8px'}}>
            Wrong email? <Link to="/register" style={{color:'var(--accent)'}}>Go back</Link>
          </p>
        </div>
      </div>
    </div>
  )
}