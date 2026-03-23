import { useEffect, useRef } from 'react'
import './UI.css'

/* ── Input ── */
export function Input({ label, error, icon, className = '', ...props }) {
  return (
    <div className={`form-field ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <div className={`input-wrap ${icon ? 'has-icon' : ''} ${error ? 'has-error' : ''}`}>
        {icon && <span className="input-icon">{icon}</span>}
        <input className="form-input" {...props} />
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

/* ── Select ── */
export function Select({ label, error, options = [], className = '', ...props }) {
  return (
    <div className={`form-field ${className}`}>
      {label && <label className="form-label">{label}</label>}
      <div className={`input-wrap ${error ? 'has-error' : ''}`}>
        <select className="form-input form-select" {...props}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

/* ── Textarea ── */
export function Textarea({ label, error, ...props }) {
  return (
    <div className="form-field">
      {label && <label className="form-label">{label}</label>}
      <textarea className={`form-input form-textarea ${error ? 'has-error' : ''}`} {...props} />
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}

/* ── Modal ── */
export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef(null)

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else        document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}>
      <div className={`modal-box modal-${size}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

/* ── Empty state ── */
export function EmptyState({ icon = '◎', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  )
}

/* ── Stat card ── */
export function StatCard({ label, value, icon, color = 'accent' }) {
  return (
    <div className={`stat-card stat-card-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}
