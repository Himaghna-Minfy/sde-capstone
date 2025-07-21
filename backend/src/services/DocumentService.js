const { collections } = require('../config/firebase');
const { Document, Comment } = require('../models/Document');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

class DocumentService {
  static async createDocument(documentData) {
    try {
      const db = collections.documents();
      
      const documentId = documentData.id || uuidv4();
      const document = new Document({
        id: documentId,
        ...documentData,
        shareToken: crypto.randomBytes(32).toString('hex'),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.doc(documentId).set(document.toFirestore());
      
      console.log(`í³„ Document created: ${document.title}`);
      return document;
    } catch (error) {
      console.error('Error creating document:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  static async getDocumentById(documentId) {
    try {
      const db = collections.documents();
      const doc = await db.doc(documentId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return Document.fromFirestore(doc);
    } catch (error) {
      console.error('Error getting document:', error);
      throw new Error(`Failed to get document: ${error.message}`);
    }
  }

  static async updateDocument(documentId, updateData, userId) {
    try {
      const db = collections.documents();
      
      const updateFields = {
        ...updateData,
        lastEditedBy: userId,
        updatedAt: new Date(),
        version: updateData.version || Date.now()
      };
      
      await db.doc(documentId).update(updateFields);
      
      return await this.getDocumentById(documentId);
    } catch (error) {
      console.error('Error updating document:', error);
      throw new Error(`Failed to update document: ${error.message}`);
    }
  }

  static async getUserDocuments(userId, limit = 50, folderId = null) {
    try {
      const db = collections.documents();
      let query = db
        .where('ownerId', '==', userId)
        .orderBy('updatedAt', 'desc')
        .limit(limit);
        
      if (folderId) {
        query = query.where('folderId', '==', folderId);
      }

      const querySnapshot = await query.get();
      return querySnapshot.docs.map(doc => Document.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting user documents:', error);
      throw new Error(`Failed to get documents: ${error.message}`);
    }
  }

  static async getSharedDocuments(userId, limit = 50) {
    try {
      const db = collections.documents();
      
      // Get documents where user is a collaborator
      const querySnapshot = await db
        .where('collaborators', 'array-contains-any', [
          { userId: userId }
        ])
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .get();

      return querySnapshot.docs.map(doc => Document.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting shared documents:', error);
      // Fallback to empty array if query fails
      return [];
    }
  }

  static async addCollaborator(documentId, userId, permission = 'read') {
    try {
      const db = collections.documents();
      const document = await this.getDocumentById(documentId);
      
      if (!document) {
        throw new Error('Document not found');
      }

      document.addCollaborator(userId, permission);
      
      await db.doc(documentId).update({
        collaborators: document.collaborators,
        updatedAt: new Date()
      });

      return document;
    } catch (error) {
      console.error('Error adding collaborator:', error);
      throw new Error(`Failed to add collaborator: ${error.message}`);
    }
  }

  static async searchDocuments(query, userId, limit = 20) {
    try {
      const db = collections.documents();
      
      // Basic title search (Firestore limitation)
      const querySnapshot = await db
        .where('ownerId', '==', userId)
        .where('title', '>=', query)
        .where('title', '<=', query + '\uf8ff')
        .limit(limit)
        .get();

      return querySnapshot.docs.map(doc => Document.fromFirestore(doc));
    } catch (error) {
      console.error('Error searching documents:', error);
      throw new Error(`Failed to search documents: ${error.message}`);
    }
  }

  static async deleteDocument(documentId) {
    try {
      const batch = collections.users().firestore.batch();
      
      // Delete all comments for this document
      const commentsQuery = await collections.comments()
        .where('documentId', '==', documentId)
        .get();
        
      commentsQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete the document
      batch.delete(collections.documents().doc(documentId));
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  }

  // Comment methods
  static async createComment(commentData) {
    try {
      const db = collections.comments();
      
      const commentId = commentData.id || uuidv4();
      const comment = new Comment({
        id: commentId,
        ...commentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.doc(commentId).set(comment.toFirestore());
      
      return comment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error(`Failed to create comment: ${error.message}`);
    }
  }

  static async getDocumentComments(documentId) {
    try {
      const db = collections.comments();
      const querySnapshot = await db
        .where('documentId', '==', documentId)
        .orderBy('createdAt', 'asc')
        .get();

      return querySnapshot.docs.map(doc => Comment.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting comments:', error);
      return []; // Return empty array on error
    }
  }

  static async updateComment(commentId, updateData) {
    try {
      const db = collections.comments();
      
      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await db.doc(commentId).update(updateFields);
      
      const doc = await db.doc(commentId).get();
      return Comment.fromFirestore(doc);
    } catch (error) {
      console.error('Error updating comment:', error);
      throw new Error(`Failed to update comment: ${error.message}`);
    }
  }

  static async deleteComment(commentId) {
    try {
      const db = collections.comments();
      await db.doc(commentId).delete();
      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }
}

module.exports = DocumentService;
