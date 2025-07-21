const admin = require('firebase-admin');
require('dotenv').config();

let firebaseApp;

const initializeFirebase = () => {
  if (!firebaseApp) {
    try {
      // Initialize Firebase Admin SDK
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? 
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) : 
        require('../config/firebase-admin-key.json');

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`,
        storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
      });

      console.log('🔥 Firebase Admin initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
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

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  getStorage,
  admin
};