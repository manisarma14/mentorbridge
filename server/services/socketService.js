const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const User       = require('../models/User');
const Message    = require('../models/Message');

let io;
const onlineUsers = new Map(); // userId -> socketId

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'https://mentorbridge-frontend.vercel.app',
        'https://mentorbridge-9oze.onrender.com'
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // ── Auth middleware for sockets ──
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = await User.findById(decoded.id).select('-password');
      if (!socket.user) return next(new Error('User not found'));
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Mark user online
    await User.findByIdAndUpdate(userId, { isOnline: true });

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId });

    console.log(`🔌 Socket connected: ${socket.user.name} (${socket.id})`);

    // ── Send message ──
    socket.on('message:send', async (data) => {
      try {
        const { receiverId, content } = data;
        const conversationId = Message.getConversationId(userId, receiverId);

        const message = await Message.create({
          conversationId,
          sender:   userId,
          receiver: receiverId,
          content,
        });

        await message.populate('sender', 'name avatar');

        // Emit to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', message);
        }

        // Confirm back to sender
        socket.emit('message:sent', message);

        // Push notification to receiver
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('notification:new', {
            message: `New message from ${socket.user.name}`,
            type: 'message',
          });
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Typing indicators ──
    socket.on('typing:start', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:start', { senderId: userId, name: socket.user.name });
      }
    });

    socket.on('typing:stop', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing:stop', { senderId: userId });
      }
    });

    // ── Mark messages read ──
    socket.on('messages:read', async ({ senderId }) => {
      const conversationId = Message.getConversationId(userId, senderId);
      await Message.updateMany(
        { conversationId, receiver: userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );
      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages:read', { by: userId });
      }
    });

    // ── Disconnect ──
    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      socket.broadcast.emit('user:offline', { userId, lastSeen: new Date() });
      console.log(`🔌 Socket disconnected: ${socket.user.name}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

module.exports = { initSocket, getIO, onlineUsers };
