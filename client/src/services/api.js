import axios from 'axios'

const api = axios.create({
  baseURL: "https://mentorbridge-9oze.onrender.com/api",
  timeout: 120000,
  headers: { 'Content-Type': 'application/json' },
})

// ─────────────────────────────
// REQUEST INTERCEPTOR
// ─────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─────────────────────────────
// RESPONSE INTERCEPTOR (FIXED)
// ─────────────────────────────
api.interceptors.response.use(
  res => res.data,
  err => {
    console.log("🔥 AXIOS ERROR:", err);   // ✅ ADD THIS

    const data = err.response?.data

    // ⏱ Timeout (Render cold start)
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return Promise.reject('Server is waking up, please try again in a moment.')
    }

    // 🔐 Unauthorized
    if (err.response?.status === 401) {
      localStorage.removeItem('mb_token')
      localStorage.removeItem('mb_user')
      return Promise.reject('Session expired. Please login again.')
    }

    // 📧 Email not verified
    if (err.response?.status === 403 && data?.emailUnverified) {
      return Promise.reject(data)
    }

    // ✅ SHOW REAL BACKEND ERROR
    if (data?.message) {
      return Promise.reject(data.message)
    }

    // ❗ fallback (but now rare)
    return Promise.reject(err.message || 'Unexpected error occurred')
  }
)

export default api