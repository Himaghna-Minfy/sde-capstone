class WebRTCService {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      socket.on('join-document', (documentId) => {
        this.joinRoom(socket, documentId);
      });

      socket.on('document-change', (data) => {
        this.broadcastDocumentChange(socket, data);
      });

      socket.on('cursor-change', (data) => {
        this.broadcastCursorChange(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  joinRoom(socket, documentId) {
    socket.join(documentId);
    socket.documentId = documentId;
    if (!this.rooms.has(documentId)) {
      this.rooms.set(documentId, new Set());
    }
    this.rooms.get(documentId).add(socket.id);
    socket.to(documentId).emit('user-joined', { socketId: socket.id });
    console.log(`📄 User ${socket.id} joined document ${documentId}`);
  }

  broadcastDocumentChange(socket, data) {
    socket.to(data.documentId).emit('document-change', data);
  }

  broadcastCursorChange(socket, data) {
    socket.to(data.documentId).emit('cursor-change', data);
  }

  handleDisconnect(socket) {
    console.log(`🔌 User disconnected: ${socket.id}`);
    if (socket.documentId) {
      const room = this.rooms.get(socket.documentId);
      if (room) {
        room.delete(socket.id);
        socket.to(socket.documentId).emit('user-left', { socketId: socket.id });
        if (room.size === 0) {
          this.rooms.delete(socket.documentId);
        }
      }
    }
  }

  getAllRoomsInfo() {
    // Returns an array of basic info about each room
    const results = [];
    this.rooms.forEach((connections, docId) => {
      results.push({
        documentId: docId,
        numConnections: connections.size,
        connectionIds: Array.from(connections),
      });
    });
    return results;
  }
}

module.exports = WebRTCService;
