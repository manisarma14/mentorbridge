import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { mentorService, connectionService } from '../services'
import { Modal, Textarea } from '../components/ui'
import './Profile.css'

export default function ProfilePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [mentor,    setMentor]    = useState(null)
  const [reviews,   setReviews]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [connMsg,   setConnMsg]   = useState('')
  const [sending,   setSending]   = useState(false)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    mentorService.getById(id)
      .then(d => { setMentor(d.mentor); setReviews(d.reviews || []) })
      .catch(() => navigate('/mentors'))
      .finally(() => setLoading(false))
  }, [id]) // eslint-disable-line

  const sendConnection = async () => {
    setSending(true)
    try {
      await connectionService.send({ mentorId: id, message: connMsg })
      setConnected(true)
      setShowModal(false)
    } catch {}
    finally { setSending(false) }
  }

  if (loading) return (
    <div style={{display:'flex',flexDirection:'column',gap:'16px',maxWidth:'1100px'}}>
      {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:'80px',borderRadius:'var(--r-lg)'}}/>)}
    </div>
  )

  if (!mentor) return null

  return (
    <div className="profile-page">
      <Link to="/mentors" className="back-link">← Back to Mentors</Link>

      <div className="profile-grid">
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar" style={{background:'linear-gradient(135deg,var(--accent),#8b83ff)'}}>
              {mentor.name?.[0]}
            </div>
            {mentor.isVerified && <div className="verified-pill">✓ Verified</div>}
          </div>

          <div className="profile-identity">
            <h2>{mentor.name}</h2>
            <p className="p-role">{mentor.role} @ {mentor.company}</p>
            <p className="p-exp mono">{mentor.experience}</p>
          </div>

          <div className="profile-stats">
            <div className="pstat"><span className="pstat-val">{mentor.rating}★</span><span className="pstat-lbl">Rating</span></div>
            <div className="pstat"><span className="pstat-val">{mentor.totalSessions}</span><span className="pstat-lbl">Sessions</span></div>
            <div className="pstat"><span className="pstat-val">{mentor.totalReviews}</span><span className="pstat-lbl">Reviews</span></div>
          </div>

          <div className="profile-actions">
            <button
              className="btn-primary"
              style={{width:'100%',justifyContent:'center',padding:'.85rem'}}
              onClick={() => setShowModal(true)}
              disabled={connected}
            >
              {connected ? '✓ Request Sent' : 'Request Mentorship →'}
            </button>
            <Link to={`/chat`} className="btn-ghost" style={{width:'100%',justifyContent:'center',padding:'.75rem'}}>
              💬 Message
            </Link>
          </div>

          {mentor.location && (
            <div className="p-detail">
              <div className="p-detail-lbl">Location</div>
              <div className="p-detail-val">{mentor.location}</div>
            </div>
          )}
          {mentor.linkedin && (
            <div className="p-detail">
              <div className="p-detail-lbl">LinkedIn</div>
              <a href={`https://${mentor.linkedin}`} target="_blank" rel="noopener noreferrer" className="p-detail-link">{mentor.linkedin}</a>
            </div>
          )}
          {mentor.domain && (
            <div className="p-detail">
              <div className="p-detail-lbl">Domain</div>
              <span className="badge badge-accent">{mentor.domain}</span>
            </div>
          )}
        </aside>

        {/* Main content */}
        <div className="profile-main">
          {mentor.bio && (
            <section className="p-section">
              <h3>About</h3>
              <p>{mentor.bio}</p>
            </section>
          )}

          <section className="p-section">
            <h3>Expertise</h3>
            <div style={{display:'flex',flexWrap:'wrap',gap:'8px',marginTop:'12px'}}>
              {mentor.skills?.map(s => <span key={s} className="badge badge-accent" style={{fontSize:'.8rem'}}>{s}</span>)}
            </div>
          </section>

          <section className="p-section">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
              <h3>Reviews ({reviews.length})</h3>
            </div>
            {reviews.length === 0 ? (
              <p style={{fontSize:'.875rem',color:'var(--text-muted)'}}>No reviews yet. Be the first to review!</p>
            ) : (
              <div className="reviews-list">
                {reviews.map((r, i) => (
                  <div key={i} className="review-card">
                    <div className="review-hdr">
                      <div className="review-av">{r.mentee?.name?.[0] || '?'}</div>
                      <div>
                        <div className="review-name">{r.mentee?.name || 'Anonymous'}</div>
                        <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div>
                      </div>
                      <div className="review-date mono">
                        {new Date(r.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                      </div>
                    </div>
                    <p className="review-text">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Connection modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Request Mentorship">
        <div style={{display:'flex',flexDirection:'column',gap:'18px'}}>
          <p>Send a connection request to <strong>{mentor.name}</strong>. Add a personal message to improve your chances.</p>
          <Textarea
            label="Your message (optional)"
            placeholder="Hi! I'm interested in your mentorship because…"
            value={connMsg}
            onChange={e => setConnMsg(e.target.value)}
            rows={4}
          />
          <div style={{display:'flex',gap:'10px'}}>
            <button className="btn-ghost" style={{flex:1,justifyContent:'center'}} onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn-primary" style={{flex:1,justifyContent:'center'}} onClick={sendConnection} disabled={sending}>
              {sending ? <><span className="spinner"/> Sending…</> : 'Send Request →'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
