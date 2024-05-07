const admin = require("firebase-admin");
const dotenv = require("dotenv");
dotenv.config();
// const isLocal = process.env.NODE_ENV === "development";
// if (isLocal) {
//   admin.initializeApp({
//     projectId: "studentapp-556ec",
//     credential: admin.credential.applicationDefault(),
//     databaseURL: process.env.FIREBASE_AUTH_EMULATOR_HOST,
//   });
// } else {
//   const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount),
//     databaseURL: process.env.DATABASE_URL,
//   });
// }
const serviceAccount = require(process.env.SERVICE_ACCOUNT_KEY_PATH);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
});
const firestore = admin.firestore();
const fireauth = admin.auth();
module.exports = { fireauth, firestore };
