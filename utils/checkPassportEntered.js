const { firestore } = require("../firebase/firebase");

async function checkPassportEntered(userData) {
  const passportQuerySnapshot = await firestore
    .collection("passports")
    .where("UserId", "==", userData.id)
    .get();

  return !passportQuerySnapshot.empty;
}

module.exports = checkPassportEntered;
