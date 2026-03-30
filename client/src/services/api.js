import axios from 'axios'

const api = axios.create({
  baseURL: "https://mentorbridge-9oze.onrender.com/api",
  timeout: 120000, // 2 minutes — Render free tier can take 60-90s to wake up
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('mb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const data = err.response?.data

    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return Promise.reject('Server is waking up, please try again in a moment.')
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('mb_token')
      localStorage.removeItem('mb_user')
    }

    if (err.response?.status === 403 && data?.emailUnverified) {
      return Promise.reject(data)
    }

    return Promise.reject(data?.message || err.message || 'Something went wrong')
  }
)

export default api