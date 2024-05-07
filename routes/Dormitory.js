const express = require("express");
const upload = require("../middleware/uploadImage");
const { checkRole } = require("../middleware/authenticateToken");
const { firestore } = require("../firebase/firebase");
const router = express.Router();
const admin = require("firebase-admin");
const { Filter } = require("firebase-admin/firestore");
const { deleteRoomsAndClearUsers } = require("../services/firestoreService");
router.post(
  "/create",
  checkRole(["Admin"]),
  upload.single("dormImage"),
  async (req, res) => {
    try {
      const { dormName, dormLocation, dormDescription } = req.body;
      const userId = req.user.id;

      // Validate required fields
      if (!dormName || !dormLocation || !dormDescription) {
        return res.status(400).json({
          error: "Dormitory name, location, and description are required.",
        });
      }

      let dormImage = "No Image";
      if (req.file) {
        // If a file is uploaded, set dormImage to the filename
        const localhost = "http://localhost:3000/";
        dormImage = localhost + req.file.filename;
      }

      // Save dormitory data to Firestore
      const dormitoryRef = await firestore.collection("dormitories").add({
        UserId: userId,
        dormName,
        dormLocation,
        dormDescription,
        dormImage,
        managers: [],
      });

      res.status(201).json(dormitoryRef);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error. Failed to create dormitory." });
    }
  }
);
router.get("/all", checkRole(["Admin", "KTX"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const rolesArray = [
      { id: 1, roleName: "Admin" },
      { id: 2, roleName: "Manager" },
      { id: 3, roleName: "User" },
      // Add more roles as needed
    ];

    // Query dormitories where the user is listed as a manager with a specific role or is the owner
    const dormitoriesSnapshot = await firestore
      .collection("dormitories")
      .where(
        Filter.or(
          // Check for the user as a manager with a specific role
          ...rolesArray.map((role) =>
            Filter.where("managers", "array-contains", {
              userId: userId,
              role: role.roleName,
            })
          ),
          // Check for the user as the owner
          Filter.where("UserId", "==", userId)
        )
      )
      .get();

    const dormitories = [];
    dormitoriesSnapshot.forEach((doc) => {
      dormitories.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json(dormitories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/all/student/:dormId", checkRole(["Admin"]), async (req, res) => {
  try {
    const dormId = req.params.dormId;
    const year = req.query.year;

    // Fetch all rooms in the specified dormitory for the specified year
    const roomsSnapshot = await firestore
      .collection("rooms")
      .where("DormitoryId", "==", dormId)
      .get();

    if (roomsSnapshot.empty) {
      return res.status(404).json({
        error:
          "No rooms found for the specified dormitory. Please create rooms for this dormitory.",
      });
    }

    const roomIds = roomsSnapshot.docs.map((doc) => doc.id);

    // Fetch all students in the rooms for the specified year
    const studentsSnapshot = await firestore
      .collection("users")
      .where("RoomId", "in", roomIds)
      .where("userDate", ">=", new Date(`${year}-01-01`))
      .where("userDate", "<=", new Date(`${year}-12-31`))
      .get();

    if (studentsSnapshot.empty) {
      return res
        .status(404)
        .json({ error: "No students found for the specified year." });
    }

    const studentsData = await Promise.all(
      studentsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        delete data.password;
        delete data.expo_push_token;

        const roomDocRef = await firestore.collection("rooms").doc(data.RoomId);
        const roomDoc = await roomDocRef.get();
        const roomData = roomDoc.data();

        if (!roomData) {
          throw new Error("Room data not found.");
        }

        const dormitoryId = roomData.DormitoryId;
        const dormitoryDocRef = await firestore
          .collection("dormitories")
          .doc(dormitoryId);
        const dormitoryDoc = await dormitoryDocRef.get();
        const dormitoryData = dormitoryDoc.data();

        if (!dormitoryData) {
          throw new Error("Dormitory data not found.");
        }

        return {
          id: doc.id,
          ...data,
          Room: {
            id: roomDoc.id,
            ...roomData,
            Dormitory: {
              id: dormitoryDoc.id,
              ...dormitoryData,
            },
          },
        };
      })
    );

    return res.json(studentsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put(
  "/update/:dormitoryId/managers",
  checkRole(["Admin"]),
  async (req, res) => {
    try {
      const { userId, role } = req.body;
      const { dormitoryId } = req.params;
      // Check if the user exists in Firestore
      const userDoc = await firestore.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found." });
      }

      const currentTime = new Date().toISOString();
      // Update managers for the dormitory
      await firestore
        .collection("dormitories")
        .doc(dormitoryId)
        .update({
          managers: admin.firestore.FieldValue.arrayUnion({ userId, role }),
          updatedAt: currentTime,
        });

      res.status(200).json({ message: "Managers updated successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error. Failed to update managers.",
      });
    }
  }
);

router.put(
  "/remove/:dormitoryId/manager",
  checkRole(["Admin"]),
  async (req, res) => {
    try {
      const { userId, role } = req.body; // Include role in the request body
      const { dormitoryId } = req.params;
      const currentTime = new Date().toISOString();

      // Remove the manager from the dormitory's managers array with the specified user ID and role
      await firestore
        .collection("dormitories")
        .doc(dormitoryId)
        .update({
          managers: admin.firestore.FieldValue.arrayRemove({ userId, role }), // Include both userId and role
          updatedAt: currentTime,
        });

      res.status(200).json({ message: "Manager removed successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error. Failed to remove manager.",
      });
    }
  }
);
router.delete(
  "/remove/:dormitoryId",
  checkRole(["Admin"]),
  async (req, res) => {
    try {
      const { dormitoryId } = req.params;

      // Check if the dormitory exists
      const dormitoryDoc = await firestore
        .collection("dormitories")
        .doc(dormitoryId)
        .get();
      if (!dormitoryDoc.exists) {
        return res.status(404).json({ error: "Dormitory not found." });
      }

      // Delete rooms associated with the dormitory
      await deleteRoomsAndClearUsers(dormitoryId);

      // Delete the dormitory document
      await firestore.collection("dormitories").doc(dormitoryId).delete();

      res.status(200).json({
        message:
          "Dormitory, associated rooms, and user rooms cleared successfully.",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error:
          "Internal server error. Failed to remove dormitory, associated rooms, and clear user rooms.",
      });
    }
  }
);
module.exports = router;
