const admin = require('firebase-admin')
const { v4: uuidv4 } = require('uuid')

const db = admin.firestore()

const documentService = {
  async getUserDocuments(userId) {
    try {
      // Simplified query to avoid index requirements
      const documentsQuery = await db.collection('documents')
        .where('collaborators', 'array-contains', userId)
        .get(); // Remove orderBy temporarily

      const documents = documentsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
      }));

      // Sort in application code instead
      return documents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      console.error('Firestore query error:', error);
      throw new Error('Failed to fetch documents: ' + error.message);
    }
  },

  async getDocument(documentId, userId) {
    try {
      const docRef = db.collection('documents').doc(documentId)
      const doc = await docRef.get()

      if (!doc.exists) {
        return null
      }

      const docData = doc.data()
      
      // Check if user has access
      if (!docData.collaborators || !docData.collaborators.includes(userId)) {
        throw new Error('Access denied')
      }

      return {
        id: doc.id,
        ...docData,
        createdAt: docData.createdAt?.toDate?.() || new Date(),
        updatedAt: docData.updatedAt?.toDate?.() || new Date()
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch document')
    }
  },

  async createDocument({ title, content, createdBy, createdByEmail }) {
    try {
      const documentId = uuidv4()
      const docRef = db.collection('documents').doc(documentId)
      
      const documentData = {
        id: documentId,
        title,
        content: content || '',
        createdBy,
        createdByEmail,
        collaborators: [createdBy],
        permissions: {
          [createdBy]: 'admin'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        preview: this.generatePreview(content || '')
      }

      await docRef.set(documentData)

      return {
        id: documentId,
        ...documentData,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      throw new Error('Failed to create document')
    }
  },

  async updateDocument(documentId, updates, userId) {
    try {
      const docRef = db.collection('documents').doc(documentId)
      const doc = await docRef.get()

      if (!doc.exists) {
        return null
      }

      const docData = doc.data()
      
      // Check permissions
      if (!docData.collaborators || !docData.collaborators.includes(userId)) {
        throw new Error('Access denied')
      }

      const updateData = {
        ...updates,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }

      if (updates.content) {
        updateData.preview = this.generatePreview(updates.content)
      }

      await docRef.update(updateData)

      const updatedDoc = await docRef.get()
      const updatedData = updatedDoc.data()

      return {
        id: documentId,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate?.() || new Date(),
        updatedAt: new Date()
      }
    } catch (error) {
      throw new Error(error.message || 'Failed to update document')
    }
  },

  async deleteDocument(documentId, userId) {
    try {
      const docRef = db.collection('documents').doc(documentId)
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error('Document not found')
      }

      const docData = doc.data()
      
      // Check if user is admin or owner
      if (docData.createdBy !== userId && docData.permissions?.[userId] !== 'admin') {
        throw new Error('Access denied')
      }

      await docRef.delete()
    } catch (error) {
      throw new Error(error.message || 'Failed to delete document')
    }
  },

  async shareDocument(documentId, userEmail, permission, shareById) {
    try {
      const docRef = db.collection('documents').doc(documentId)
      const doc = await docRef.get()

      if (!doc.exists) {
        throw new Error('Document not found')
      }

      const docData = doc.data()
      
      // Check if user has admin permission
      if (docData.permissions?.[shareById] !== 'admin' && docData.createdBy !== shareById) {
        throw new Error('Access denied')
      }

      // Find user by email
      const userQuery = await db.collection('users').where('email', '==', userEmail).get()
      if (userQuery.empty) {
        throw new Error('User not found')
      }

      const targetUser = userQuery.docs[0].data()
      
      // Update document permissions
      await docRef.update({
        [`permissions.${targetUser.id}`]: permission,
        collaborators: admin.firestore.FieldValue.arrayUnion(targetUser.id)
      })

    } catch (error) {
      throw new Error(error.message || 'Failed to share document')
    }
  },

  generatePreview(content) {
    // Strip HTML and limit to 150 characters
    const text = content.replace(/<[^>]*>/g, '').trim()
    return text.length > 150 ? text.substring(0, 150) + '...' : text
  }
}

module.exports = documentService
