const Y = require('yjs')

class SocketService {
  constructor() {
    this.io = null
    this.documentRooms = new Map() // documentId -> Set of socketIds
    this.userSockets = new Map() // socketId -> user info
  }

  initialize(io) {
    this.io = io

    io.on('connection', (socket) => {
      console.log('User connected:', socket.user.email)
      
      this.userSockets.set(socket.id, socket.user)

      socket.on('join-document', (documentId) => {
        this.joinDocument(socket, documentId)
      })

      socket.on('leave-document', (documentId) => {
        this.leaveDocument(socket, documentId)
      })

      socket.on('document-update', ({ documentId, delta }) => {
        this.handleDocumentUpdate(socket, documentId, delta)
      })

      socket.on('cursor-update', ({ documentId, cursor }) => {
        this.handleCursorUpdate(socket, documentId, cursor)
      })

      socket.on('disconnect', () => {
        this.handleDisconnect(socket)
      })
    })
  }

  joinDocument(socket, documentId) {
    socket.join(documentId)
    
    if (!this.documentRooms.has(documentId)) {
      this.documentRooms.set(documentId, new Set())
    }
    
    this.documentRooms.get(documentId).add(socket.id)
    
    // Notify other users in the document
    socket.to(documentId).emit('user-joined', {
      id: socket.user.uid,
      name: socket.user.displayName || socket.user.email,
      email: socket.user.email
    })

    // Send current users to the joining user
    const currentUsers = this.getUsersInDocument(documentId, socket.id)
    socket.emit('users-in-document', currentUsers)
  }

  leaveDocument(socket, documentId) {
    socket.leave(documentId)
    
    if (this.documentRooms.has(documentId)) {
      this.documentRooms.get(documentId).delete(socket.id)
      
      if (this.documentRooms.get(documentId).size === 0) {
        this.documentRooms.delete(documentId)
      }
    }
    
    // Notify other users
    socket.to(documentId).emit('user-left', socket.user.uid)
  }

  handleDocumentUpdate(socket, documentId, delta) {
    // Broadcast the update to all other users in the document
    socket.to(documentId).emit('document-update', {
      documentId,
      delta,
      userId: socket.user.uid
    })
  }

  handleCursorUpdate(socket, documentId, cursor) {
    // Broadcast cursor position to all other users in the document
    socket.to(documentId).emit('cursor-update', {
      documentId,
      cursor,
      user: {
        id: socket.user.uid,
        name: socket.user.displayName || socket.user.email,
        email: socket.user.email
      }
    })
  }

  handleDisconnect(socket) {
    console.log('User disconnected:', socket.user?.email)
    
    // Remove from all document rooms
    for (const [documentId, sockets] of this.documentRooms.entries()) {
      if (sockets.has(socket.id)) {
        sockets.delete(socket.id)
        socket.to(documentId).emit('user-left', socket.user.uid)
        
        if (sockets.size === 0) {
          this.documentRooms.delete(documentId)
        }
      }
    }
    
    this.userSockets.delete(socket.id)
  }

  getUsersInDocument(documentId, excludeSocketId = null) {
    const users = []
    const sockets = this.documentRooms.get(documentId)
    
    if (sockets) {
      for (const socketId of sockets) {
        if (socketId !== excludeSocketId && this.userSockets.has(socketId)) {
          const user = this.userSockets.get(socketId)
          users.push({
            id: user.uid,
            name: user.displayName || user.email,
            email: user.email
          })
        }
      }
    }
    
    return users
  }
}

module.exports = new SocketService()
