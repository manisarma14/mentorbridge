import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services'
import { Input, Textarea } from '../components/ui'
import './Settings.css'

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const [tab,     setTab]     = useState('profile')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [profile, setProfile] = useState({
    name:       user?.name       || '',
    bio:        user?.bio        || '',
    location:   user?.location   || '',
    linkedin:   user?.linkedin   || '',
    company:    user?.company    || '',
    experience: user?.experience || '',
    domain:     user?.domain     || '',
    skills:     user?.skills?.join(', ') || '',
    goals:      user?.goals?.join(', ')  || '',
  })
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [pwErr,  setPwErr]  = useState('')

  const onProfileChange = e => {
    const { name, value } = e.target
    setProfile(p => ({ ...p, [name]: value }))
    setSaved(false)
  }

  const saveProfile = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...profile,
        skills: profile.skills.split(',').map(s => s.trim()).filter(Boolean),
        goals:  profile.goals.split(',').map(s => s.trim()).filter(Boolean),
      }
      const data = await authService.updateMe(payload)
      updateUser(data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {}
    finally { setSaving(false) }
  }

  const savePassword = async e => {
    e.preventDefault()
    setPwErr('')
    if (pwForm.newPassword !== pwForm.confirm) { setPwErr('Passwords do not match'); return }
    setSaving(true)
    try {
      await authService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword })
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setPwErr(typeof err === 'string' ? err : 'Failed to change password')
    } finally { setSaving(false) }
  }

  return (
    <div className="settings-page">
      <div className="settings-header"><h1>Settings</h1><p>Manage your account and preferences.</p></div>

      <div className="settings-layout">
        <aside className="settings-nav">
          {['profile','security','notifications'].map(t => (
            <button key={t} className={`settings-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </aside>

        <div className="settings-body">
          {tab === 'profile' && (
            <form onSubmit={saveProfile} className="settings-form">
              <div className="settings-section-title">Profile Information</div>
              <div className="form-grid-2">
                <Input label="Full name"    name="name"       value={profile.name}       onChange={onProfileChange} icon="◎"/>
                <Input label="Location"     name="location"   value={profile.location}   onChange={onProfileChange} icon="◇"/>
                <Input label="Company"      name="company"    value={profile.company}    onChange={onProfileChange} icon="◈"/>
                <Input label="Experience"   name="experience" value={profile.experience} onChange={onProfileChange} icon="▣"/>
                <Input label="Domain"       name="domain"     value={profile.domain}     onChange={onProfileChange} icon="⬡"/>
                <Input label="LinkedIn URL" name="linkedin"   value={profile.linkedin}   onChange={onProfileChange} icon="◉"/>
              </div>
              <Textarea label="Bio" name="bio" value={profile.bio} onChange={onProfileChange} placeholder="Tell mentors/mentees about yourself…" rows={3}/>
              <Input label="Skills (comma separated)" name="skills" value={profile.skills} onChange={onProfileChange} placeholder="React, Node.js, Python…" icon="◈"/>
              <Input label="Goals (comma separated)"  name="goals"  value={profile.goals}  onChange={onProfileChange} placeholder="Get a FAANG job, Learn system design…" icon="◇"/>
              <div className="settings-actions">
                {saved && <span className="saved-msg">✓ Saved successfully</span>}
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner"/> Saving…</> : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {tab === 'security' && (
            <form onSubmit={savePassword} className="settings-form">
              <div className="settings-section-title">Change Password</div>
              {pwErr && <div className="auth-alert" style={{marginBottom:'10px'}}><span>⚠</span> {pwErr}</div>}
              <Input label="Current Password" type="password" name="currentPassword" value={pwForm.currentPassword} onChange={e => setPwForm(p=>({...p,currentPassword:e.target.value}))} icon="◈" autoComplete="current-password"/>
              <Input label="New Password"     type="password" name="newPassword"     value={pwForm.newPassword}     onChange={e => setPwForm(p=>({...p,newPassword:e.target.value}))}     icon="◈" autoComplete="new-password"/>
              <Input label="Confirm Password" type="password" name="confirm"         value={pwForm.confirm}         onChange={e => setPwForm(p=>({...p,confirm:e.target.value}))}         icon="◈" autoComplete="new-password"/>
              <div className="settings-actions">
                {saved && <span className="saved-msg">✓ Password updated</span>}
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner"/> Updating…</> : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          {tab === 'notifications' && (
            <div className="settings-form">
              <div className="settings-section-title">Notification Preferences</div>
              {[
                { label:'New connection requests',  desc:'Get notified when someone sends you a mentorship request' },
                { label:'New messages',             desc:'Receive notifications for new chat messages'              },
                { label:'Roadmap reminders',        desc:'Weekly reminders to continue your learning roadmap'       },
                { label:'Product updates',          desc:'News about new MentorBridge features'                     },
              ].map((n, i) => (
                <div key={i} className="notif-row">
                  <div>
                    <div className="notif-label">{n.label}</div>
                    <div className="notif-desc">{n.desc}</div>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked={i < 2}/>
                    <span className="toggle-track"><span className="toggle-thumb"/></span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
