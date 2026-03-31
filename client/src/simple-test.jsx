import { useState, useEffect } from 'react'

function SimpleTest() {
  const [status, setStatus] = useState('Loading...')
  const [apiResponse, setApiResponse] = useState(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🧪 Testing API connection...')
        
        // Test 1: Direct fetch
        const response = await fetch('http://localhost:3001/api/health')
        const data = await response.json()
        
        console.log('✅ Direct fetch success:', data)
        setStatus('✅ Backend Connected!')
        setApiResponse(data)
        
      } catch (error) {
        console.error('❌ Direct fetch failed:', error)
        setStatus('❌ Network Error: ' + error.message)
        setApiResponse({ error: error.message })
      }
    }

    testConnection()
  }, [])

  return (
    <div style={{
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>🔍 MentorBridge Network Test</h1>
      
      <div style={{
        padding: '20px',
        background: '#f5f5f5',
        borderRadius: '8px',
        margin: '20px 0',
        minWidth: '400px'
      }}>
        <h3>{status}</h3>
        
        {apiResponse && (
          <div style={{ textAlign: 'left', marginTop: '20px' }}>
            <strong>API Response:</strong>
            <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px' }}>
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}
        
        <button 
          onClick={() => window.location.href = '/'}
          style={{
            background: '#667eea',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Back to App
        </button>
      </div>
    </div>
  )
}

export default SimpleTest
