import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth }  from './context/AuthContext'
import { SocketProvider }         from './context/SocketContext'

import LandingPage      from './pages/LandingPage'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import VerifyEmailPage  from './pages/VerifyEmailPage'
import DashboardPage    from './pages/DashboardPage'
import MentorsPage      from './pages/MentorsPage'
import ProfilePage      from './pages/ProfilePage'
import ChatPage         from './pages/ChatPage'
import RoadmapPage      from './pages/RoadmapPage'
import ProgressPage     from './pages/ProgressPage'
import SettingsPage     from './pages/SettingsPage'
import NotFoundPage     from './pages/NotFoundPage'
import AppLayout        from './components/layout/AppLayout'
import LoadingScreen    from './components/shared/LoadingScreen'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  console.log('🎯 Full MentorBridge App loading...')
  
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/"               element={<LandingPage />} />
            <Route path="/login"          element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register"       element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/verify-email"   element={<VerifyEmailPage />} />

            {/* Protected */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/dashboard"   element={<DashboardPage />} />
              <Route path="/mentors"     element={<MentorsPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/chat"        element={<ChatPage />} />
              <Route path="/chat/:id"    element={<ChatPage />} />
              <Route path="/roadmap"     element={<RoadmapPage />} />
              <Route path="/progress"    element={<ProgressPage />} />
              <Route path="/settings"    element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}
