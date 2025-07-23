const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const compression = require('compression')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const documentRoutes = require('./routes/documentRoutes')
const socketService = require('./services/socketService')
const { authenticateSocket } = require('./middleware/auth')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(helmet())
app.use(compression())
app.use(morgan('combined'))
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
app.use(limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/documents', documentRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Socket.io
io.use(authenticateSocket)
socketService.initialize(io)

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Something went wrong!' })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

const PORT = process.env.PORT || 5000

// Advanced document routes
const advancedDocumentRoutes = require('./routes/advancedDocumentRoutes')
app.use('/api/documents', advancedDocumentRoutes)


server.listen(PORT, () => {
  console.log(`��� GalaxyDocs server running on port ${PORT}`)
})

module.exports = { app, server, io }

