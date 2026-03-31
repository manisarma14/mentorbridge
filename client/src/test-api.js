import api from './services/api'

const testAPI = async () => {
  console.log('🧪 Testing API connection...')
  
  try {
    // Test health endpoint
    console.log('Testing health endpoint...')
    const health = await api.get('/health')
    console.log('✅ Health:', health)
    
    // Test register endpoint
    console.log('Testing register endpoint...')
    const register = await api.post('/auth/register', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'test123456',
      role: 'mentee'
    })
    console.log('✅ Register:', register)
    
  } catch (error) {
    console.error('❌ API Error:', error)
  }
}

export default testAPI
