import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { aiService, connectionService } from '../services'
import './Progress.css'

export default function ProgressPage() {
  const [roadmaps,     setRoadmaps]     = useState([])
  const [connections,  setConnections]  = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    Promise.all([
      aiService.getRoadmaps(),
      connectionService.getAll(),
    ]).then(([rm, cn]) => {
      setRoadmaps(rm.roadmaps || [])
      setConnections(cn.connections || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const totalSteps     = roadmaps.reduce((a, r) => a + (r.steps?.length || 0), 0)
  const completedSteps = roadmaps.reduce((a, r) => a + (r.steps?.filter(s => s.isCompleted).length || 0), 0)
  const overallPct     = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0
  const accepted       = connections.filter(c => c.status === 'accepted').length

  return (
    <div className="progress-page">
      <div className="progress-header">
        <h1>Progress Tracker</h1>
        <p>Track your learning milestones and career growth.</p>
      </div>

      {loading ? (
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
          {[1,2,3].map(i=><div key={i} className="skeleton" style={{height:'80px',borderRadius:'var(--r-lg)'}}/>)}
        </div>
      ) : (
        <>
          {/* Overview cards */}
          <div className="progress-overview">
            <div className="ov-card ov-accent">
              <div className="ov-icon">▣</div>
              <div className="ov-body">
                <div className="ov-val">{completedSteps}/{totalSteps}</div>
                <div className="ov-lbl">Steps Completed</div>
              </div>
              <div className="ov-pct">{overallPct}%</div>
            </div>
            <div className="ov-card ov-mint">
              <div className="ov-icon">◈</div>
              <div className="ov-body">
                <div className="ov-val">{roadmaps.length}</div>
                <div className="ov-lbl">Active Roadmaps</div>
              </div>
            </div>
            <div className="ov-card ov-amber">
              <div className="ov-icon">◉</div>
              <div className="ov-body">
                <div className="ov-val">{accepted}</div>
                <div className="ov-lbl">Active Mentors</div>
              </div>
            </div>
          </div>

          {/* Overall progress bar */}
          <div className="overall-progress">
            <div className="op-header">
              <span>Overall Progress</span>
              <span className="mono" style={{color:'var(--accent)',fontWeight:700}}>{overallPct}%</span>
            </div>
            <div className="op-track">
              <div className="op-fill" style={{width:`${overallPct}%`}}/>
            </div>
          </div>

          {/* Per-roadmap */}
          {roadmaps.length === 0 ? (
            <div className="progress-empty">
              <p>No roadmaps yet.</p>
              <Link to="/roadmap" className="btn-primary btn-sm" style={{marginTop:'10px'}}>Generate a Roadmap →</Link>
            </div>
          ) : (
            <div className="roadmap-progress-list">
              {roadmaps.map(r => {
                const done = r.steps?.filter(s => s.isCompleted).length || 0
                const total = r.steps?.length || 1
                const pct = Math.round((done / total) * 100)
                return (
                  <div key={r._id} className="rp-card">
                    <div className="rp-header">
                      <div>
                        <div className="rp-title">{r.title}</div>
                        <div className="rp-goal">{r.goal}</div>
                      </div>
                      <Link to="/roadmap" className="btn-ghost btn-sm">View →</Link>
                    </div>
                    <div className="rp-bar-row">
                      <div className="rp-track">
                        <div className="rp-fill" style={{width:`${pct}%`}}/>
                      </div>
                      <span className="mono rp-pct">{pct}%</span>
                    </div>
                    <div className="rp-steps">
                      {r.steps?.map((s, i) => (
                        <div key={i} className={`rp-step ${s.isCompleted ? 'done' : ''}`}>
                          <span>{s.isCompleted ? '✓' : String(i+1).padStart(2,'0')}</span>
                          <span>{s.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Connections */}
          {connections.length > 0 && (
            <div className="connections-section">
              <h3>Your Connections</h3>
              <div className="connections-list">
                {connections.map(c => {
                  const other = c.mentor || c.mentee
                  return (
                    <div key={c._id} className="conn-card">
                      <div className="conn-av">{other?.name?.[0]}</div>
                      <div className="conn-info">
                        <div className="conn-name">{other?.name}</div>
                        <div className="conn-role">{other?.role} @ {other?.company}</div>
                      </div>
                      <div className={`conn-status status-${c.status}`}>{c.status}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
