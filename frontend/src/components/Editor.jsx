import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import io from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext';
import CommentPanel from './editor/CommentSystem';
import MentionSuggestions, { useMentions } from './editor/MentionSystem';
import axios from 'axios';

function Editor() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [title, setTitle] = useState('');
  const [connected, setConnected] = useState(false);
  const [collaborators, setCollaborators] = useState([]);
  const [lastSaved, setLastSaved] = useState(new Date());
  const [showComments, setShowComments] = useState(false);
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const editorRef = useRef(null);
  const { mentionState, detectMention, handleMentionSelect, closeMentions } = useMentions(editorRef);

  // Initialize socket connection
  useEffect(() => {
    if (!user) return;

    const newSocket = io(import.meta.env.VITE_WS_URL || 'http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('join-document', documentId);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('user-joined', (userData) => {
      setCollaborators(prev => [...prev.filter(c => c.id !== userData.socketId), userData]);
    });

    newSocket.on('user-left', (userData) => {
      setCollaborators(prev => prev.filter(c => c.id !== userData.socketId));
    });

    newSocket.on('document-change', (data) => {
      if (data.user !== user.name && editor) {
        editor.commands.setContent(data.content, false);
      }
    });

    return () => newSocket.close();
  }, [documentId, user]);

  // Load document
  useEffect(() => {
    if (documentId && user) {
      loadDocument();
    }
  }, [documentId, user]);

  const loadDocument = async () => {
    try {
      setLoading(true);
      let response;
      
      if (documentId === 'new') {
        // Create new document
        response = await axios.post('/api/documents', {
          title: 'Untitled Document',
          content: getDefaultContent()
        });
        
        const newDoc = response.data.document;
        navigate(`/editor/${newDoc.id}`, { replace: true });
        setDocument(newDoc);
        setTitle(newDoc.title);
      } else {
        // Load existing document
        response = await axios.get(`/api/documents/${documentId}`);
        const doc = response.data.document;
        setDocument(doc);
        setTitle(doc.title);
      }
    } catch (error) {
      console.error('Error loading document:', error);
      if (error.response?.status === 404) {
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const getDefaultContent = () => {
    return `
      <h1>Ìºå Welcome to GalaxyDocs</h1>
      <p>Start writing your collaborative document here...</p>
      <p>‚ú® <strong>Features available:</strong></p>
      <ul>
        <li>Real-time collaboration</li>
        <li>Comments and discussions</li>
        <li>@mention team members</li>
        <li>Rich text formatting</li>
        <li>Auto-save functionality</li>
      </ul>
      <p>Ì≤° <strong>Tips:</strong></p>
      <ul>
        <li>Type <code>@</code> to mention someone</li>
        <li>Click the comment button to start discussions</li>
        <li>Use the toolbar for formatting</li>
      </ul>
    `;
  };

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: document?.content || getDefaultContent(),
    onUpdate: ({ editor }) => {
      if (socket && connected && document) {
        const content = editor.getHTML();
        socket.emit('document-change', {
          documentId: document.id,
          content,
          user: user.name
        });
        saveDocument(content);
        setLastSaved(new Date());
      }
    },
    onSelectionUpdate: ({ editor }) => {
      // Detect mentions on cursor movement
      setTimeout(() => detectMention(), 0);
    }
  });

  // Update editor content when document loads
  useEffect(() => {
    if (editor && document && !loading) {
      editor.commands.setContent(document.content || getDefaultContent(), false);
    }
  }, [editor, document, loading]);

  const saveDocument = async (content) => {
    if (!document) return;
    
    try {
      await axios.put(`/api/documents/${document.id}`, {
        title,
        content
      });
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  const handleTitleChange = async (newTitle) => {
    setTitle(newTitle);
    if (document) {
      try {
        await axios.put(`/api/documents/${document.id}`, { title: newTitle });
      } catch (error) {
        console.error('Error updating title:', error);
      }
    }
  };

  const formatToolbarActive = (format, attributes = {}) => {
    if (!editor) return false;
    return Object.keys(attributes).length > 0 
      ? editor.isActive(format, attributes)
      : editor.isActive(format);
  };

  if (loading) {
    return (
      <div className="editor-loading">
        <div className="loading-container">
          <div className="galaxy-loader">
            <div className="star"></div>
            <div className="star"></div>
            <div className="star"></div>
          </div>
          <h2>Loading Document...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container" ref={editorRef}>
      <header className="editor-header">
        <div className="editor-nav">
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            ‚Üê Dashboard
          </button>
          <input 
            type="text" 
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="title-input"
            placeholder="Document title..."
          />
        </div>
        
        <div className="editor-tools">
          <div className="connection-status">
            <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
              {connected ? 'ÔøΩÔøΩ Connected' : 'Ì¥¥ Disconnected'}
            </span>
          </div>
          
          <div className="user-presence">
            <div className="user-avatar" title={user.name}>
              {user.avatar}
            </div>
            {collaborators.map(collab => (
              <div key={collab.id} className="user-avatar" title={collab.name}>
                {collab.avatar}
              </div>
            ))}
          </div>
          
          <button 
            className={`comments-btn ${showComments ? 'active' : ''}`}
            onClick={() => setShowComments(!showComments)}
          >
            Ì≤¨ Comments
          </button>
          
          <button className="share-btn">
            Share Ì¥ó
          </button>
          
          <button className="logout-btn" onClick={logout}>
            Sign Out
          </button>
        </div>
      </header>

      <div className="editor-main">
        <div className="editor-toolbar">
          <button 
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`tool-btn ${formatToolbarActive('bold') ? 'active' : ''}`}
            title="Bold (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`tool-btn ${formatToolbarActive('italic') ? 'active' : ''}`}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            className={`tool-btn ${formatToolbarActive('strike') ? 'active' : ''}`}
            title="Strikethrough"
          >
            <s>S</s>
          </button>
          <div className="toolbar-divider"></div>
          <button 
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`tool-btn ${formatToolbarActive('heading', { level: 1 }) ? 'active' : ''}`}
            title="Heading 1"
          >
            H1
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`tool-btn ${formatToolbarActive('heading', { level: 2 }) ? 'active' : ''}`}
            title="Heading 2"
          >
            H2
          </button>
          <button 
            onClick={() => editor?.chain().focus().setParagraph().run()}
            className={`tool-btn ${formatToolbarActive('paragraph') ? 'active' : ''}`}
            title="Paragraph"
          >
            P
          </button>
          <div className="toolbar-divider"></div>
          <button 
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`tool-btn ${formatToolbarActive('bulletList') ? 'active' : ''}`}
            title="Bullet List"
          >
            ‚Ä¢
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`tool-btn ${formatToolbarActive('orderedList') ? 'active' : ''}`}
            title="Numbered List"
          >
            1.
          </button>
          <button 
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            className={`tool-btn ${formatToolbarActive('codeBlock') ? 'active' : ''}`}
            title="Code Block"
          >
            {'</>'}
          </button>
          <div className="toolbar-divider"></div>
          <button 
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            className={`tool-btn ${formatToolbarActive('blockquote') ? 'active' : ''}`}
            title="Quote"
          >
            "
          </button>
          <button 
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
            className="tool-btn"
            title="Horizontal Rule"
          >
            ‚Äï
          </button>
        </div>
        
        <div className="editor-content-wrapper">
          <div className="editor-content">
            <EditorContent 
              editor={editor} 
              className="editor-area"
              onInput={detectMention}
              onKeyUp={detectMention}
              onClick={detectMention}
            />
          </div>
          
          {/* Comments Panel */}
          <CommentPanel
            documentId={document?.id}
            isOpen={showComments}
            onClose={() => setShowComments(false)}
          />
        </div>
      </div>

      <footer className="editor-footer">
        <div className="footer-left">
          <span className="save-status">‚úÖ Auto-saved</span>
          <span className="last-saved">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        </div>
        <div className="footer-right">
          <span className="word-count">
            {editor?.storage.characterCount?.words() || 0} words
          </span>
          <span className="char-count">
            {editor?.storage.characterCount?.characters() || 0} characters
          </span>
        </div>
      </footer>

      {/* Mention Suggestions */}
      <MentionSuggestions
        query={mentionState.query}
        position={mentionState.position}
        onSelectMention={handleMentionSelect}
        onClose={closeMentions}
        isVisible={mentionState.isActive}
      />
    </div>
  );
}

export default Editor;
