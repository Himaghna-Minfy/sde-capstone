const admin = require('firebase-admin')
const { v4: uuidv4 } = require('uuid')

const db = admin.firestore()

const templates = {
  'meeting-notes': {
    title: 'Meeting Notes Template',
    content: `
      <h1>Meeting Notes - [Date]</h1>
      <h2>Attendees</h2>
      <ul>
        <li>Name 1</li>
        <li>Name 2</li>
      </ul>
      <h2>Agenda</h2>
      <ol>
        <li>Item 1</li>
        <li>Item 2</li>
      </ol>
      <h2>Discussion Points</h2>
      <p>Key discussion points...</p>
      <h2>Action Items</h2>
      <ul>
        <li>[ ] Action item 1 - Assignee</li>
        <li>[ ] Action item 2 - Assignee</li>
      </ul>
      <h2>Next Meeting</h2>
      <p>Date and time for next meeting...</p>
    `
  },
  'project-brief': {
    title: 'Project Brief Template',
    content: `
      <h1>Project Brief: [Project Name]</h1>
      <h2>Project Overview</h2>
      <p>Brief description of the project...</p>
      <h2>Objectives</h2>
      <ul>
        <li>Objective 1</li>
        <li>Objective 2</li>
      </ul>
      <h2>Scope</h2>
      <h3>In Scope</h3>
      <ul>
        <li>Feature 1</li>
        <li>Feature 2</li>
      </ul>
      <h3>Out of Scope</h3>
      <ul>
        <li>Feature not included</li>
      </ul>
      <h2>Timeline</h2>
      <p>Project timeline and milestones...</p>
      <h2>Resources</h2>
      <p>Required resources and team members...</p>
    `
  },
  'technical-spec': {
    title: 'Technical Specification Template',
    content: `
      <h1>Technical Specification: [Feature Name]</h1>
      <h2>Overview</h2>
      <p>Technical overview of the feature...</p>
      <h2>Requirements</h2>
      <h3>Functional Requirements</h3>
      <ul>
        <li>Requirement 1</li>
        <li>Requirement 2</li>
      </ul>
      <h3>Non-Functional Requirements</h3>
      <ul>
        <li>Performance requirements</li>
        <li>Security requirements</li>
      </ul>
      <h2>Architecture</h2>
      <p>System architecture description...</p>
      <h2>Implementation Details</h2>
      <p>Technical implementation details...</p>
      <h2>Testing Strategy</h2>
      <p>Testing approach and scenarios...</p>
    `
  }
}

const advancedDocumentService = {
  async exportDocument(documentId, format, userId) {
    try {
      const docRef = db.collection('documents').doc(documentId)
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error('Document not found')
      }

      const docData = doc.data()
      
      if (!docData.collaborators || !docData.collaborators.includes(userId)) {
        throw new Error('Access denied')
      }

      const content = docData.content || ''
      const title = docData.title || 'Untitled'

      if (format === 'html') {
        return `
          <!DOCTYPE html>
          <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
              h1, h2, h3 { color: #333; }
              p { line-height: 1.6; }
              blockquote { border-left: 4px solid #ddd; padding-left: 16px; margin: 16px 0; }
              code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
              pre { background: #f5f5f5; padding: 16px; border-radius: 5px; overflow-x: auto; }
            </style>
          </head>
          <body>
            <h1>${title}</h1>
            ${content}
          </body>
          </html>
        `
      }

      // For PDF and DOCX, you would integrate with libraries like puppeteer or docx
      // For now, return HTML content
      return content
    } catch (error) {
      throw new Error('Failed to export document: ' + error.message)
    }
  },

  async getDocumentVersions(documentId, userId) {
    try {
      // For now, return mock versions
      // In a real implementation, you'd store document versions
      return [
        {
          id: '1',
          version: '1.0',
          createdAt: new Date().toISOString(),
          author: 'Current User',
          changes: 'Initial version'
        }
      ]
    } catch (error) {
      throw new Error('Failed to get document versions: ' + error.message)
    }
  },

  async createFromTemplate(templateId, title, userId) {
    try {
      const template = templates[templateId]
      if (!template) {
        throw new Error('Template not found')
      }

      const documentId = uuidv4()
      const docRef = db.collection('documents').doc(documentId)
      
      const documentData = {
        id: documentId,
        title,
        content: template.content,
        createdBy: userId,
        collaborators: [userId],
        permissions: {
          [userId]: 'admin'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        preview: this.generatePreview(template.content),
        isTemplate: false,
        templateId
      }

      await docRef.set(documentData)

      return {
        id: documentId,
        ...documentData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      throw new Error('Failed to create from template: ' + error.message)
    }
  },

  async duplicateDocument(documentId, userId) {
    try {
      const docRef = db.collection('documents').doc(documentId)
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error('Document not found')
      }

      const docData = doc.data()
      
      if (!docData.collaborators || !docData.collaborators.includes(userId)) {
        throw new Error('Access denied')
      }

      const newDocumentId = uuidv4()
      const newDocRef = db.collection('documents').doc(newDocumentId)
      
      const newDocumentData = {
        ...docData,
        id: newDocumentId,
        title: `${docData.title} (Copy)`,
        createdBy: userId,
        collaborators: [userId],
        permissions: {
          [userId]: 'admin'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }

      await newDocRef.set(newDocumentData)

      return {
        id: newDocumentId,
        ...newDocumentData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      throw new Error('Failed to duplicate document: ' + error.message)
    }
  },

  async getDocumentAnalytics(documentId, userId) {
    try {
      // Mock analytics data
      // In a real implementation, you'd track view counts, edit history, etc.
      return {
        views: Math.floor(Math.random() * 100) + 1,
        edits: Math.floor(Math.random() * 50) + 1,
        collaborators: Math.floor(Math.random() * 10) + 1,
        lastViewed: new Date().toISOString(),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        wordCount: Math.floor(Math.random() * 1000) + 100
      }
    } catch (error) {
      throw new Error('Failed to get document analytics: ' + error.message)
    }
  },

  async addComment(documentId, commentData) {
    try {
      const commentId = uuidv4()
      const commentRef = db.collection('documents').doc(documentId).collection('comments').doc(commentId)
      
      const comment = {
        id: commentId,
        ...commentData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        resolved: false
      }

      await commentRef.set(comment)

      return {
        id: commentId,
        ...comment,
        createdAt: new Date()
      }
    } catch (error) {
      throw new Error('Failed to add comment: ' + error.message)
    }
  },

  async getComments(documentId, userId) {
    try {
      const commentsQuery = await db.collection('documents').doc(documentId).collection('comments')
        .orderBy('createdAt', 'asc')
        .get()

      const comments = commentsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }))

      return comments
    } catch (error) {
      throw new Error('Failed to get comments: ' + error.message)
    }
  },

  generatePreview(content) {
    const text = content.replace(/<[^>]*>/g, '').trim()
    return text.length > 150 ? text.substring(0, 150) + '...' : text
  }
}

module.exports = advancedDocumentService
