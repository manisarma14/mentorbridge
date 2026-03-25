import axios from 'axios'

const api = axios.create({
  baseURL: "https://mentorbridge-9oze.onrender.com/api", // ✅ HARD CODE
  timeout: 60000,
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