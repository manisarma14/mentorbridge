import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './AppLayout.css'

const NAV = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/mentors',   icon: '◈', label: 'Mentors'   },
  { to: '/roadmap',   icon: '◇', label: 'Roadmap'   },
  { to: '/chat',      icon: '◉', label: 'Messages'  },
  { to: '/progress',  icon: '▣', label: 'Progress'  },
  { to: '/settings',  icon: '◎', label: 'Settings'  },
]

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate         = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className={`app-layout ${collapsed ? 'collapsed' : ''}`}>
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⬡</span>
          {!collapsed && <span className="brand-name">MentorBridge</span>}
        </div>

        <button className="collapse-btn" onClick={() => setCollapsed(c => !c)}>
          {collapsed ? '›' : '‹'}
        </button>

        <nav className="sidebar-nav">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{user?.name}</span>
                <span className={`badge ${user?.role === 'mentor' ? 'badge-mint' : 'badge-accent'}`}>
                  {user?.role}
                </span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            {collapsed ? '↩' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="main-area">
        <header className="topbar">
          <div className="topbar-breadcrumb mono">
            mentorbridge<span style={{color:'var(--accent)'}}>/</span>
          </div>
          <div className="topbar-right">
            <button className="notif-btn" onClick={() => navigate('/settings')}>
              <span>◎</span>
              <span className="notif-dot"/>
            </button>
            <div className="topbar-avatar" onClick={() => navigate('/settings')}>
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            {/* Visible logout button in topbar too */}
            <button className="topbar-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  )
}