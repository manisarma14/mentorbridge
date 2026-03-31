import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState(new Set())

  useEffect(() => {
    if (!isAuthenticated || !token) return

    const socket = io(import.meta.env.VITE_SOCKET_URL || '/', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      setConnected(true)
      console.log('Socket connected:', socket.id)
    })

    socket.on('disconnect', () => setConnected(false))

    socket.on('user:online',  ({ userId }) => setOnlineUsers(prev => new Set([...prev, userId])))
    socket.on('user:offline', ({ userId }) => setOnlineUsers(prev => { const n = new Set(prev); n.delete(userId); return n }))

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [isAuthenticated, token])

  const emit  = (event, data) => socketRef.current?.emit(event, data)
  const onEvt = (event, cb)   => { socketRef.current?.on(event, cb); return () => socketRef.current?.off(event, cb) }

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, onlineUsers, emit, on: onEvt }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)
