import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services'
import { Input, Select } from '../components/ui'
import './Auth.css'

const ROLES = [
  { value: '',       label: 'Select your role…' },
  { value: 'mentee', label: '🎓 Mentee — I want to learn & grow' },
  { value: 'mentor', label: '🧑‍🏫 Mentor — I want to guide others' },
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form,    setForm]    = useState({ name:'', email:'', password:'', confirm:'', role:'' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [apiErr,  setApiErr]  = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim())                      e.name     = 'Name is required'
    if (!form.email)                            e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email    = 'Enter a valid email'
    if (!form.password)                         e.password = 'Password is required'
    else if (form.password.length < 6)          e.password = 'Minimum 6 characters'
    if (form.confirm !== form.password)         e.confirm  = 'Passwords do not match'
    if (!form.role)                             e.role     = 'Please select a role'
    return e
  }

  const onChange = e => {
    const { name, value } = e.target
    setForm(p => ({ ...p, [name]: value }))
    if (errors[name]) setErrors(p => ({ ...p, [name]:'' }))
    setApiErr('')
  }

  const onSubmit = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setLoading(true)
    try {
      const data = await authService.register({
        name: form.name, email: form.email,
        password: form.password, role: form.role,
      })
      // Whether new signup or resent OTP — go to verify page
      navigate('/verify-email', {
        state: {
          email: form.email,
          resent: data.resent || false,
        }
      })
    } catch (err) {
      setApiErr(typeof err === 'string' ? err : 'Registration failed. Try again.')
    } finally { setLoading(false) }
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

        <div className="auth-card">
          <div className="auth-hdr">
            <h2>Create your account</h2>
            <p>Join thousands of engineers accelerating their careers</p>
          </div>

          {apiErr && <div className="auth-alert"><span>⚠</span> {apiErr}</div>}

          <form onSubmit={onSubmit} className="auth-form" noValidate>
            <Input label="Full name"        type="text"     name="name"     placeholder="Alex Chen"         value={form.name}     onChange={onChange} error={errors.name}     icon="◎" autoComplete="name"/>
            <Input label="Email"            type="email"    name="email"    placeholder="you@example.com"   value={form.email}    onChange={onChange} error={errors.email}    icon="◉" autoComplete="email"/>
            <Input label="Password"         type="password" name="password" placeholder="Min. 6 characters" value={form.password} onChange={onChange} error={errors.password} icon="◈" autoComplete="new-password"/>
            <Input label="Confirm password" type="password" name="confirm"  placeholder="Repeat password"   value={form.confirm}  onChange={onChange} error={errors.confirm}  icon="◈" autoComplete="new-password"/>
            <Select label="I am a…" name="role" value={form.role} onChange={onChange} options={ROLES} error={errors.role}/>

            <button type="submit" className="auth-submit btn-primary" disabled={loading}>
              {loading ? <><span className="spinner"/> Creating account…</> : 'Create account →'}
            </button>
          </form>

          <p className="auth-terms">
            By registering you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
          </p>
        </div>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}