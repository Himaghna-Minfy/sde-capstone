const admin = require('firebase-admin')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: "9ac7124074ce5febf78b72c739619eb960027dd7",
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: "107372153297078006600",
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40test-b7244.iam.gserviceaccount.com",
        universe_domain: "googleapis.com"
      })
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization failed:', error);
    throw error;
  }
}

const db = admin.firestore();

const authService = {
  async register(email, password, displayName) {
    try {
      // Check if user already exists
      const userQuery = await db.collection('users').where('email', '==', email).get()
      if (!userQuery.empty) {
        throw new Error('User already exists')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user document
      const userRef = db.collection('users').doc()
      const userData = {
        id: userRef.id,
        email,
        password: hashedPassword,
        displayName,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastActive: admin.firestore.FieldValue.serverTimestamp()
      }

      await userRef.set(userData)

      // Generate JWT token
      const token = jwt.sign(
        { uid: userRef.id, email, displayName },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      return {
        token,
        user: {
          uid: userRef.id,
          email,
          displayName
        }
      }
    } catch (error) {
      throw new Error(error.message || 'Registration failed')
    }
  },

  async login(email, password) {
    try {
      // Find user
      const userQuery = await db.collection('users').where('email', '==', email).get()
      if (userQuery.empty) {
        throw new Error('Invalid credentials')
      }

      const userDoc = userQuery.docs[0]
      const userData = userDoc.data()

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password)
      if (!isValidPassword) {
        throw new Error('Invalid credentials')
      }

      // Update last active
      await userDoc.ref.update({
        lastActive: admin.firestore.FieldValue.serverTimestamp()
      })

      // Generate JWT token
      const token = jwt.sign(
        { uid: userData.id, email: userData.email, displayName: userData.displayName },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      return {
        token,
        user: {
          uid: userData.id,
          email: userData.email,
          displayName: userData.displayName
        }
      }
    } catch (error) {
      throw new Error(error.message || 'Login failed')
    }
  },

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      
      // Verify user still exists
      const userDoc = await db.collection('users').doc(decoded.uid).get()
      if (!userDoc.exists) {
        throw new Error('User not found')
      }

      return {
        uid: decoded.uid,
        email: decoded.email,
        displayName: decoded.displayName
      }
    } catch (error) {
      throw new Error('Invalid token')
    }
  },

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET)
      
      const newToken = jwt.sign(
        { uid: decoded.uid, email: decoded.email, displayName: decoded.displayName },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      return { token: newToken }
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }
}

module.exports = authService
