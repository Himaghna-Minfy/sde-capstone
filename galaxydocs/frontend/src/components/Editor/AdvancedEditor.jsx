import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Mention from '@tiptap/extension-mention'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import TextAlign from '@tiptap/extension-text-align'
import CharacterCount from '@tiptap/extension-character-count'

// Lowlight v3 import
import { createLowlight, common } from 'lowlight'

import { collaborationService } from '../../services/collaborationService'
import { documentService } from '../../services/documentService'
import { socketService } from '../../services/socketService'
import { useAuth } from '../../hooks/useAuth'
import AdvancedToolbar from './AdvancedToolbar'
import CommentsPanel from './CommentsPanel'
import UserPresence from './UserPresence'
import './AdvancedEditor.css'

// Create lowlight instance
const lowlight = createLowlight(common)

// Import specific languages
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import html from 'highlight.js/lib/languages/xml'
import css from 'highlight.js/lib/languages/css'

// Register languages
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('html', html)
lowlight.register('css', css)

function AdvancedEditor() {
  const { docId } = useParams()
  const { user } = useAuth()
  const [document, setDocument] = useState(null)
  const [users, setUsers] = useState([])
  const [comments, setComments] = useState([])
  const [showComments, setShowComments] = useState(false)
  const [provider, setProvider] = useState(null)
  const [saveStatus, setSaveStatus] = useState('saved')
  const [isProviderReady, setIsProviderReady] = useState(false)

  // Initialize collaboration provider
  useEffect(() => {
    if (!docId || !user) return

    console.log('Initializing collaboration provider...')
    
    try {
      const collabProvider = collaborationService.getOrCreateDocument(docId, user)
      
      if (collabProvider && collabProvider.document && collabProvider.awareness) {
        setProvider(collabProvider)
        setIsProviderReady(true)
        console.log('Collaboration provider ready')
        
        loadDocument()
        setupSocket()
      } else {
        console.error('Provider initialization failed')
        throw new Error('Provider initialization failed')
      }
    } catch (error) {
      console.error('Failed to initialize collaboration:', error)
      setIsProviderReady(false)
    }

    return () => {
      socketService.leaveDocument(docId)
    }
  }, [docId, user])

  // Create editor only when provider is ready
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      ...(isProviderReady && provider ? [
        Collaboration.configure({
          document: provider.document,
        }),
        CollaborationCursor.configure({
          provider: provider,
          user: {
            name: user?.displayName || user?.email,
            color: provider.awareness?.getLocalState()?.user?.color || '#FF6B6B',
            id: user?.uid,
          },
        }),
      ] : []),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'link-styling',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'javascript',
      }),
      CharacterCount.configure({
        limit: 10000,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }) => {
            return users
              .filter(user => user.name?.toLowerCase().startsWith(query.toLowerCase()))
              .slice(0, 5)
          },
          render: () => {
            let component
            
            return {
              onStart: props => {
                component = new MentionList(props)
              },
              onUpdate(props) {
                component?.updateProps(props)
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  return true
                }
                return component?.onKeyDown(props) || false
              },
              onExit() {
                component?.destroy()
              },
            }
          },
        },
      }),
    ],
    content: '<p>Loading document...</p>',
    editorProps: {
      attributes: {
        class: 'advanced-prose max-w-none focus:outline-none',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.[0]) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith('image/')) {
            const reader = new FileReader()
            reader.onload = (e) => {
              const { tr } = view.state
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })
              if (pos && e.target?.result) {
                tr.insert(pos.pos, view.state.schema.nodes.image.create({ src: e.target.result }))
                view.dispatch(tr)
              }
            }
            reader.readAsDataURL(file)
            return true
          }
        }
        return false
      },
    },
    onCreate: ({ editor }) => {
      console.log('Editor created successfully')
    },
    onUpdate: ({ editor }) => {
      setSaveStatus('saving')
      clearTimeout(window.saveTimeout)
      window.saveTimeout = setTimeout(() => {
        handleSave()
      }, 2000)
    },
    onError: ({ error }) => {
      console.error('Editor error:', error)
    },
  }, [isProviderReady, provider, users])

  const loadDocument = async () => {
    try {
      console.log('Loading document:', docId)
      const doc = await documentService.getDocument(docId)
      setDocument(doc)
      
      if (editor && doc.content) {
        editor.commands.setContent(doc.content)
        console.log('Document content loaded')
      }
    } catch (error) {
      console.error('Failed to load document:', error)
      setSaveStatus('error')
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
  }

  const handleSave = useCallback(async () => {
    if (!editor || !document) return

    try {
      setSaveStatus('saving')
      const content = editor.getHTML()
      await documentService.updateDocument(docId, { content })
      setSaveStatus('saved')
    } catch (error) {
      console.error('Failed to save document:', error)
      setSaveStatus('error')
    }
  }, [editor, document, docId])

  useEffect(() => {
    if (editor && document && document.content) {
      editor.commands.setContent(document.content)
    }
  }, [editor, document])

  // ✅ FIXED: Keyboard shortcuts with proper null checking
  useEffect(() => {
    // Ensure document is available before adding listeners
    if (typeof window === 'undefined' || !window.document) {
      return
    }

    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'C') {
        event.preventDefault()
        setShowComments(prev => !prev)
      }
    }

    // Use window.document explicitly and check if it exists
    const documentElement = window.document
    if (documentElement && documentElement.addEventListener) {
      documentElement.addEventListener('keydown', handleKeyDown)
      
      return () => {
        if (documentElement && documentElement.removeEventListener) {
          documentElement.removeEventListener('keydown', handleKeyDown)
        }
      }
    }
  }, [])

  // Show loading state while initializing
  if (!document || !isProviderReady || !provider) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">
          <h3>Initializing GalaxyDocs Editor...</h3>
          <div className="loading-steps">
            <div className={`loading-step ${document ? 'completed' : 'pending'}`}>
              ��� Document: {document ? '✅ Loaded' : '⏳ Loading...'}
            </div>
            <div className={`loading-step ${provider ? 'completed' : 'pending'}`}>
              ��� Collaboration: {isProviderReady ? '✅ Ready' : '⏳ Initializing...'}
            </div>
            <div className={`loading-step ${editor ? 'completed' : 'pending'}`}>
              ✏️ Editor: {editor ? '✅ Ready' : '⏳ Creating...'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="advanced-editor-container">
      <div className="editor-header">
        <div className="document-info">
          <h1 className="document-title">
            {document.title}
          </h1>
          <div className="document-meta">
            <span className={`save-status ${saveStatus}`}>
              {saveStatus === 'saving' && '��� Saving...'}
              {saveStatus === 'saved' && '✅ Saved'}
              {saveStatus === 'error' && '❌ Error saving'}
            </span>
            {editor && (
              <>
                <span className="word-count">
                  {editor.storage.characterCount?.words() || 0} words
                </span>
                <span className="char-count">
                  {editor.storage.characterCount?.characters() || 0} / 10000
                </span>
              </>
            )}
          </div>
        </div>
        <UserPresence users={users} />
      </div>

      <div className="editor-layout">
        <div className="editor-main">
          {editor && <AdvancedToolbar editor={editor} />}
          <div className="editor-content">
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="editor-fallback">
                <p>Editor is initializing...</p>
              </div>
            )}
          </div>
        </div>
        
        {showComments && (
          <CommentsPanel 
            comments={comments}
            editor={editor}
            onAddComment={(comment) => setComments(prev => [...prev, comment])}
          />
        )}
      </div>

      <div className="floating-actions">
        <button 
          className="fab comments-fab"
          onClick={() => setShowComments(!showComments)}
          title="Comments (Ctrl+Shift+C)"
        >
          ���
        </button>
      </div>
    </div>
  )
}

