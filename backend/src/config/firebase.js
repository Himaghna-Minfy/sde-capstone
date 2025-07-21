const admin = require('firebase-admin');
require('dotenv').config();

let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      let serviceAccount;
      
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // Parse JSON string from environment variable
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // Use service account file path
        serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      } else {
        // Development mode - use project ID only
        console.log('í´¥ Firebase: Initializing with project ID only (limited functionality)');
        firebaseApp = admin.initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID
        });
        return firebaseApp;
      }

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });

      console.log('í´¥ Firebase Admin initialized successfully');
    } catch (error) {
      console.error('âŒ Firebase initialization failed:', error.message);
      throw error;
    }
  }
  return firebaseApp;
};

const getFirestore = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.firestore();
};

const getAuth = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.auth();
};

const getStorage = () => {
  if (!firebaseApp) initializeFirebase();
  return admin.storage();
};

// Firestore collections helper
const collections = {
  users: () => getFirestore().collection('users'),
  documents: () => getFirestore().collection('documents'),
  comments: () => getFirestore().collection('comments'),
  folders: () => getFirestore().collection('folders'),
  notifications: () => getFirestore().collection('notifications')
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  getStorage,
  collections,
  admin
};
