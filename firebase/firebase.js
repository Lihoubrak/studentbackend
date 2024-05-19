const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();
// Load service account credentials
const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});

// Get Firestore and Authentication instances
const firestore = admin.firestore();
const fireauth = admin.auth();

module.exports = { firestore, fireauth };
