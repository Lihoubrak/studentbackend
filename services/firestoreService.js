const { firestore } = require("../firebase/firebase");

async function deleteRoomsAndClearUsers(dormitoryId) {
  // Query rooms associated with the dormitory
  const roomsSnapshot = await firestore
    .collection("rooms")
    .where("DormitoryId", "==", dormitoryId)
    .get();

  // Delete rooms and clear users associated with these rooms
  const deletePromises = roomsSnapshot.docs.map(async (roomDoc) => {
    const roomId = roomDoc.id;

    // Clear users associated with the room
    await clearUsersInRoom(roomId);

    // Delete the room document
    await roomDoc.ref.delete();
  });

  await Promise.all(deletePromises);
}

async function clearUsersInRoom(roomId) {
  // Query users with the specified roomId
  const usersSnapshot = await firestore
    .collection("users")
    .where("RoomId", "==", roomId)
    .get();

  // Update each user to clear their roomId field
  const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
    await userDoc.ref.update({ RoomId: null });
  });

  await Promise.all(updatePromises);
}
async function deleteMajorsAndClearUsers(schoolId) {
  // Query majors associated with the school
  const majorsSnapshot = await firestore
    .collection("majors")
    .where("SchoolId", "==", schoolId)
    .get();

  // Delete majors and clear users associated with those majors
  const deletePromises = majorsSnapshot.docs.map(async (majorDoc) => {
    const majorId = majorDoc.id;

    // Clear SchoolId in users associated with the major
    await clearSchoolIdInUsers(majorId);

    // Delete the major document
    await majorDoc.ref.delete();
  });

  await Promise.all(deletePromises);
}

async function clearSchoolIdInUsers(majorId) {
  // Query users with the specified majorId
  const usersSnapshot = await firestore
    .collection("users")
    .where("MajorId", "==", majorId)
    .get();

  // Update users to clear SchoolId
  const updatePromises = usersSnapshot.docs.map(async (userDoc) => {
    await userDoc.ref.update({ SchoolId: null });
  });

  await Promise.all(updatePromises);
}
module.export = {
  deleteRoomsAndClearUsers,
  clearUsersInRoom,
  deleteMajorsAndClearUsers,
  clearSchoolIdInUsers,
};
