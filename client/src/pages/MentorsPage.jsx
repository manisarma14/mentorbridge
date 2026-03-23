import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { mentorService } from '../services'
import { useDebounce } from '../hooks'
import { EmptyState } from '../components/ui'
import './Mentors.css'

const DOMAINS = ['All','Engineering','AI/ML','Product','Data','Security','Leadership','Design']

export default function MentorsPage() {
  const [mentors,      setMentors]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [domain,       setDomain]       = useState('All')
  const [sortBy,       setSortBy]       = useState('rating')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [bookmarked,   setBookmarked]   = useState(new Set())
  const [total,        setTotal]        = useState(0)

  const debouncedSearch = useDebounce(search, 400)

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true)
      try {
        const params = { sort: sortBy, limit: 20 }
        if (debouncedSearch)  params.search   = debouncedSearch
        if (domain !== 'All') params.domain   = domain
        if (verifiedOnly)     params.verified = true
        const data = await mentorService.getAll(params)
        setMentors(data.mentors || [])
        setTotal(data.total || 0)
      } catch {
        setMentors([])
      } finally {
        setLoading(false)
      }
    }
    fetchMentors()
  }, [debouncedSearch, domain, sortBy, verifiedOnly])

  const toggleBookmark = async (e, id) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await mentorService.toggleBookmark(id)
      setBookmarked(prev => {
        const n = new Set(prev)
        n.has(id) ? n.delete(id) : n.add(id)
        return n
      })
    } catch {}
  }

  return (
    <div className="mentors-page">
      <div className="mentors-header">
        <div>
          <h1>Find Your Mentor</h1>
          <p>{total} verified industry experts ready to guide you</p>
        </div>
        <div className="badge badge-mint">⬡ AI-matched results</div>
      </div>

      <div className="filters-bar">
        <div className="filter-search-wrap">
          <span className="fsearch-icon">◎</span>
          <input className="fsearch-input" placeholder="Search by name, skill, company…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="domain-tabs">
          {DOMAINS.map(d => (
            <button key={d} className={`domain-tab ${domain === d ? 'active' : ''}`} onClick={() => setDomain(d)}>{d}</button>
          ))}
        </div>
        <div className="filter-row">
          <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="rating">Sort: Top Rated</option>
            <option value="sessions">Sort: Most Sessions</option>
            <option value="newest">Sort: Newest</option>
          </select>
          <label className="verified-toggle">
            <input type="checkbox" checked={verifiedOnly} onChange={e => setVerifiedOnly(e.target.checked)}/>
            <span>Verified only</span>
          </label>
        </div>
      </div>

      <div className="results-meta mono">
        Showing <strong style={{color:'var(--text-primary)'}}>{mentors.length}</strong> mentors
      </div>

      {loading ? (
        <div className="mentors-grid">
          {[...Array(6)].map((_,i) => (
            <div key={i} className="skeleton" style={{height:'240px',borderRadius:'var(--r-lg)'}}/>
          ))}
        </div>
      ) : mentors.length === 0 ? (
        <EmptyState icon="◎" title="No mentors found" message="Try adjusting your filters or search query."/>
      ) : (
        <div className="mentors-grid">
          {mentors.map((m, i) => (
            <Link key={m._id} to={`/profile/${m._id}`}
              className="mentor-card card"
              style={{animationDelay:`${i*50}ms`,animationFillMode:'both',animation:'fadeUp .4s ease both',textDecoration:'none'}}>
              <div className="mc-header">
                <div className="mc-avatar" style={{background:'linear-gradient(135deg,var(--accent),#8b83ff)'}}>
                  {m.name?.[0]}
                </div>
                <div className="mc-meta">
                  <div className="mc-name">
                    {m.name}
                    {m.isVerified && <span className="v-badge">✓</span>}
                  </div>
                  <div className="mc-role">{m.role} @ {m.company}</div>
                  <div className="mc-exp mono">{m.experience}</div>
                </div>
                <button className={`bm-btn ${bookmarked.has(m._id) ? 'active' : ''}`}
                  onClick={e => toggleBookmark(e, m._id)}>
                  {bookmarked.has(m._id) ? '★' : '☆'}
                </button>
              </div>
              <div className="mc-skills">
                {m.skills?.slice(0,4).map(s => <span key={s} className="skill-chip">{s}</span>)}
              </div>
              <div className="mc-stats">
                <div className="mcs"><span className="mcs-val">{m.rating}★</span><span className="mcs-lbl">Rating</span></div>
                <div className="mcs"><span className="mcs-val">{m.totalSessions}</span><span className="mcs-lbl">Sessions</span></div>
                <div className="mcs"><span className="mcs-val" style={{color:'var(--accent-mint)'}}>{m.totalReviews}</span><span className="mcs-lbl">Reviews</span></div>
              </div>
              <div className="mc-actions">
                <span className="btn-ghost btn-sm" style={{flex:1,textAlign:'center'}}>View Profile</span>
                <button className="btn-primary btn-sm" style={{flex:1}} onClick={e => {e.preventDefault(); e.stopPropagation()}}>Connect →</button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
