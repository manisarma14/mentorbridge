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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    if (value && index === 5) {
      const full = [...newOtp.slice(0,5), value.slice(-1)].join('')
      if (full.length === 6) submitOTP(full)
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
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

    if (pasted.length === 6) submitOTP(pasted)
  }

  // ✅ FIXED VERIFY FUNCTION
  const submitOTP = async (code) => {
    if (loading) return
    setLoading(true)
    setError('')

    try {
      console.log("Sending OTP:", code)

      const data = await api.post('/auth/verify-email', {
        email,
        otp: code
      })

      console.log("SUCCESS:", data)

      login(data.user, data.token)
      navigate('/dashboard')

    } catch (err) {
      console.error("VERIFY ERROR:", err)
      setError(err)
      setOtp(['','','','','',''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
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
    setResending(true)
    setError('')

    try {
      const data = await api.post('/auth/resend-otp', { email })

      if (data.success) {
        setResent(true)
        setCountdown(60)
        setOtp(['','','','','',''])
        inputRefs.current[0]?.focus()
        setTimeout(() => setResent(false), 4000)
      }

    } catch (err) {
      console.error("RESEND ERROR:", err)
      setError(err)
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">

        <div className="auth-card verify-card">

          <h2>Verify your email</h2>
          <p>We sent a code to <strong>{email}</strong></p>

          {error && <div className="auth-alert">⚠ {error}</div>}
          {resent && <div className="auth-alert">✅ OTP sent again</div>}

          <form onSubmit={handleSubmit}>

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
                />
              ))}
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </button>

          </form>

          <div>
            {countdown > 0 ? (
              <p>Resend in {countdown}s</p>
            ) : (
              <button onClick={resendOTP} disabled={resending}>
                {resending ? "Sending..." : "Resend OTP"}
              </button>
            )}
          </div>

          <Link to="/register">Go Back</Link>

        </div>
      </div>
    </div>
  )
}