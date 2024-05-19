const express = require("express");
const { checkRole } = require("../middleware/authenticateToken");
const { firestore } = require("../firebase/firebase");
const upload = require("../middleware/uploadImage");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { roomNumber, numberOfStudents, dormitoryId } = req.body;
    if (!roomNumber || !numberOfStudents) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newRoom = await firestore.collection("rooms").add({
      DormitoryId: dormitoryId,
      roomNumber,
      numberOfStudents: parseInt(numberOfStudents),
    });
    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/all/:dormId", async (req, res) => {
  try {
    const dormId = req.params.dormId;
    const roomsSnapshot = await firestore
      .collection("rooms")
      .where("DormitoryId", "==", dormId)
      .get();

    if (roomsSnapshot.empty) {
      return res
        .status(404)
        .json({ error: "Rooms not found for the dormitory ID provided" });
    }
    const formattedRooms = roomsSnapshot.docs.map((doc) => {
      const roomData = doc.data();
      const { roomNumber, numberOfStudents } = roomData;
      return {
        id: doc.id,
        roomNumber,
        numberOfStudents,
      };
    });

    return res.status(200).json(formattedRooms);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/all", checkRole("KTX"), async (req, res) => {
  try {
    const userId = req.user.id;
    const dormitories = await Dormitory.findAll({ where: { UserId: userId } });
    const allRooms = await Room.findAll({
      where: {
        DormitoryId: { [Op.in]: dormitories.map((dormitory) => dormitory.id) },
      },
    });
    res.status(200).json(allRooms);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

//   try {
//     const roomId = req.params.roomId;
//     const { year } = req.query;

//     // Kiểm tra xem year có tồn tại không
//     if (!year) {
//       return res.status(400).json({ error: "Year is required" });
//     }

//     // Lấy thông tin phòng
//     const roomSnapshot = await firestore.collection("rooms").doc(roomId).get();
//     if (!roomSnapshot.exists) {
//       return res.status(404).json({ error: "Room not found" });
//     }
//     const roomData = roomSnapshot.data();

//     // Lấy thông tin sinh viên trong phòng cho năm cũ và năm mới
//     const querySnapshot = await firestore
//       .collection("users")
//       .where("RoomId", "==", roomId)
//       .where("leftRoomYear", "==", parseInt(year))
//       .get();

//     const studentsInRoom = [];
//     for (const doc of querySnapshot.docs) {
//       const studentData = doc.data();
//       delete studentData.password;
//       delete studentData.expo_push_token;
//       const roomSnapshot = await firestore
//         .collection("rooms")
//         .doc(studentData.RoomId)
//         .get();
//       const roomData = roomSnapshot.data();

//       const dormitorySnapshot = await firestore
//         .collection("dormitories")
//         .doc(roomData.DormitoryId)
//         .get();
//       const dormitoryData = dormitorySnapshot.data();

//       studentsInRoom.push({
//         id: doc.id,
//         ...studentData,
//         Room: {
//           id: roomSnapshot.id,
//           roomNumber: roomData.roomNumber,
//           numberOfStudents: roomData.numberOfStudents,
//           Dormitory: {
//             id: dormitorySnapshot.id,
//             ...dormitoryData,
//           },
//         },
//       });
//     }

//     if (studentsInRoom.length === 0) {
//       return res.status(404).json({
//         error: "No students found in this room for the given year",
//       });
//     }

//     res.status(200).json(studentsInRoom);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
router.put("/switchrooms", async (req, res) => {
  try {
    const { userAId, userBId } = req.body;

    // Retrieve user documents from Firestore
    const userADoc = await firestore.collection("users").doc(userAId).get();
    const userBDoc = await firestore.collection("users").doc(userBId).get();

    // Check if both users exist
    if (!userADoc.exists || !userBDoc.exists) {
      return res.status(404).json({ message: "One or both users not found" });
    }

    // Retrieve the RoomId fields from both users
    const userARoomRef = userADoc.data().RoomId;
    const userBRoomRef = userBDoc.data().RoomId;

    // Update the RoomId fields for both users
    await firestore
      .collection("users")
      .doc(userAId)
      .update({ RoomId: userBRoomRef });
    await firestore
      .collection("users")
      .doc(userBId)
      .update({ RoomId: userARoomRef });

    return res
      .status(200)
      .json({ message: "Users' rooms switched successfully" });
  } catch (error) {
    console.error("Error switching users' rooms:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/detail/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { year } = req.query;

    // Kiểm tra xem year có tồn tại không
    if (!year) {
      return res.status(400).json({ error: "Year is required" });
    }

    // Query for students who haven't left the room yet
    const currentStudentsQuerySnapshot = await firestore
      .collection("users")
      .where("RoomId", "==", roomId)
      .where("leftRoomYear", "==", null) // Assuming null indicates that the student hasn't left yet
      .get();

    // Query for students who left the room in the specified year
    const leftStudentsQuerySnapshot = await firestore
      .collection("users")
      .where("RoomId", "==", roomId)
      .where("leftRoomYear", "==", parseInt(year))
      .get();

    // Initialize an array to store the combined result
    const studentsInRoom = [];

    // Process current students who haven't left yet
    await Promise.all(
      currentStudentsQuerySnapshot.docs.map(async (doc) => {
        const studentData = doc.data();
        // Fetch room details
        const roomSnapshot = await firestore
          .collection("rooms")
          .doc(studentData.RoomId)
          .get();
        const roomData = roomSnapshot.data();
        const dormitorySnapshot = await firestore
          .collection("dormitories")
          .doc(roomData.DormitoryId)
          .get();
        const dormitoryData = dormitorySnapshot.data();
        if (roomData) {
          studentsInRoom.push({
            id: doc.id,
            ...studentData,
            Room: {
              id: roomSnapshot.id,
              roomNumber: roomData.roomNumber,
              numberOfStudents: roomData.numberOfStudents,
              Dormitory: {
                id: dormitorySnapshot.id,
                ...dormitoryData,
              },
            },
          });
        }
      })
    );

    // Process students who left the room in the specified year
    await Promise.all(
      leftStudentsQuerySnapshot.docs.map(async (doc) => {
        const studentData = doc.data();
        // Fetch room details
        const roomSnapshot = await firestore
          .collection("rooms")
          .doc(studentData.RoomId)
          .get();
        const roomData = roomSnapshot.data();
        const dormitorySnapshot = await firestore
          .collection("dormitories")
          .doc(roomData.DormitoryId)
          .get();
        const dormitoryData = dormitorySnapshot.data();
        if (roomData) {
          studentsInRoom.push({
            id: doc.id,
            ...studentData,
            Room: {
              id: roomSnapshot.id,
              roomNumber: roomData.roomNumber,
              numberOfStudents: roomData.numberOfStudents,
              Dormitory: {
                id: dormitorySnapshot.id,
                ...dormitoryData,
              },
            },
          });
        }
      })
    );

    // Check if any students found
    if (studentsInRoom.length === 0) {
      return res.status(404).json({
        error: "No students found in this room for the given year",
      });
    }

    // Return the combined result
    res.status(200).json(studentsInRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/addstudentroom", async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    if (!roomId || !userId) {
      return res
        .status(400)
        .json({ error: "Both roomId and userId are required" });
    }
    const userRef = firestore.collection("users").doc(userId);
    const userSnapshot = await userRef.get();
    if (!userSnapshot.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    await userRef.update({ RoomId: roomId });
    res.status(200).json({ message: "User's room updated successfully" });
  } catch (error) {
    console.error("Error updating user's room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.put(
  "/updateLeftRoomYear/:studentId",
  checkRole(["KTX"]),
  async (req, res) => {
    try {
      const studentId = req.params.studentId;
      const { newLeftRoomYear } = req.body;

      // Validate newLeftRoomYear
      if (!newLeftRoomYear) {
        return res.status(400).json({ error: "New leftRoomYear is required" });
      }

      // Update the leftRoomYear in Firestore
      await firestore
        .collection("users")
        .doc(studentId)
        .update({
          leftRoomYear: parseInt(newLeftRoomYear),
        });
      res.status(200).json({ message: "LeftRoomYear updated successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
//For Application
router.get(
  "/member",
  checkRole(["STUDENT", "Admin", "SCH", "KTX"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userRef = firestore.collection("users").doc(userId);
      const userSnapshot = await userRef.get();
      const userData = userSnapshot.data();

      if (userData.RoomId !== null) {
        const roomDoc = await firestore
          .collection("rooms")
          .doc(userData.RoomId)
          .get();
        const roomData = roomDoc.data();
        const dormDoc = await firestore
          .collection("dormitories")
          .doc(roomData.DormitoryId)
          .get();
        const dormData = dormDoc.data();

        // Get the current year
        const currentYear = new Date().getFullYear();

        const allMembersQuery = await firestore
          .collection("users")
          .where("RoomId", "==", userData.RoomId)
          .where("leftRoomYear", "==", currentYear) // Filter by current year
          .get();

        const allMembers = [];

        allMembersQuery.forEach((doc) => {
          const { firstName, lastName, avatar } = doc.data();
          allMembers.push({
            id: doc.id,
            firstName,
            lastName,
            avatar,
            Room: {
              id: roomDoc.id,
              roomNumber: roomData.roomNumber,
              numberOfStudents: roomData.numberOfStudents,
              Dormitory: {
                id: dormDoc.id,
                dormName: dormData.dormName,
              },
            },
          });
        });

        res.status(200).json(allMembers);
      } else {
        res.status(200).json([]); // RoomId is null, return empty array
      }
    } catch (error) {
      console.error("Error fetching members:", error);
      res
        .status(500)
        .json({ error: "An error occurred while fetching members" });
    }
  }
);

//Material For Students
// router.post(
//   "/material",
//   checkRole(["STUDENT", "Admin", "SCH", "KTX"]),
//   async (req, res) => {
//     try {
//       const { materials } = req.body;
//       const userId = req.user.id;
//       if (!userId || !materials) {
//         return res.status(400).json({ error: "All fields are required." });
//       }

//       // Check if there's an existing document for the user
//       const userMaterialsRef = firestore
//         .collection("usermaterials")
//         .doc(userId);
//       const userMaterialsDoc = await userMaterialsRef.get();

//       // If the document exists, update it with the new materials
//       if (userMaterialsDoc.exists) {
//         await userMaterialsRef.update({
//           materials: materials,
//         });
//       } else {
//         // If the document doesn't exist, create a new one
//         await userMaterialsRef.set({
//           UserId: userId,
//           materials,
//         });
//       }

//       res.status(201).json({ message: "Materials updated successfully." });
//     } catch (error) {
//       console.error("Error updating materials:", error);
//       res.status(500).json({ error: "Internal server error." });
//     }
//   }
// );
router.get(
  "/usermaterials/:userId",
  checkRole(["STUDENT", "Admin", "SCH", "KTX"]),
  async (req, res) => {
    try {
      const userId = req.user.id;

      if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
      }

      // Query Firestore to find the user materials document with eUserId matching userId
      const userMaterialsRef = firestore
        .collection("usermaterials")
        .where("UserId", "==", userId);
      const userMaterialsSnapshot = await userMaterialsRef.get();

      if (userMaterialsSnapshot.empty) {
        return res.status(404).json({ error: "User materials not found." });
      }

      // Extract and return the materials data
      const userData = userMaterialsSnapshot.docs[0].data();
      const materials = userData.materials;

      res.status(200).json(materials);
    } catch (error) {
      console.error("Error fetching user materials:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

router.put(
  "/material",
  checkRole(["STUDENT", "Admin", "SCH", "KTX"]),
  async (req, res) => {
    try {
      const { materials } = req.body;
      const userId = req.user.id;

      if (!materials || !userId) {
        return res.status(400).json({ error: "All fields are required." });
      }

      // Query user materials based on UserId
      const userMaterialsRef = firestore
        .collection("usermaterials")
        .where("UserId", "==", userId);
      const querySnapshot = await userMaterialsRef.get();

      if (querySnapshot.empty) {
        return res.status(404).json({ error: "User materials not found." });
      }

      // Since there should be only one document, retrieve the first one
      const userMaterialsDoc = querySnapshot.docs[0];

      // Update the user materials with the new data
      await userMaterialsDoc.ref.update({
        materials: materials,
      });

      res.status(200).json({ message: "User materials updated successfully." });
    } catch (error) {
      console.error("Error updating user materials:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

//Report

router.post(
  "/report",
  checkRole(["STUDENT", "KTX", "SCH"]),
  upload.array("images", 100),
  async (req, res) => {
    try {
      const { roomId, issueDescription } = req.body;
      const userId = req.user.id;
      // Construct array of image URLs
      const imageUrls = req.files.map((file) => {
        return `${req.protocol}://${req.get("host")}/${file.filename}`;
      });
      const reportRef = await firestore.collection("reports").add({
        UserId: userId,
        RoomId: roomId,
        issueDescription: issueDescription,
        images: imageUrls,
        createAt: new Date(),
      });

      res.status(201).json({
        message: "Issue reported successfully.",
        reportId: reportRef.id,
      });
    } catch (error) {
      console.error("Error reporting issue:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);
router.get("/report/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;

    // Query reports based on roomId and userId
    const reportsSnapshot = await firestore
      .collection("reports")
      .where("RoomId", "==", roomId)
      .get();

    // Construct response data
    const reports = [];
    for (const doc of reportsSnapshot.docs) {
      const reportData = doc.data();
      // Fetch user data based on UserId
      const userData = await firestore
        .collection("users")
        .doc(reportData.UserId)
        .get();
      const { firstName, lastName } = userData.data();

      // Add user data to report
      reports.push({
        id: doc.id,
        UserId: reportData.UserId,
        RoomId: reportData.RoomId,
        issueDescription: reportData.issueDescription,
        images: reportData.images,
        createAt: reportData.createAt,
        user: { firstName, lastName },
      });
    }

    res.status(200).json(reports);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
