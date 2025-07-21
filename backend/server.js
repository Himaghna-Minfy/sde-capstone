const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());

// In-memory storage for demo (use database in production)
const documents = new Map();
const rooms = new Map();

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'GalaxyDocs API is running!',
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

app.get('/api/documents', (req, res) => {
  const docs = Array.from(documents.values());
  res.json({ documents: docs });
});

app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const doc = documents.get(id) || {
    id,
    title: `Document ${id}`,
    content: '<h1>Welcome to GalaxyDocs</h1><p>Start collaborating!</p>',
    lastModified: new Date().toISOString(),
    collaborators: []
  };
  
  documents.set(id, doc);
  res.json(doc);
});

app.post('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  
  const doc = documents.get(id) || { id };
  doc.title = title || doc.title;
  doc.content = content || doc.content;
  doc.lastModified = new Date().toISOString();
  
  documents.set(id, doc);
  res.json(doc);
});

// Socket.io real-time handling
io.on('connection', (socket) => {
  console.log(`í´Œ User connected: ${socket.id}`);
  
  // User joins a document room
  socket.on('join-document', (documentId) => {
    socket.join(documentId);
    console.log(`í³„ User ${socket.id} joined document ${documentId}`);
    
    // Add user to room tracking
    if (!rooms.has(documentId)) {
      rooms.set(documentId, new Set());
    }
    rooms.get(documentId).add(socket.id);
    
    // Notify others in the room
    socket.to(documentId).emit('user-joined', {
      id: socket.id,
      timestamp: new Date().toISOString()
    });
    
    // Send current document state
    const doc = documents.get(documentId);
    if (doc) {
      socket.emit('document-sync', doc);
    }
  });

  // Handle document content changes
  socket.on('document-change', (data) => {
    const { documentId, content, user } = data;
    
    // Update document in memory
    const doc = documents.get(documentId) || { id: documentId };
    doc.content = content;
    doc.lastModified = new Date().toISOString();
    documents.set(documentId, doc);
    
    // Broadcast to all other users in the room
    socket.to(documentId).emit('document-change', {
      documentId,
      content,
      user,
      timestamp: new Date().toISOString()
    });
  });

  // Handle cursor position changes
  socket.on('cursor-change', (data) => {
    const { documentId, position, user } = data;
    socket.to(documentId).emit('cursor-change', {
      userId: socket.id,
      position,
      user,
      timestamp: new Date().toISOString()
    });
  });

  // Handle user typing indicators
  socket.on('user-typing', (data) => {
    const { documentId, user, isTyping } = data;
    socket.to(documentId).emit('user-typing', {
      userId: socket.id,
      user,
      isTyping,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`í´Œ User disconnected: ${socket.id}`);
    
    // Remove user from all rooms
    for (const [documentId, users] of rooms.entries()) {
      if (users.has(socket.id)) {
        users.delete(socket.id);
        // Notify others in the room
        socket.to(documentId).emit('user-left', {
          userId: socket.id,
          timestamp: new Date().toISOString()
        });
        
        // Clean up empty rooms
        if (users.size === 0) {
          rooms.delete(documentId);
        }
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`íº€ GalaxyDocs server running on port ${PORT}`);
  console.log(`í³¡ WebSocket server ready for real-time collaboration`);
  console.log(`í¼Œ Galaxy-themed collaborative editing activated!`);
  console.log(`í´— Health check: http://localhost:${PORT}/health`);
  console.log(`í³š API endpoint: http://localhost:${PORT}/api/documents`);
  console.log(`\nâœ¨ Ready for cosmic collaboration!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});