// Mention component helper
class MentionList {
  constructor({ items, command }) {
    this.items = items || []
    this.command = command
    this.selectedIndex = 0
    this.element = document.createElement('div')
    this.element.className = 'mention-suggestions'
    this.render()
    if (document.body) {
      document.body.appendChild(this.element)
    }
  }

  render() {
    this.element.innerHTML = this.items
      .map((item, index) => `
        <div class="mention-item ${index === this.selectedIndex ? 'selected' : ''}" data-index="${index}">
          <div class="mention-avatar">${(item.name || 'U').charAt(0).toUpperCase()}</div>
          <div class="mention-info">
            <div class="mention-name">${item.name || 'Unknown User'}</div>
            <div class="mention-email">${item.email || ''}</div>
          </div>
        </div>
      `).join('')

    this.element.addEventListener('click', (e) => {
      const item = e.target.closest('.mention-item')
      if (item) {
        const index = parseInt(item.dataset.index)
        this.selectItem(index)
      }
    })
  }

  updateProps(props) {
    this.items = props.items || []
    this.render()
  }

  onKeyDown({ event }) {
    if (event.key === 'ArrowUp') {
      this.upHandler()
      return true
    }
    if (event.key === 'ArrowDown') {
      this.downHandler()
      return true
    }
    if (event.key === 'Enter') {
      this.enterHandler()
      return true
    }
    return false
  }

  upHandler() {
    this.selectedIndex = Math.max(0, this.selectedIndex - 1)
    this.render()
  }

  downHandler() {
    this.selectedIndex = Math.min(this.items.length - 1, this.selectedIndex + 1)
    this.render()
  }

  enterHandler() {
    this.selectItem(this.selectedIndex)
  }

  selectItem(index) {
    const item = this.items[index]
    if (item && this.command) {
      this.command({ id: item.id, label: item.name })
    }
  }

  destroy() {
    if (this.element && this.element.parentNode) {
      this.element.remove()
    }
  }
}

export default AdvancedEditor
