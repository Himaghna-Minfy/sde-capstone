const express = require('express');
const DocumentService = require('../services/DocumentService');
const AuthMiddleware = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();
router.use(AuthMiddleware.authenticate);

// Comment validation
const commentValidation = [
  body('content').trim().isLength({ min: 1 }).withMessage('Comment content is required')
];

// Update comment
router.put('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const updateData = req.body;

    const updatedComment = await DocumentService.updateComment(commentId, updateData);
    
    if (!updatedComment) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      });
    }

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      error: 'Failed to update comment',
      message: error.message || 'Internal server error'
    });
  }
});

// Delete comment
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const success = await DocumentService.deleteComment(commentId);
    
    if (!success) {
      return res.status(404).json({
        error: 'Comment not found',
        message: 'The requested comment does not exist'
      });
    }

    res.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      error: 'Failed to delete comment',
      message: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
