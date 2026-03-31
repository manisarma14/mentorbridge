import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🚀 MentorBridge Starting...')
console.log('📦 API URL:', import.meta.env.VITE_API_URL)
console.log('📦 Socket URL:', import.meta.env.VITE_SOCKET_URL)

// Simple test to ensure React is working
const root = document.getElementById('root')
if (!root) {
  console.error('❌ Root element not found!')
} else {
  console.log('✅ Root element found, mounting React app...')
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
