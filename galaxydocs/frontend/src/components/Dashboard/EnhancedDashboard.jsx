import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { documentService } from '../../services/documentService'
import { advancedDocumentService } from '../../services/advancedDocumentService'
import { useAuth } from '../../hooks/useAuth'
import './EnhancedDashboard.css'

const templates = [
  { id: 'meeting-notes', title: 'Meeting Notes', description: 'Template for meeting minutes' },
  { id: 'project-brief', title: 'Project Brief', description: 'Template for project documentation' },
  { id: 'technical-spec', title: 'Technical Specification', description: 'Template for technical documents' },
]

function EnhancedDashboard() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [filterBy, setFilterBy] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(null)
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

  const handleCreateFromTemplate = async (e) => {
    e.preventDefault()
    if (!newDocTitle.trim() || !selectedTemplate) return

    try {
      await advancedDocumentService.createDocumentFromTemplate(selectedTemplate.id, newDocTitle)
      setNewDocTitle('')
      setSelectedTemplate(null)
      setShowTemplateModal(false)
      loadDocuments()
    } catch (error) {
      console.error('Failed to create document from template:', error)
    }
  }

  const handleDuplicateDocument = async (docId, title) => {
    try {
      await advancedDocumentService.duplicateDocument(docId)
      loadDocuments()
    } catch (error) {
      console.error('Failed to duplicate document:', error)
    }
  }

  const handleExportDocument = async (docId, title, format = 'html') => {
    try {
      const blob = await advancedDocumentService.exportDocument(docId, format)
      const filename = `${title.replace(/[^a-z0-9]/gi, '_')}.${format}`
      advancedDocumentService.downloadFile(blob, filename)
    } catch (error) {
      console.error('Failed to export document:', error)
    }
  }

  const filteredAndSortedDocuments = documents
    .filter(doc => {
      if (filterBy === 'all') return true
      if (filterBy === 'owned') return doc.createdBy === user.uid
      if (filterBy === 'shared') return doc.createdBy !== user.uid
      return true
    })
    .filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.preview?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title)
      if (sortBy === 'createdAt') return new Date(b.createdAt) - new Date(a.createdAt)
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })

  if (loading) {
    return <div className="loading">Loading documents...</div>
  }

  return (
    <div className="enhanced-dashboard">
      <div className="container">
        <header className="dashboard-header">
          <div>
            <h1>Welcome back, {user?.displayName || user?.email}</h1>
            <p>Your collaborative workspace with {documents.length} documents</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-secondary"
              onClick={() => setShowTemplateModal(true)}
            >
              ... From Template
            </button>
            <button 
              className="btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + New Document
            </button>
          </div>
        </header>

        <div className="dashboard-controls">
          <div className="search-box">
            <input
              type="text"
              className="input-field"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="controls-group">
            <select 
              className="input-field"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updatedAt">Sort by: Last Updated</option>
              <option value="createdAt">Sort by: Date Created</option>
              <option value="title">Sort by: Title</option>
            </select>
            
            <select 
              className="input-field"
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
            >
              <option value="all">All Documents</option>
              <option value="owned">Owned by Me</option>
              <option value="shared">Shared with Me</option>
            </select>
          </div>
        </div>

        <div className="documents-grid">
          {filteredAndSortedDocuments.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? (
                <>
                  <h2>No documents found</h2>
                  <p>No documents match your search "{searchTerm}"</p>
                  <button 
                    className="btn-secondary"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                </>
              ) : (
                <>
                  <h2>No documents yet</h2>
                  <p>Create your first document to get started</p>
                  <div className="empty-actions">
                    <button 
                      className="btn-primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Document
                    </button>
                    <button 
                      className="btn-secondary"
                      onClick={() => setShowTemplateModal(true)}
                    >
                      Use Template
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            filteredAndSortedDocuments.map(doc => (
              <div key={doc.id} className="document-card glass-card">
                <Link to={`/editor/${doc.id}`} className="document-link">
                  <h3>{doc.title}</h3>
                  <p>{doc.preview || 'No content yet...'}</p>
                  <div className="document-meta">
                    <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
                    <span>{doc.collaborators?.length || 0} collaborators</span>
                  </div>
                </Link>
                
                <div className="document-actions">
                  <button
                    className="action-btn"
                    onClick={() => handleDuplicateDocument(doc.id, doc.title)}
                    title="Duplicate"
                  >
                    ...
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleExportDocument(doc.id, doc.title, 'html')}
                    title="Export as HTML"
                  >
                    ...
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleExportDocument(doc.id, doc.title, 'pdf')}
                    title="Export as PDF"
                  >
                    ...
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Document Modal */}
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

        {/* Template Modal */}
        {showTemplateModal && (
          <div className="modal-overlay" onClick={() => setShowTemplateModal(false)}>
            <div className="modal glass-card large-modal" onClick={e => e.stopPropagation()}>
              <h2>Create from Template</h2>
              
              <div className="templates-grid">
                {templates.map(template => (
                  <div 
                    key={template.id}
                    className={`template-card ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <h4>{template.title}</h4>
                    <p>{template.description}</p>
                  </div>
                ))}
              </div>
              
              {selectedTemplate && (
                <form onSubmit={handleCreateFromTemplate}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Document title"
                    value={newDocTitle}
                    onChange={(e) => setNewDocTitle(e.target.value)}
                  />
                  <div className="modal-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowTemplateModal(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      Create from Template
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedDashboard
