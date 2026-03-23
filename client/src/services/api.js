import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
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

    // Session expired
    if (err.response?.status === 401) {
      localStorage.removeItem('mb_token')
      localStorage.removeItem('mb_user')
      window.location.href = '/login'
    }

    // Email not verified — pass the full response data as the error
    // so LoginPage can detect emailUnverified flag
    if (err.response?.status === 403 && data?.emailUnverified) {
      return Promise.reject(data)
    }

    return Promise.reject(data?.message || err.message || 'Something went wrong')
  }
)

export default api
