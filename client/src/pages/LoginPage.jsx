import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import { Input } from '../components/ui'
import './Auth.css'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form,    setForm]    = useState({ email: '', password: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [apiErr,  setApiErr]  = useState('')

  const validate = () => {
    const e = {}
    if (!form.email)    e.email    = 'Email is required'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const onChange = e => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]: '' }))
    setApiErr('')
  }

  const onSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = await authService.login(form)
      login(data.user, data.token)
      navigate('/dashboard')
    } catch (err) {
      // Check all possible shapes for the emailUnverified flag
      const isUnverified =
        err?.emailUnverified ||
        err?.data?.emailUnverified

      if (isUnverified) {
        // Controller already sent a fresh OTP — redirect to verify page
        navigate('/verify-email', {
          state: { email: err?.email || err?.data?.email || form.email }
        })
        return
      }

      // Show real server message if available
      const msg =
        typeof err === 'string'
          ? err
          : err?.message || err?.data?.message || 'Invalid email or password.'

      setApiErr(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="auth-blob b1"/>
        <div className="auth-blob b2"/>
        <div className="auth-grid"/>
      </div>
      <div className="auth-container">
        <Link to="/" className="auth-brand">
          <span style={{ color: 'var(--accent)', fontSize: '1.4rem' }}>⬡</span>
          <span>MentorBridge</span>
        </Link>

        <div className="auth-card">
          <div className="auth-hdr">
            <h2>Welcome back</h2>
            <p>Sign in to your account</p>
          </div>

          {apiErr && <div className="auth-alert"><span>⚠</span> {apiErr}</div>}

          <form onSubmit={onSubmit} className="auth-form" noValidate>
            <Input
              label="Email" type="email" name="email"
              placeholder="you@example.com"
              value={form.email} onChange={onChange}
              error={errors.email} icon="◎" autoComplete="email"
            />
            <Input
              label="Password" type="password" name="password"
              placeholder="Your password"
              value={form.password} onChange={onChange}
              error={errors.password} icon="◈" autoComplete="current-password"
            />

            <div className="auth-row">
              <label className="remember"><input type="checkbox"/> Remember me</label>
              <Link to="/forgot-password" className="forgot">Forgot password?</Link>
            </div>

            <button type="submit" className="auth-submit btn-primary" disabled={loading}>
              {loading ? <><span className="spinner"/> Signing in…</> : 'Sign in →'}
            </button>
          </form>

          <div className="auth-divider"><span>demo credentials</span></div>
          <div className="demo-hint mono">demo@mentorbridge.io / demo123</div>
        </div>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create one free →</Link>
        </p>
      </div>
    </div>
  )
}