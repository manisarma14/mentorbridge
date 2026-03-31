import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import './Auth.css'
import './VerifyEmail.css'

export default function VerifyEmailPage() {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { login } = useAuth()

  const email = location.state?.email || ''
  const wasResent = location.state?.resent || false

  const [otp, setOtp] = useState(['','','','','',''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [isVerifying, setIsVerifying] = useState(false)

  const inputRefs = useRef([])

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate('/register')
  }, [email, navigate])

  const handleInput = (index, value) => {
    if (!/^\d*$/.test(value)) return
    
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError('')
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    
    // Auto-submit when all 6 digits are entered
    if (value && index === 5) {
      const fullOtp = [...newOtp.slice(0,5), value.slice(-1)].join('')
      if (fullOtp.length === 6) {
        setTimeout(() => submitOTP(fullOtp), 300)
      }
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    
    // Handle paste
    if (e.key === 'Enter' && otp.join('').length === 6) {
      submitOTP(otp.join(''))
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6)
    if (!pasted) return

    const newOtp = [...otp]
    pasted.split('').forEach((ch, i) => {
      if (i < 6) newOtp[i] = ch
    })

    setOtp(newOtp)
    setError('')
    
    // Auto-focus next empty input or submit if complete
    const firstEmptyIndex = newOtp.findIndex(digit => !digit)
    if (firstEmptyIndex !== -1 && firstEmptyIndex < 6) {
      inputRefs.current[firstEmptyIndex]?.focus()
    } else if (newOtp.every(digit => digit)) {
      setTimeout(() => submitOTP(pasted.join('')), 300)
    }
  }

  // ✅ FIXED VERIFY FUNCTION
  const submitOTP = async (code) => {
    if (loading || isVerifying) return
    
    setIsVerifying(true)
    setLoading(true)
    setError('')

    try {
      console.log("🔍 Submitting OTP:", code)

      const data = await api.post('/auth/verify-email', {
        email,
        otp: code
      })

      console.log("✅ Verification successful:", data)

      login(data.user, data.token)
      navigate('/dashboard')

    } catch (err) {
      console.error("❌ VERIFY ERROR:", err)
      setError(err)
      setOtp(['','','','','',''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
      setIsVerifying(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) {
      setError('Please enter all 6 digits')
      return
    }
    submitOTP(code)
  }

  // ✅ FIXED RESEND FUNCTION
  const resendOTP = async () => {
    if (resending || countdown > 0) return
    
    setResending(true)
    setError('')

    try {
      console.log("📧 Requesting OTP resend...")
      
      const data = await api.post('/auth/resend-otp', { email })

      if (data.success) {
        setResent(true)
        setCountdown(60)
        setOtp(['','','','','',''])
        inputRefs.current[0]?.focus()
        setTimeout(() => setResent(false), 4000)
        console.log("✅ OTP resent successfully")
      }

    } catch (err) {
      console.error("❌ RESEND ERROR:", err)
      setError(err)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob b1" style={{background:'var(--accent-mint)'}}/>
        <div className="auth-blob b2"/>
        <div className="auth-grid"/>
      </div>
      <div className="auth-container">
        <Link to="/" className="auth-brand">
          <span style={{color:'var(--accent)',fontSize:'1.4rem'}}>⬡</span>
          <span>MentorBridge</span>
        </Link>

        <div className="auth-card verify-card">

          <h2>Verify your email</h2>
          <p className="verify-email">
            We sent a 6-digit code to <strong>{email}</strong>
          </p>
          <p className="verify-subtitle">
            Enter the code below to activate your account
          </p>

          {error && <div className="auth-alert error">⚠️ {error}</div>}
          {resent && <div className="auth-alert success">✅ New code sent! Check your email.</div>}

          <form onSubmit={handleSubmit} className="verify-form">

            <div className="otp-inputs" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`otp-input ${digit ? 'filled' : ''} ${error ? 'error' : ''}`}
                  disabled={loading || isVerifying}
                  autoComplete="off"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              ))}
            </div>

            <button 
              type="submit" 
              disabled={loading || isVerifying || otp.join('').length < 6}
              className="verify-button"
            >
              {isVerifying ? (
                <>
                  <span className="spinner"></span>
                  Verifying...
                </>
              ) : loading ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  ✅ Verify Email
                </>
              )}
            </button>

          </form>

          <div className="verify-actions">
            {countdown > 0 ? (
              <div className="countdown">
                <span className="countdown-icon">⏰</span>
                Resend code in <span className="countdown-time">{countdown}s</span>
              </div>
            ) : (
              <button 
                onClick={resendOTP} 
                disabled={resending}
                className="resend-button"
              >
                {resending ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : (
                  <>
                    📧 Resend Code
                  </>
                )}
              </button>
            )}
          </div>

          <div className="verify-help">
            <p>
              <strong>Didn't receive the code?</strong>
            </p>
            <ul>
              <li>Check your spam folder</li>
              <li>Wait a few minutes for delivery</li>
              <li>Ensure email address is correct</li>
            </ul>
          </div>

          <Link to="/register" className="back-link">
            ← Back to Register
          </Link>

        </div>
      </div>
    </div>
  )
}