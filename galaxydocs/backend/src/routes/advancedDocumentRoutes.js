const express = require('express')
const { param, body, query } = require('express-validator')
const advancedDocumentController = require('../controllers/advancedDocumentController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Export document
router.get('/:id/export', [
  param('id').notEmpty(),
  query('format').isIn(['html', 'pdf', 'docx']).optional()
], advancedDocumentController.exportDocument)

// Get document versions
router.get('/:id/versions', [
  param('id').notEmpty()
], advancedDocumentController.getDocumentVersions)

// Create document from template
router.post('/from-template', [
  body('templateId').notEmpty(),
  body('title').notEmpty().trim()
], advancedDocumentController.createFromTemplate)

// Duplicate document
router.post('/:id/duplicate', [
  param('id').notEmpty()
], advancedDocumentController.duplicateDocument)

// Get document analytics
router.get('/:id/analytics', [
  param('id').notEmpty()
], advancedDocumentController.getDocumentAnalytics)

// Add comment to document
router.post('/:id/comments', [
  param('id').notEmpty(),
  body('content').notEmpty(),
  body('position').isNumeric().optional(),
  body('selectedText').optional()
], advancedDocumentController.addComment)

// Get document comments
router.get('/:id/comments', [
  param('id').notEmpty()
], advancedDocumentController.getComments)

module.exports = router
