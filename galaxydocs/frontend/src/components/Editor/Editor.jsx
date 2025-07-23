import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness.js'
import { socketService } from '../../services/socketService'
import { documentService } from '../../services/documentService'
import { useAuth } from '../../hooks/useAuth'
import EditorToolbar from './EditorToolbar'
import UserPresence from './UserPresence'
import './Editor.css'

function Editor() {
  const { docId } = useParams()
  const { user } = useAuth()
  const [document, setDocument] = useState(null)
  const [users, setUsers] = useState([])
  const [provider, setProvider] = useState(null)
  const [isReady, setIsReady] = useState(false)
  const ydocRef = useRef(new Y.Doc())

  // Initialize provider
  useEffect(() => {
    if (!docId || !user) return

    const initializeProvider = async () => {
      try {
        const ydoc = ydocRef.current
        
        // ✅ FIXED: Create awareness without await in non-async context
        const awareness = new Awareness(ydoc)
        
        const socketProvider = {
          awareness,
          document: ydoc,
          connect: () => console.log('Provider connected'),
          disconnect: () => console.log('Provider disconnected'),
          destroy: () => {
            awareness.destroy()
            ydoc.destroy()
          }
        }

        // Set user info for awareness
        awareness.setLocalStateField('user', {
          name: user.displayName || user.email,
          color: getRandomColor(),
          id: user.uid
        })

        setProvider(socketProvider)
        setIsReady(true)
        
        // Load document after provider is ready
        loadDocument()
        setupSocket()
        
      } catch (error) {
        console.error('Failed to initialize provider:', error)
      }
    }

    initializeProvider()

    return () => {
      socketService.leaveDocument(docId)
      if (provider) {
        provider.destroy()
      }
    }
  }, [docId, user])

  const editor = useEditor({
    extensions: [
      StarterKit,
      ...(isReady && provider ? [
        Collaboration.configure({
          document: ydocRef.current,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: user?.displayName || user?.email,
            color: getRandomColor(),
          },
        }),
      ] : [])
    ],
    content: '<p>Loading...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
  }, [isReady, provider])

  const loadDocument = async () => {
    try {
      const doc = await documentService.getDocument(docId)
      setDocument(doc)
      if (editor && doc.content) {
        editor.commands.setContent(doc.content)
      }
    } catch (error) {
      console.error('Failed to load document:', error)
    }
  }

  const setupSocket = () => {
    if (!socketService.socket) {
      socketService.connect()
    }

    socketService.joinDocument(docId)

    socketService.onUserJoined((userData) => {
      setUsers(prev => [...prev.filter(u => u.id !== userData.id), userData])
    })

    socketService.onUserLeft((userId) => {
      setUsers(prev => prev.filter(u => u.id !== userId))
    })

    socketService.onDocumentUpdate(({ delta }) => {
      if (editor && provider) {
        try {
          Y.applyUpdate(ydocRef.current, new Uint8Array(delta))
        } catch (error) {
          console.error('Failed to apply Y.js update:', error)
        }
      }
    })
  }

  const handleSave = async () => {
    if (!editor || !document) return

    try {
      const content = editor.getHTML()
      await documentService.updateDocument(docId, { content })
      console.log('Document saved successfully')
    } catch (error) {
      console.error('Failed to save document:', error)
    }
  }

  // Auto-save with error handling
  useEffect(() => {
    if (!editor || !document) return
    
    const saveInterval = setInterval(handleSave, 5000)
    return () => clearInterval(saveInterval)
  }, [editor, document])

  if (!document || !provider || !isReady) {
    return (
      <div className="loading">
        <div>Loading document...</div>
        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
          Document: {document ? '✅' : '⏳'} | Provider: {provider ? '✅' : '⏳'} | Ready: {isReady ? '✅' : '⏳'}
        </div>
      </div>
    )
  }

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="document-info">
          <h1 className="document-title">{document.title}</h1>
          <span className="save-status">Auto-saving...</span>
        </div>
        <UserPresence users={users} />
      </div>

      <div className="editor-wrapper">
        <EditorToolbar editor={editor} />
        <div className="editor-content">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}

function getRandomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export default Editor
