const { collections, getAuth } = require('../config/firebase');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');

class UserService {
  static async createUser(userData) {
    try {
      const db = collections.users();
      const auth = getAuth();
      
      // Create Firebase Auth user if firebaseUid not provided
      let firebaseUser = null;
      if (userData.firebaseUid) {
        try {
          firebaseUser = await auth.getUser(userData.firebaseUid);
        } catch (error) {
          console.warn('Firebase user not found:', error.message);
        }
      }

      // Create user document
      const userId = userData.id || uuidv4();
      const user = new User({
        id: userId,
        ...userData,
        avatar: userData.avatar || userData.name.charAt(0).toUpperCase(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await db.doc(userId).set(user.toFirestore());
      
      console.log(`í±¤ User created: ${user.email}`);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  static async getUserById(userId) {
    try {
      const db = collections.users();
      const doc = await db.doc(userId).get();
      
      if (!doc.exists) {
        return null;
      }
      
      return User.fromFirestore(doc);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  static async getUserByEmail(email) {
    try {
      const db = collections.users();
      const querySnapshot = await db
        .where('email', '==', email)
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return User.fromFirestore(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  static async getUserByFirebaseUid(firebaseUid) {
    try {
      const db = collections.users();
      const querySnapshot = await db
        .where('firebaseUid', '==', firebaseUid)
        .limit(1)
        .get();
      
      if (querySnapshot.empty) {
        return null;
      }
      
      return User.fromFirestore(querySnapshot.docs[0]);
    } catch (error) {
      console.error('Error getting user by Firebase UID:', error);
      throw new Error(`Failed to get user: ${error.message}`);
    }
  }

  static async updateUser(userId, updateData) {
    try {
      const db = collections.users();
      
      const updateFields = {
        ...updateData,
        updatedAt: new Date()
      };
      
      await db.doc(userId).update(updateFields);
      
      return await this.getUserById(userId);
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }
  }

  static async updateLastSeen(userId) {
    try {
      const db = collections.users();
      await db.doc(userId).update({
        lastSeen: new Date(),
        isActive: true
      });
    } catch (error) {
      console.warn('Error updating last seen:', error.message);
      // Don't throw error for this non-critical operation
    }
  }

  static async searchUsers(query, limit = 10) {
    try {
      const db = collections.users();
      
      // Firestore doesn't support full-text search, so we'll do basic prefix matching
      const results = await db
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .limit(limit)
        .get();

      return results.docs.map(doc => User.fromFirestore(doc));
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error(`Failed to search users: ${error.message}`);
    }
  }

  static async getActiveUsers(limit = 50) {
    try {
      const db = collections.users();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const querySnapshot = await db
        .where('isActive', '==', true)
        .where('lastSeen', '>', fiveMinutesAgo)
        .limit(limit)
        .get();

      return querySnapshot.docs.map(doc => User.fromFirestore(doc));
    } catch (error) {
      console.error('Error getting active users:', error);
      throw new Error(`Failed to get active users: ${error.message}`);
    }
  }

  static async deleteUser(userId) {
    try {
      const db = collections.users();
      const auth = getAuth();
      
      // Get user to find Firebase UID
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Delete from Firebase Auth
      if (user.firebaseUid) {
        try {
          await auth.deleteUser(user.firebaseUid);
        } catch (firebaseError) {
          console.warn('Failed to delete Firebase user:', firebaseError.message);
        }
      }

      // Delete from Firestore
      await db.doc(userId).delete();
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }
}

module.exports = UserService;
