import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { messageService } from '../services'
import './Chat.css'

export default function ChatPage() {
  const { id: activeChatId } = useParams()
  const { user }   = useAuth()
  const socket     = useSocket()
  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)

  const [conversations, setConversations] = useState([])
  const [messages,      setMessages]      = useState([])
  const [activeConv,    setActiveConv]    = useState(null)
  const [text,          setText]          = useState('')
  const [typing,        setTyping]        = useState(false)
  const [remoteTyping,  setRemoteTyping]  = useState(false)
  const typingTimer = useRef(null)

  // Load conversations
  useEffect(() => {
    messageService.getConversations()
      .then(d => setConversations(d.conversations || []))
      .catch(() => {})
  }, [])

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChatId) return
    messageService.getMessages(activeChatId)
      .then(d => {
        setMessages(d.messages || [])
        socket?.emit('messages:read', { senderId: activeChatId })
      })
      .catch(() => {})
  }, [activeChatId]) // eslint-disable-line

  // Socket listeners
  useEffect(() => {
    if (!socket?.on) return
    const off1 = socket.on('message:receive', msg => {
      if (msg.sender._id === activeChatId || msg.sender === activeChatId) {
        setMessages(prev => [...prev, msg])
      }
    })
    const off2 = socket.on('message:sent', msg => {
      setMessages(prev => [...prev, msg])
    })
    const off3 = socket.on('typing:start', ({ senderId }) => {
      if (senderId === activeChatId) setRemoteTyping(true)
    })
    const off4 = socket.on('typing:stop', ({ senderId }) => {
      if (senderId === activeChatId) setRemoteTyping(false)
    })
    return () => { off1?.(); off2?.(); off3?.(); off4?.() }
  }, [socket, activeChatId])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, remoteTyping])

  const sendMessage = useCallback(() => {
    if (!text.trim() || !activeChatId) return
    socket?.emit('message:send', { receiverId: activeChatId, content: text.trim() })
    setText('')
    clearTimeout(typingTimer.current)
    socket?.emit('typing:stop', { receiverId: activeChatId })
    setTyping(false)
  }, [text, activeChatId, socket])

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleTyping = e => {
    setText(e.target.value)
    if (!typing) {
      setTyping(true)
      socket?.emit('typing:start', { receiverId: activeChatId })
    }
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => {
      setTyping(false)
      socket?.emit('typing:stop', { receiverId: activeChatId })
    }, 1500)
  }

  const formatTime = ts => new Date(ts).toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})

  return (
    <div className="chat-page">
      {/* Sidebar — conversations */}
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <h3>Messages</h3>
          {socket?.connected && <span className="online-dot" title="Connected"/>}
        </div>
        {conversations.length === 0 ? (
          <div className="chat-empty-convs">
            <p>No conversations yet.</p>
            <Link to="/mentors" className="btn-primary btn-sm" style={{marginTop:'10px'}}>Find Mentors →</Link>
          </div>
        ) : (
          <div className="conv-list">
            {conversations.map(conv => (
              <Link
                key={conv._id}
                to={`/chat/${conv.participant?._id}`}
                className={`conv-item ${conv.participant?._id === activeChatId ? 'active' : ''}`}
              >
                <div className="conv-avatar">
                  {conv.participant?.name?.[0] || '?'}
                  {socket?.onlineUsers?.has(conv.participant?._id) && <span className="online-badge"/>}
                </div>
                <div className="conv-info">
                  <div className="conv-name">{conv.participant?.name}</div>
                  <div className="conv-last">{conv.lastMessage?.content?.slice(0,35)}…</div>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="unread-badge">{conv.unreadCount}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="chat-main">
        {!activeChatId ? (
          <div className="chat-placeholder">
            <div className="chat-placeholder-icon">◉</div>
            <h3>Select a conversation</h3>
            <p>Choose a conversation from the sidebar or connect with a mentor to start chatting.</p>
            <Link to="/mentors" className="btn-primary">Browse Mentors →</Link>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <div className="chat-header-av">?</div>
              <div className="chat-header-info">
                <div className="chat-header-name">Conversation</div>
                {remoteTyping && <div className="typing-indicator">typing…</div>}
              </div>
            </div>

            <div className="messages-area">
              {messages.length === 0 && (
                <div className="no-messages">
                  <p>No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map((msg, i) => {
                const isMine = msg.sender?._id === user?._id || msg.sender === user?._id
                return (
                  <div key={msg._id || i} className={`msg-row ${isMine ? 'mine' : 'theirs'}`}>
                    {!isMine && (
                      <div className="msg-avatar">{msg.sender?.name?.[0] || '?'}</div>
                    )}
                    <div className="msg-bubble">
                      <div className="msg-content">{msg.content}</div>
                      <div className="msg-time">{formatTime(msg.createdAt)}</div>
                    </div>
                  </div>
                )
              })}
              {remoteTyping && (
                <div className="msg-row theirs">
                  <div className="msg-avatar">…</div>
                  <div className="msg-bubble typing-bubble">
                    <span/><span/><span/>
                  </div>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                className="chat-input"
                placeholder="Type a message…"
                value={text}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button className="send-btn btn-primary" onClick={sendMessage} disabled={!text.trim()}>
                ↑
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
