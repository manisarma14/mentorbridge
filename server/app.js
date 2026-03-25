console.log("🔥 FINAL DEPLOY WORKING");
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// ── Security ──
app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true,
}));

// ── Rate limiting ──
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Body parsing ──
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ──
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'MentorBridge API is running', timestamp: new Date() });
});

app.get('/manitest', (req, res) => {
  res.send("MANI TEST WORKING");
});

// ── Routes ──
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/mentors', require('./routes/mentorRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ── 404 + Error handlers ──
app.use(notFound);
app.use(errorHandler);

module.exports = app;console.log("🔥 FINAL DEPLOY WORKING");

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// ─────────────────────────────────────
// 🔐 Security Middleware
// ─────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true,
}));

// ─────────────────────────────────────
// 🚦 Rate Limiting
// ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
});

app.use('/api/', limiter);

// ─────────────────────────────────────
// 📦 Body Parsing
// ─────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────
// 📊 Logging
// ─────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─────────────────────────────────────
// 🏥 Health Check
// ─────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'MentorBridge API is running',
    timestamp: new Date(),
  });
});

// ─────────────────────────────────────
// 🔥 BASE API ROUTE (FIX FOR YOUR ERROR)
// ─────────────────────────────────────
app.get('/api', (_req, res) => {
  res.json({
    success: true,
    message: 'MentorBridge API running 🚀',
    version: '1.0',
  });
});

// Optional test route
app.get('/manitest', (req, res) => {
  res.send("MANI TEST WORKING");
});

// ─────────────────────────────────────
// 🔗 Routes
// ─────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/mentors', require('./routes/mentorRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/connections', require('./routes/connectionRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ─────────────────────────────────────
// ❌ 404 + Error Handling
// ─────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;