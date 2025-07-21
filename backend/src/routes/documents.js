const express = require('express');
const DocumentController = require('../controllers/DocumentController');
const AuthMiddleware = require('../middleware/auth');
const router = express.Router();

router.use(AuthMiddleware.authenticate);
router.post('/', DocumentController.createDocument);
router.get('/my-documents', DocumentController.getUserDocuments);
router.get('/:documentId', DocumentController.getDocument);
router.put('/:documentId', DocumentController.updateDocument);

module.exports = router;
