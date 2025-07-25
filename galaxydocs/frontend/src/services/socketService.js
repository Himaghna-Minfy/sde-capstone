import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

class SocketService {
  constructor() {
    this.socket = null
  }

  connect() {
    const token = localStorage.getItem('token')
    this.socket = io(SOCKET_URL, {
      auth: {
        token
      }
    })

    this.socket.on('connect', () => {
      console.log('Connected to server')
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  joinDocument(documentId) {
    if (this.socket) {
      this.socket.emit('join-document', documentId)
    }
  }

  leaveDocument(documentId) {
    if (this.socket) {
      this.socket.emit('leave-document', documentId)
    }
  }

  sendDocumentUpdate(documentId, delta) {
    if (this.socket) {
      this.socket.emit('document-update', { documentId, delta })
    }
  }

  onDocumentUpdate(callback) {
    if (this.socket) {
      this.socket.on('document-update', callback)
    }
  }

  onUserJoined(callback) {
    if (this.socket) {
      this.socket.on('user-joined', callback)
    }
  }

  onUserLeft(callback) {
    if (this.socket) {
      this.socket.on('user-left', callback)
    }
  }

  onCursorUpdate(callback) {
    if (this.socket) {
      this.socket.on('cursor-update', callback)
    }
  }

  sendCursorUpdate(documentId, cursor) {
    if (this.socket) {
      this.socket.emit('cursor-update', { documentId, cursor })
    }
  }

  // --- Yjs Collaboration Events ---
  sendYjsUpdate(documentId, update) {
    if (this.socket) {
      this.socket.emit('yjs-update', { documentId, update })
    }
  }

  onYjsSync(callback) {
    if (this.socket) {
      this.socket.on('yjs-sync', callback)
    }
  }

  onYjsUpdate(callback) {
    if (this.socket) {
      this.socket.on('yjs-update', callback)
    }
  }
}

export const socketService = new SocketService()
