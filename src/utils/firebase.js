const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let serviceAccountConfig;
const keyFilePath = process.env.FIREBASE_SECRET_KEYFILE;

try {
  if (keyFilePath && fs.existsSync(keyFilePath)) {
    // If it's a path to a file that exists, read the file
    const rawData = fs.readFileSync(keyFilePath);
    serviceAccountConfig = JSON.parse(rawData);
    console.log(`Firebase: Using service account from file: ${keyFilePath}`);
  } else if (process.env.FIREBASE_SECRET_KEYFILE && process.env.FIREBASE_SECRET_KEYFILE.startsWith('{')) {
    // If the env var contains the actual JSON, parse it
    serviceAccountConfig = JSON.parse(process.env.FIREBASE_SECRET_KEYFILE);
    console.log('Firebase: Using service account from environment variable');
  } else {
    throw new Error(`Firebase key not available: ${keyFilePath}`);
  }
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw new Error(`Failed to initialize Firebase: ${error.message}`);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountConfig)
});

module.exports = admin;