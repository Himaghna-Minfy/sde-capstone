const { validationResult } = require('express-validator')
const advancedDocumentService = require('../services/advancedDocumentService')

const advancedDocumentController = {
  async exportDocument(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const { format = 'html' } = req.query
      
      const exportedData = await advancedDocumentService.exportDocument(id, format, req.user.uid)
      
      const filename = `document_${id}.${format}`
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf')
      } else if (format === 'docx') {
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      } else {
        res.setHeader('Content-Type', 'text/html')
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      res.send(exportedData)
    } catch (error) {
      console.error('Export document error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async getDocumentVersions(req, res) {
    try {
      const { id } = req.params
      const versions = await advancedDocumentService.getDocumentVersions(id, req.user.uid)
      res.json(versions)
    } catch (error) {
      console.error('Get document versions error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async createFromTemplate(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { templateId, title } = req.body
      const document = await advancedDocumentService.createFromTemplate(templateId, title, req.user.uid)
      
      res.status(201).json(document)
    } catch (error) {
      console.error('Create from template error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async duplicateDocument(req, res) {
    try {
      const { id } = req.params
      const duplicatedDoc = await advancedDocumentService.duplicateDocument(id, req.user.uid)
      
      res.status(201).json(duplicatedDoc)
    } catch (error) {
      console.error('Duplicate document error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async getDocumentAnalytics(req, res) {
    try {
      const { id } = req.params
      const analytics = await advancedDocumentService.getDocumentAnalytics(id, req.user.uid)
      
      res.json(analytics)
    } catch (error) {
      console.error('Get document analytics error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async addComment(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const { content, position, selectedText } = req.body
      
      const comment = await advancedDocumentService.addComment(id, {
        content,
        position,
        selectedText,
        authorId: req.user.uid,
        authorName: req.user.displayName || req.user.email
      })
      
      res.status(201).json(comment)
    } catch (error) {
      console.error('Add comment error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async getComments(req, res) {
    try {
      const { id } = req.params
      const comments = await advancedDocumentService.getComments(id, req.user.uid)
      
      res.json(comments)
    } catch (error) {
      console.error('Get comments error:', error)
      res.status(500).json({ message: error.message })
    }
  }
}

module.exports = advancedDocumentController
