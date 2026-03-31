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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
