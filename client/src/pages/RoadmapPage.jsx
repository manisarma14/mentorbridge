import { useState, useEffect } from 'react'
import { aiService } from '../services'
import './Roadmap.css'

export default function RoadmapPage() {
  const [goal,      setGoal]      = useState('')
  const [roadmaps,  setRoadmaps]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [generating,setGenerating]= useState(false)
  const [active,    setActive]    = useState(null)

  useEffect(() => {
    aiService.getRoadmaps()
      .then(d => { setRoadmaps(d.roadmaps || []); if (d.roadmaps?.length) setActive(d.roadmaps[0]) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const generate = async e => {
    e.preventDefault()
    if (!goal.trim()) return
    setGenerating(true)
    try {
      const data = await aiService.generateRoadmap(goal)
      const newRoadmap = data.roadmap
      setRoadmaps(prev => [newRoadmap, ...prev])
      setActive(newRoadmap)
      setGoal('')
    } catch {}
    finally { setGenerating(false) }
  }

  const toggleStep = async (stepId, current) => {
    if (!active) return
    try {
      const data = await aiService.updateStep(active._id, stepId, { isCompleted: !current })
      const updated = data.roadmap
      setActive(updated)
      setRoadmaps(prev => prev.map(r => r._id === updated._id ? updated : r))
    } catch {}
  }

  return (
    <div className="roadmap-page">
      <div className="roadmap-header">
        <h1>Learning Roadmaps</h1>
        <p>AI-generated step-by-step career paths tailored to your goals.</p>
      </div>

      {/* Generator */}
      <div className="roadmap-generator">
        <div className="badge badge-accent" style={{marginBottom:'12px'}}>⬡ AI Roadmap Generator</div>
        <form onSubmit={generate} className="gen-form">
          <input
            className="gen-input"
            placeholder="e.g. Become a backend engineer at Google, Transition to data science…"
            value={goal}
            onChange={e => setGoal(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={generating || !goal.trim()}>
            {generating ? <><span className="spinner"/> Generating…</> : '⬡ Generate Roadmap →'}
          </button>
        </form>
      </div>

      <div className="roadmap-grid">
        {/* List */}
        <div className="roadmap-list-panel">
          <h3>Your Roadmaps</h3>
          {loading ? (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {[1,2].map(i=><div key={i} className="skeleton" style={{height:'60px',borderRadius:'var(--r-md)'}}/>)}
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="no-roadmaps">
              <p>No roadmaps yet. Generate your first one above!</p>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
              {roadmaps.map(r => (
                <button
                  key={r._id}
                  className={`roadmap-item ${active?._id === r._id ? 'active' : ''}`}
                  onClick={() => setActive(r)}
                >
                  <div className="ri-title">{r.title}</div>
                  <div className="ri-progress">
                    <div className="ri-bar">
                      <div className="ri-fill" style={{width:`${r.progressPercent}%`}}/>
                    </div>
                    <span className="mono" style={{fontSize:'.7rem',color:'var(--accent)'}}>{r.progressPercent}%</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Active roadmap */}
        <div className="roadmap-detail">
          {!active ? (
            <div className="roadmap-placeholder">
              <div style={{fontSize:'2.5rem',opacity:.3}}>◇</div>
              <h3>Select a roadmap</h3>
              <p>Choose from the list or generate a new roadmap above.</p>
            </div>
          ) : (
            <>
              <div className="rd-header">
                <div>
                  <h2>{active.title}</h2>
                  <p style={{fontSize:'.85rem',color:'var(--text-muted)',marginTop:'4px'}}>{active.goal}</p>
                </div>
                <div className="rd-progress-circle">
                  <svg viewBox="0 0 56 56" width="56" height="56">
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--border)" strokeWidth="4"/>
                    <circle cx="28" cy="28" r="24" fill="none" stroke="var(--accent)" strokeWidth="4"
                      strokeDasharray={`${2*Math.PI*24*(active.progressPercent/100)} ${2*Math.PI*24*(1-active.progressPercent/100)}`}
                      strokeDashoffset={2*Math.PI*24*0.25} strokeLinecap="round"/>
                  </svg>
                  <span className="rd-pct mono">{active.progressPercent}%</span>
                </div>
              </div>

              <div className="steps-list">
                {active.steps?.map((step, i) => (
                  <div key={step._id || i} className={`step-item ${step.isCompleted ? 'done' : ''}`}>
                    <button className="step-check" onClick={() => toggleStep(step._id, step.isCompleted)}>
                      {step.isCompleted ? '✓' : String(i+1).padStart(2,'0')}
                    </button>
                    <div className="step-body">
                      <div className="step-title">{step.title}</div>
                      {step.description && <div className="step-desc">{step.description}</div>}
                      {step.resources?.length > 0 && (
                        <div className="step-resources">
                          {step.resources.map((r, ri) => (
                            <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                              <span className="resource-type">{r.type}</span>
                              {r.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
