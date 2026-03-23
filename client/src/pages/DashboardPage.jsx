import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { mentorService, aiService } from '../services'
import { StatCard, EmptyState } from '../components/ui'
import './Dashboard.css'

const ACTIVITY = [
  { icon:'◈', text:'Complete your profile to improve matches', time:'Now',    type:'accent' },
  { icon:'◉', text:'Welcome to MentorBridge! Browse mentors to get started', time:'Just now', type:'mint' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [query,     setQuery]     = useState('')
  const [searching, setSearching] = useState(false)
  const [aiResult,  setAiResult]  = useState(null)
  const [mentors,   setMentors]   = useState([])
  const [loadingM,  setLoadingM]  = useState(true)

  useEffect(() => {
    mentorService.getAll({ limit: 3, sort: 'rating' })
      .then(d => setMentors(d.mentors || []))
      .catch(() => {})
      .finally(() => setLoadingM(false))
  }, [])

  const handleSearch = async e => {
    e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setAiResult(null)
    try {
      const data = await aiService.search(query)
      setAiResult(data)
    } catch { /* handle */ }
    finally { setSearching(false) }
  }

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dash-header">
        <div>
          <p className="dash-greet mono">Good morning,</p>
          <h1 className="dash-title">{user?.name?.split(' ')[0]} 👋</h1>
          <p>Here's your career snapshot for today.</p>
        </div>
        <div className="dash-stats-mini">
          <div className="mini-stat"><span className="mini-val">0</span><span className="mini-lbl">Connections</span></div>
          <div className="mini-stat"><span className="mini-val">0</span><span className="mini-lbl">Sessions</span></div>
          <div className="mini-stat"><span className="mini-val">0%</span><span className="mini-lbl">Roadmap</span></div>
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <StatCard label="Mentors Available" value="12K+"  icon="◈" color="accent" />
        <StatCard label="Avg Match Score"   value="98%"   icon="⬡" color="mint"   />
        <StatCard label="Avg Rating"        value="4.9★"  icon="★" color="amber"  />
        <StatCard label="Careers Helped"    value="80K+"  icon="▣" color="hot"    />
      </div>

      {/* AI Search */}
      <div className="ai-section">
        <div className="ai-label">
          <span className="badge badge-accent">⬡ AI-Powered Search</span>
          <span style={{fontSize:'.8rem',color:'var(--text-muted)'}}>Type anything — goals, skills, questions</span>
        </div>
        <form onSubmit={handleSearch} className="ai-form">
          <div className="ai-box">
            <span className="ai-icon">⬡</span>
            <input
              className="ai-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. I want to become a machine learning engineer at a top company"

            />
            <button type="submit" className="btn-primary ai-btn" disabled={searching}>
              {searching ? <span className="spinner"/> : 'Ask AI →'}
            </button>
          </div>
        </form>

        {aiResult && (
          <div className="ai-result animate-fade-up">
            <div className="ai-result-header">
              <span className="badge badge-mint">◈ Analysis Complete</span>
              <span style={{fontSize:'.875rem',color:'var(--text-secondary)'}}>
                Detected: <strong style={{color:'var(--text-primary)'}}>{aiResult.analysis?.intent}</strong>
              </span>
            </div>
            <div className="ai-result-body">
              <div>
                <h4 className="ai-col-title">Key Skills</h4>
                <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'10px'}}>
                  {aiResult.analysis?.skills?.map(s => <span key={s} className="badge badge-accent">{s}</span>)}
                </div>
              </div>
              <div>
                <h4 className="ai-col-title">Roadmap</h4>
                <ol style={{listStyle:'none',marginTop:'10px',display:'flex',flexDirection:'column',gap:'8px'}}>
                  {aiResult.analysis?.roadmap?.map((r, i) => (
                    <li key={i} style={{display:'flex',alignItems:'flex-start',gap:'10px',fontSize:'.875rem',color:'var(--text-secondary)'}}>
                      <span className="mono" style={{color:'var(--accent)',fontSize:'.75rem',paddingTop:'1px',minWidth:'22px'}}>
                        {String(i+1).padStart(2,'0')}
                      </span>
                      <span>{r.step || r}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
            {aiResult.mentors?.length > 0 && (
              <div style={{marginTop:'16px'}}>
                <h4 className="ai-col-title">Matched Mentors</h4>
                <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'10px'}}>
                  {aiResult.mentors.map(m => (
                    <Link key={m._id} to={`/profile/${m._id}`}
                      style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 14px',background:'var(--surface-float)',borderRadius:'var(--r-md)',border:'1px solid var(--border)',textDecoration:'none',transition:'all var(--t-mid)'}}>
                      <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'linear-gradient(135deg,var(--accent),#8b83ff)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:'.75rem',color:'white'}}>
                        {m.name?.[0]}
                      </div>
                      <div>
                        <div style={{fontSize:'.85rem',fontWeight:600,color:'var(--text-primary)'}}>{m.name}</div>
                        <div style={{fontSize:'.72rem',color:'var(--text-muted)'}}>{m.company}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main grid */}
      <div className="dash-grid">
        {/* Recommended mentors */}
        <div className="dash-panel">
          <div className="panel-hdr">
            <h3>Recommended Mentors</h3>
            <Link to="/mentors" className="panel-link">See all →</Link>
          </div>
          {loadingM ? (
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:'56px',borderRadius:'var(--r-md)'}}/>)}
            </div>
          ) : mentors.length === 0 ? (
            <EmptyState icon="◈" title="No mentors yet" message="The database is empty. Run the seed script."/>
          ) : (
            <div className="mentor-list">
              {mentors.map(m => (
                <Link key={m._id} to={`/profile/${m._id}`} className="mentor-row">
                  <div className="m-av" style={{background:'linear-gradient(135deg,var(--accent),#8b83ff)'}}>
                    {m.name?.[0]}
                  </div>
                  <div className="m-info">
                    <div className="m-name">{m.name} {m.isVerified && <span className="v-badge">✓</span>}</div>
                    <div className="m-role">{m.role} @ {m.company}</div>
                    <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginTop:'3px'}}>
                      {m.skills?.slice(0,2).map(s=><span key={s} className="skill-chip">{s}</span>)}
                    </div>
                  </div>
                  <div className="m-rating">{m.rating}★</div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div className="dash-panel">
          <div className="panel-hdr"><h3>Recent Activity</h3></div>
          <div className="activity-feed">
            {ACTIVITY.map((a, i) => (
              <div key={i} className={`activity-item act-${a.type}`}>
                <span className="act-icon">{a.icon}</span>
                <div className="act-body">
                  <span>{a.text}</span>
                  <span className="act-time mono">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="dash-panel dash-panel-full">
          <div className="panel-hdr"><h3>Quick Actions</h3></div>
          <div className="quick-actions">
            {[
              { to:'/mentors',  icon:'◈', label:'Browse Mentors',    desc:'Find your perfect mentor match'        },
              { to:'/roadmap',  icon:'◇', label:'Generate Roadmap',  desc:'AI-powered career path for your goals' },
              { to:'/chat',     icon:'◉', label:'Open Messages',     desc:'Chat with your connections'            },
              { to:'/progress', icon:'▣', label:'Track Progress',    desc:'View your learning milestones'         },
            ].map(a => (
              <Link key={a.to} to={a.to} className="quick-card">
                <span className="quick-icon">{a.icon}</span>
                <div><div className="quick-label">{a.label}</div><div className="quick-desc">{a.desc}</div></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
