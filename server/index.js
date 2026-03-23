require('dotenv').config();
const http    = require('http');
const app     = require('./app');
const { initSocket } = require('./services/socketService');
const connectDB       = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Create HTTP server (needed for Socket.io)
const server = http.createServer(app);

// Attach Socket.io
initSocket(server);

server.listen(PORT, () => {
  console.log(`\n🚀 MentorBridge server running on port ${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Docs: http://localhost:${PORT}/api/health\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});
