import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { documentService } from '../../services/documentService'
import { useAuth } from '../../hooks/useAuth'
import './Dashboard.css'

function Dashboard() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const docs = await documentService.getDocuments()
      setDocuments(docs)
    } catch (error) {
      console.error('Failed to load documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDocument = async (e) => {
    e.preventDefault()
    if (!newDocTitle.trim()) return

    try {
      await documentService.createDocument(newDocTitle)
      setNewDocTitle('')
      setShowCreateModal(false)
      loadDocuments()
    } catch (error) {
      console.error('Failed to create document:', error)
    }
  }

  if (loading) {
    return <div className="loading">Loading documents...</div>
  }

  return (
    <div className="dashboard">
      <div className="container">
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, {user?.displayName || user?.email}</h1>
            <p>Your collaborative workspace</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + New Document
          </button>
        </header>

        <div className="documents-grid">
          {documents.length === 0 ? (
            <div className="empty-state">
              <h2>No documents yet</h2>
              <p>Create your first document to get started</p>
              <button 
                className="btn-primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Document
              </button>
            </div>
          ) : (
            documents.map(doc => (
              <Link 
                key={doc.id} 
                to={`/editor/${doc.id}`}
                className="document-card glass-card"
              >
                <h3>{doc.title}</h3>
                <p>{doc.preview || 'No content yet...'}</p>
                <div className="document-meta">
                  <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                  <span>{doc.collaborators?.length || 0} collaborators</span>
                </div>
              </Link>
            ))
          )}
        </div>

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal glass-card" onClick={e => e.stopPropagation()}>
              <h2>Create New Document</h2>
              <form onSubmit={handleCreateDocument}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Document title"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  autoFocus
                />
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
