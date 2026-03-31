import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('🚀 MentorBridge Frontend Loading...')
console.log('📦 Environment:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  MODE: import.meta.env.MODE
})

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
