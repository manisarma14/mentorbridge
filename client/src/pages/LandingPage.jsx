import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Landing.css'

const FEATURES = [
  { icon:'◈', color:'accent', title:'AI Smart Search',       desc:'Type any goal or question. Get matched mentors, roadmaps, and curated resources instantly.' },
  { icon:'◉', color:'mint',   title:'Real-Time Chat',        desc:'Message mentors directly with online/offline status and read receipts powered by Socket.io.' },
  { icon:'⬡', color:'amber',  title:'Personalized Roadmaps', desc:'AI generates step-by-step learning paths tailored to your exact goals and skill gaps.' },
  { icon:'▣', color:'hot',    title:'Progress Tracking',     desc:'Visual milestones, completion analytics, and streak tracking to keep you accountable.' },
]
const STATS = [
  { value:'12K+', label:'Verified Mentors'   },
  { value:'98%',  label:'Match Accuracy'      },
  { value:'4.9★', label:'Average Rating'      },
  { value:'80K+', label:'Careers Accelerated' },
]

export default function LandingPage() {
  const { isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }

  return (
    <div className="landing">

      {/* ── Nav ── */}
      <nav className="l-nav">
        <div className="l-nav-inner container">
          <div className="l-logo">
            <span className="l-logo-icon">⬡</span>
            <span className="l-logo-text">MentorBridge</span>
          </div>
          <div className="l-nav-links">
            <a href="#features">Features</a>
            <a href="#stats">About</a>
          </div>
          <div className="l-nav-cta">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="btn-ghost">Dashboard</Link>
                <button className="btn-primary" onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link to="/login"    className="btn-ghost">Log in</Link>
                <Link to="/register" className="btn-primary">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-grid" aria-hidden="true"/>
        <div className="hero-blob b1" aria-hidden="true"/>
        <div className="hero-blob b2" aria-hidden="true"/>

        <div className="hero-content container">

          {/* Left — text */}
          <div className="hero-text">
            <div className="badge badge-accent animate-fade-up">◈ AI-Powered Career Acceleration</div>
            <h1 className="hero-title">
              Find Your Mentor.<br/>
              <span className="hero-gradient">Build Your Future.</span>
            </h1>
            <p className="hero-sub">
              MentorBridge uses AI to match you with the perfect mentor,
              generate personalized roadmaps, and track your growth —
              all in one powerful platform.
            </p>
            <div className="hero-cta">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary btn-lg">Go to Dashboard →</Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary btn-lg">Start for free →</Link>
                  <Link to="/login"    className="btn-ghost btn-lg">Explore mentors</Link>
                </>
              )}
            </div>
          </div>

          {/* Right — mock UI */}
          <div className="hero-mockup">
            <div className="mock-win">
              <div className="mock-bar">
                <span className="dot r"/><span className="dot y"/><span className="dot g"/>
                <span className="mock-url mono">mentorbridge.io/dashboard</span>
              </div>
              <div className="mock-body">
                <div className="mock-search-box">
                  <span style={{color:'var(--accent)'}}>⬡</span>
                  <span className="mock-placeholder">I want to become a machine learning engineer…</span>
                  <span className="mock-cursor"/>
                </div>
                {[
                  {a:'PS',c:'#6c63ff',p:98,b:'badge-mint'  },
                  {a:'JW',c:'#00d4aa',p:94,b:'badge-accent' },
                  {a:'AR',c:'#ffb830',p:91,b:'badge-amber'  },
                ].map((m,i) => (
                  <div key={i} className="mock-row">
                    <div className="mock-av" style={{background:`linear-gradient(135deg,${m.c},${m.c}88)`}}>{m.a}</div>
                    <div className="mock-lines">
                      <div className="mock-line w80"/>
                      <div className="mock-line w50 sm"/>
                    </div>
                    <span className={`badge ${m.b}`}>{m.p}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Stats ── */}
      <section className="stats-section" id="stats">
        <div className="container">
          <div className="stats-grid">
            {STATS.map(s => (
              <div key={s.label} className="stat-item">
                <div className="stat-num">{s.value}</div>
                <div className="stat-lbl">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="container">
          <div className="sec-header">
            <div className="badge badge-accent">Platform Features</div>
            <h2>Everything you need to grow</h2>
            <p>A complete career acceleration toolkit — not just a directory.</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card card">
                <div className={`f-icon f-${f.color}`}>{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <div className="cta-glow" aria-hidden="true"/>
            <div className="badge badge-mint">Free to join</div>
            <h2>Ready to accelerate your career?</h2>
            <p>Join thousands of engineers, designers, and product managers who leveled up with MentorBridge.</p>
            {isAuthenticated
              ? <Link to="/dashboard" className="btn-primary btn-lg">Go to Dashboard →</Link>
              : <Link to="/register"  className="btn-primary btn-lg">Create your account →</Link>
            }
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="l-footer">
        <div className="container">
          <div className="l-footer-brand">
            <span style={{color:'var(--accent)'}}>⬡</span> MentorBridge
          </div>
          <p className="mono" style={{fontSize:'.78rem',color:'var(--text-muted)'}}>
            © 2025 MentorBridge. Built for ambition.
          </p>
        </div>
      </footer>

    </div>
  )
}