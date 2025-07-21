class User {
  constructor({
    id,
    email,
    name,
    avatar,
    role = 'editor',
    firebaseUid,
    isActive = true,
    lastSeen = new Date(),
    preferences = {},
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.email = email;
    this.name = name;
    this.avatar = avatar;
    this.role = role; // admin, editor, viewer
    this.firebaseUid = firebaseUid;
    this.isActive = isActive;
    this.lastSeen = lastSeen;
    this.preferences = preferences;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(doc) {
    const data = doc.data();
    return new User({
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      lastSeen: data.lastSeen?.toDate() || new Date()
    });
  }

  toFirestore() {
    return {
      email: this.email,
      name: this.name,
      avatar: this.avatar,
      role: this.role,
      firebaseUid: this.firebaseUid,
      isActive: this.isActive,
      lastSeen: this.lastSeen,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      avatar: this.avatar,
      role: this.role,
      isActive: this.isActive,
      lastSeen: this.lastSeen,
      preferences: this.preferences,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  hasPermission(permission) {
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_documents'],
      editor: ['read', 'write', 'comment'],
      viewer: ['read', 'comment']
    };

    return rolePermissions[this.role]?.includes(permission) || false;
  }

  canEditDocument(document) {
    if (this.role === 'admin') return true;
    if (document.ownerId === this.id) return true;
    if (document.collaborators?.some(c => c.userId === this.id && c.permission === 'write')) return true;
    return false;
  }

  canViewDocument(document) {
    if (this.role === 'admin') return true;
    if (document.isPublic) return true;
    if (document.ownerId === this.id) return true;
    if (document.collaborators?.some(c => c.userId === this.id)) return true;
    return false;
  }
}

module.exports = User;
