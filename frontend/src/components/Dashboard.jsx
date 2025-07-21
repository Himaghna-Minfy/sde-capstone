import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard({ user, onLogout }) {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading documents from API
    const loadDocuments = () => {
      setTimeout(() => {
        setDocuments([
          {
            id: 'welcome',
            title: 'Ìºå Welcome to GalaxyDocs',
            lastEdited: '2 hours ago',
            collaborators: [user.avatar, 'A', 'B'],
            status: 'active',
            preview: 'Start your journey into collaborative document editing...',
            type: 'document'
          },
          {
            id: 'project-planning',
            title: 'Ì≥ã Project Planning Template',
            lastEdited: '1 day ago',
            collaborators: [user.avatar],
            status: 'draft',
            preview: 'Organize your projects with this comprehensive template...',
            type: 'template'
          },
          {
            id: 'meeting-notes',
            title: 'Ì≥ù Team Meeting Notes',
            lastEdited: '3 days ago',
            collaborators: [user.avatar, 'C', 'D', 'E'],
            status: 'completed',
            preview: 'Notes from the last team sync meeting...',
            type: 'notes'
          },
          {
            id: 'design-specs',
            title: 'Ìæ® Design Specifications',
            lastEdited: '5 days ago',
            collaborators: [user.avatar, 'F'],
            status: 'review',
            preview: 'Detailed specifications for the new design system...',
            type: 'specs'
          }
        ])
        setLoading(false)
      }, 1000)
    }
    
    loadDocuments()
  }, [user])

  const handleCreateDocument = () => {
    const newId = `doc-${Date.now()}`
    navigate(`/editor/${newId}`)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4ade80'
      case 'draft': return '#fbbf24'
      case 'completed': return '#8b5cf6'
      case 'review': return '#06b6d4'
      default: return '#6b7280'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'document': return 'Ì≥Ñ'
      case 'template': return 'Ì≥ã'
      case 'notes': return 'Ì≥ù'
      case 'specs': return 'Ìæ®'
      default: return 'Ì≥Ñ'
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your workspace...</p>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome back, {user.name}! ‚ú®</h1>
            <p>Your collaborative workspace in the digital cosmos</p>
          </div>
          
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar">{user.avatar}</div>
              <div className="user-details">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              Sign Out
            </button>
          </div>
        </div>

        <div className="header-actions">
          <button className="create-btn" onClick={handleCreateDocument}>
            ‚ú® Create New Document
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="documents-section">
          <div className="section-header">
            <h2>Your Documents</h2>
            <div className="document-stats">
              <span>{documents.length} documents</span>
              <span>‚Ä¢</span>
              <span>{documents.filter(d => d.status === 'active').length} active</span>
            </div>
          </div>
          
          <div className="documents-grid">
            {documents.map(doc => (
              <div 
                key={doc.id} 
                className="document-card"
                onClick={() => navigate(`/editor/${doc.id}`)}
              >
                <div className="doc-header">
                  <div className="doc-title">
                    <span className="doc-icon">{getTypeIcon(doc.type)}</span>
                    <h3>{doc.title}</h3>
                  </div>
                  <div 
                    className="doc-status"
                    style={{ backgroundColor: getStatusColor(doc.status) }}
                  >
                    {doc.status}
                  </div>
                </div>

                <div className="doc-preview">
                  <p>{doc.preview}</p>
                </div>

                <div className="doc-meta">
                  <div className="doc-collaborators">
                    {doc.collaborators.slice(0, 3).map((avatar, index) => (
                      <div key={index} className="collaborator-avatar">
                        {avatar}
                      </div>
                    ))}
                    {doc.collaborators.length > 3 && (
                      <div className="collaborator-count">
                        +{doc.collaborators.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="doc-time">
                    {doc.lastEdited}
                  </div>
                </div>

                <div className="doc-actions">
                  <button className="action-btn">Ì≥ù Edit</button>
                  <button className="action-btn">Ì±• Share</button>
                  <button className="action-btn">‚≠ê Star</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar">
          <div className="workspace-info">
            <h3>Ìºå Workspace Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{documents.length}</span>
                <span className="stat-label">Documents</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {documents.reduce((sum, doc) => sum + doc.collaborators.length, 0)}
                </span>
                <span className="stat-label">Collaborators</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {documents.filter(d => d.status === 'active').length}
                </span>
                <span className="stat-label">Active</span>
              </div>
            </div>
          </div>

          <div className="recent-activity">
            <h3>Ìµí Recent Activity</h3>
            <div className="activity-list">
              <div className="activity-item">
                <span>Ì≥ù Document edited</span>
                <span>2h ago</span>
              </div>
              <div className="activity-item">
                <span>Ì±• New collaborator</span>
                <span>4h ago</span>
              </div>
              <div className="activity-item">
                <span>Ì≥Ñ Document created</span>
                <span>1d ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Dashboard
