import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness.js'
import { IndexeddbPersistence } from 'y-indexeddb'

class CollaborationService {
  constructor() {
    this.documents = new Map()
  }

  getOrCreateDocument(docId, user) {
    if (!this.documents.has(docId)) {
      // Create Y.js document first
      const ydoc = new Y.Doc()
      
      // Ensure the document has the required XML fragment
      const xmlFragment = ydoc.getXmlFragment('prosemirror')
      
      // Create awareness with proper initialization
      const awareness = new Awareness(ydoc)
      
      // Set user information
      awareness.setLocalStateField('user', {
        name: user.displayName || user.email,
        color: this.getRandomColor(),
        id: user.uid,
        email: user.email
      })

      // Add indexed DB persistence
      let persistence = null
      try {
        persistence = new IndexeddbPersistence(docId, ydoc)
        persistence.on('synced', () => {
          console.log('Document synced from IndexedDB')
        })
      } catch (error) {
        console.warn('IndexedDB persistence failed, continuing without:', error)
      }

      // Create provider object
      const provider = {
        document: ydoc,
        awareness,
        persistence,
        xmlFragment,
        connect: () => {
          console.log(`Provider connected for document ${docId}`)
          return Promise.resolve()
        },
        disconnect: () => {
          console.log(`Provider disconnected for document ${docId}`)
          return Promise.resolve()
        },
        destroy: () => {
          console.log(`Destroying provider for document ${docId}`)
          if (persistence) {
            persistence.destroy()
          }
          awareness.destroy()
          ydoc.destroy()
        }
      }

      // Store the provider
      this.documents.set(docId, provider)
      
      console.log(`Created collaboration provider for document ${docId}`)
    }

    return this.documents.get(docId)
  }

  destroyDocument(docId) {
    if (this.documents.has(docId)) {
      const provider = this.documents.get(docId)
      provider.destroy()
      this.documents.delete(docId)
      console.log(`Destroyed document ${docId}`)
    }
  }

  getRandomColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#E17055', '#A29BFE', '#6C5CE7', '#FD79A8'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  // Helper method to check if document is ready
  isDocumentReady(docId) {
    const provider = this.documents.get(docId)
    return provider && provider.document && provider.awareness
  }
}

export const collaborationService = new CollaborationService()
