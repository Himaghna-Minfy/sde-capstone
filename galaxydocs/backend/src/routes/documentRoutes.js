const express = require('express')
const { body, param } = require('express-validator')
const documentController = require('../controllers/documentController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all documents for user
router.get('/', documentController.getDocuments)

// Get specific document
router.get('/:id', [
  param('id').notEmpty()
], documentController.getDocument)

// Create new document
router.post('/', [
  body('title').notEmpty().trim(),
  body('content').optional()
], documentController.createDocument)

// Update document
router.put('/:id', [
  param('id').notEmpty(),
  body('title').optional().trim(),
  body('content').optional()
], documentController.updateDocument)

// Delete document
router.delete('/:id', [
  param('id').notEmpty()
], documentController.deleteDocument)

// Share document
router.post('/:id/share', [
  param('id').notEmpty(),
  body('userEmail').isEmail(),
  body('permission').isIn(['read', 'write', 'admin'])
], documentController.shareDocument)

module.exports = router
