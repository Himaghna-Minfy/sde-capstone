const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import services and middleware
const { initializeFirebase } = require('./config/firebase');
const WebRTCService = require('./services/WebRTCService');

// Import routes
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);

// Initialize Firebase
try {
  initializeFirebase();
} catch (error) {
  console.error('âŒ Failed to initialize Firebase:', error);
  process.exit(1);
}

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize WebRTC service
const webrtcService = new WebRTCService(io);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later'
  }
});
app.use('/api', limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'GalaxyDocs API is running!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    connections: io.engine.clientsCount,
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);

// WebRTC info endpoint
app.get('/api/webrtc/info', (req, res) => {
  res.json({
    message: 'WebRTC service information',
    rooms: webrtcService.getAllRoomsInfo(),
    totalConnections: io.engine.clientsCount
  });
});

// Socket.IO connection handling (already handled in WebRTCService)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('í¼Œ ==========================================');
  console.log('íº€ GalaxyDocs Production Server Started');
  console.log('í¼Œ ==========================================');
  console.log(`í³¡ Server running on port ${PORT}`);
  console.log(`í´— API Health: http://localhost:${PORT}/health`);
  console.log(`í³š Documents API: http://localhost:${PORT}/api/documents`);
  console.log(`í´ Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`í±¥ Users API: http://localhost:${PORT}/api/users`);
  console.log(`í¼ WebRTC Info: http://localhost:${PORT}/api/webrtc/info`);
  console.log(`í´„ Real-time connections: ${io.engine.clientsCount}`);
  console.log(`ï¿½ï¿½ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('í¼Œ ==========================================');
  console.log('âœ¨ Ready for galactic collaboration!');
  console.log('í¼Œ ==========================================');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('í»‘ SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('âœ… Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('í»‘ SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('âœ… Process terminated');
  });
});

module.exports = { app, server, io };
