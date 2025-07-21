const DocumentService = require('../services/DocumentService');

class DocumentController {
  static async createDocument(req, res) {
    try {
      const { title, content } = req.body;
      const document = await DocumentService.createDocument({
        title,
        content,
        ownerId: req.user.id
      });
      res.status(201).json({ message: 'Document created', document });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create document', message: error.message });
    }
  }

  static async getDocument(req, res) {
    try {
      const { documentId } = req.params;
      const document = await DocumentService.getDocumentById(documentId);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      const comments = await DocumentService.getDocumentComments(documentId);
      res.json({ document, comments });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get document', message: error.message });
    }
  }

  static async updateDocument(req, res) {
    try {
      const { documentId } = req.params;
      const document = await DocumentService.updateDocument(documentId, req.body, req.user.id);
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      res.json({ message: 'Document updated', document });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update document', message: error.message });
    }
  }

  static async getUserDocuments(req, res) {
    try {
      const documents = await DocumentService.getUserDocuments(req.user.id);
      res.json({ documents });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get documents', message: error.message });
    }
  }
}

module.exports = DocumentController;
