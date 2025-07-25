const { validationResult } = require('express-validator')
const documentService = require('../services/documentService')

const documentController = {
  async getDocuments(req, res) {
    try {
      const documents = await documentService.getUserDocuments(req.user.uid)
      res.json(documents)
    } catch (error) {
      console.error('Get documents error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async getDocument(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const document = await documentService.getDocument(id, req.user.uid)
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' })
      }

      res.json(document)
    } catch (error) {
      console.error('Get document error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async createDocument(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { title, content = '' } = req.body
      const document = await documentService.createDocument({
        title,
        content,
        createdBy: req.user.uid,
        createdByEmail: req.user.email
      })

      res.status(201).json(document)
    } catch (error) {
      console.error('Create document error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async updateDocument(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const updates = req.body
      
      const document = await documentService.updateDocument(id, updates, req.user.uid)
      
      if (!document) {
        return res.status(404).json({ message: 'Document not found' })
      }

      res.json(document)
    } catch (error) {
      console.error('Update document error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async deleteDocument(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      await documentService.deleteDocument(id, req.user.uid)
      
      res.status(204).send()
    } catch (error) {
      console.error('Delete document error:', error)
      res.status(500).json({ message: error.message })
    }
  },

  async shareDocument(req, res) {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const { userEmail, permission } = req.body
      
      await documentService.shareDocument(id, userEmail, permission, req.user.uid)
      
      res.json({ message: 'Document shared successfully' })
    } catch (error) {
      console.error('Share document error:', error)
      res.status(500).json({ message: error.message })
    }
  }
}

module.exports = documentController
