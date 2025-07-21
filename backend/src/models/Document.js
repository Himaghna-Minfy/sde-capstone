class Document {
  constructor({
    id,
    title,
    content = '',
    ownerId,
    folderId = null,
    isPublic = false,
    shareToken = null,
    collaborators = [],
    version = 1,
    lastEditedBy = null,
    createdAt = new Date(),
    updatedAt = new Date(),
    metadata = {}
  }) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.ownerId = ownerId;
    this.folderId = folderId;
    this.isPublic = isPublic;
    this.shareToken = shareToken;
    this.collaborators = collaborators; // [{ userId, permission, addedAt }]
    this.version = version;
    this.lastEditedBy = lastEditedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.metadata = metadata;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Document({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      collaborators: data.collaborators || []
    });
  }

  toFirestore() {
    return {
      title: this.title,
      content: this.content,
      ownerId: this.ownerId,
      folderId: this.folderId,
      isPublic: this.isPublic,
      shareToken: this.shareToken,
      collaborators: this.collaborators,
      version: this.version,
      lastEditedBy: this.lastEditedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      ownerId: this.ownerId,
      folderId: this.folderId,
      isPublic: this.isPublic,
      shareToken: this.shareToken,
      collaborators: this.collaborators,
      version: this.version,
      lastEditedBy: this.lastEditedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata
    };
  }

  addCollaborator(userId, permission = 'read') {
    const existingIndex = this.collaborators.findIndex(c => c.userId === userId);
    
    if (existingIndex >= 0) {
      this.collaborators[existingIndex].permission = permission;
      this.collaborators[existingIndex].updatedAt = new Date();
    } else {
      this.collaborators.push({
        userId,
        permission,
        addedAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  removeCollaborator(userId) {
    this.collaborators = this.collaborators.filter(c => c.userId !== userId);
  }

  getCollaboratorPermission(userId) {
    const collaborator = this.collaborators.find(c => c.userId === userId);
    return collaborator?.permission || null;
  }

  hasAccess(userId, requiredPermission = 'read') {
    if (this.ownerId === userId) return true;
    if (this.isPublic && requiredPermission === 'read') return true;
    
    const collaborator = this.collaborators.find(c => c.userId === userId);
    if (!collaborator) return false;
    
    const permissions = {
      read: 0,
      comment: 1,
      write: 2
    };
    
    return permissions[collaborator.permission] >= permissions[requiredPermission];
  }
}

class Comment {
  constructor({
    id,
    documentId,
    userId,
    content,
    position,
    resolved = false,
    replies = [],
    mentions = [],
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.documentId = documentId;
    this.userId = userId;
    this.content = content;
    this.position = position; // { start, end }
    this.resolved = resolved;
    this.replies = replies;
    this.mentions = mentions;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new Comment({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    });
  }

  toFirestore() {
    return {
      documentId: this.documentId,
      userId: this.userId,
      content: this.content,
      position: this.position,
      resolved: this.resolved,
      replies: this.replies,
      mentions: this.mentions,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = { Document, Comment };
