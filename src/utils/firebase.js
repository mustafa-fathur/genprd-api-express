const admin = require('firebase-admin');
const serviceAccount = process.env.FIREBASE_SECRET_KEYFILE;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;