const express = require("express");
const { checkRole } = require("../middleware/authenticateToken");
const { firestore } = require("../firebase/firebase");
const router = express.Router();
const admin = require("firebase-admin");
router.post("/create", async (req, res) => {
  try {
    const { newIndex, pricePerKwh, support, date, roomId } =
      req.body.formDataToSend;
    // Check if required fields are provided
    if (!newIndex || !pricePerKwh || !date || !roomId || !support) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Calculate the total consumption
    const oldRecordSnapshot = await firestore
      .collection("waters")
      .where("RoomId", "==", roomId)
      .where("date", "<", date)
      .orderBy("date", "desc")
      .limit(1)
      .get();

    let oldIndex = 0;
    if (!oldRecordSnapshot.empty) {
      oldIndex = oldRecordSnapshot.docs[0].data().newIndex;
    }
    const consumption = newIndex - oldIndex;
    let totalAmount = 0;
    let exceedLimit = 0;

    if (consumption > support) {
      exceedLimit = consumption - support;
      totalAmount = exceedLimit * pricePerKwh;
    }

    // Create a new water record
    const newWaterRecordRef = await firestore.collection("waters").add({
      oldIndex,
      newIndex,
      exceedLimit,
      totalConsumption: consumption,
      pricePerKwh,
      totalAmount,
      support,
      date: new Date(date),
      RoomId: roomId,
    });

    const newWaterRecordSnapshot = await newWaterRecordRef.get();
    const newWaterRecord = {
      id: newWaterRecordSnapshot.id,
      ...newWaterRecordSnapshot.data(),
    };

    res.status(201).json(newWaterRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/all", checkRole(["KTX"]), async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user.id;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    const rolesArray = [
      { id: 4, roleName: "Economics Leader" },
      { id: 5, roleName: "Sports Leader" },
      { id: 6, roleName: "Technical Leader" },
      { id: 7, roleName: "Cultural Leader" },
      { id: 8, roleName: "Communication Leader" },
      { id: 9, roleName: "Leader" },
    ];
    let waterReadings = [];

    for (const role of rolesArray) {
      const dormitoriesSnapshot = await firestore
        .collection("dormitories")
        .where("managers", "array-contains", { userId, role: role.roleName })
        .get();

      for (const dormDoc of dormitoriesSnapshot.docs) {
        const dormId = dormDoc.id;
        const roomsSnapshot = await firestore
          .collection("rooms")
          .where("DormitoryId", "==", dormId)
          .get();

        for (const roomDoc of roomsSnapshot.docs) {
          const roomId = roomDoc.id;
          const roomData = roomDoc.data();

          const waterSnapshot = await firestore
            .collection("waters")
            .where("RoomId", "==", roomId)
            .where("date", ">=", startDate)
            .where("date", "<=", endDate)
            .get();

          waterReadings.push(
            ...waterSnapshot.docs.map((doc) => ({
              ...doc.data(),
              Room: roomData,
            }))
          );
        }
      }
    }

    if (waterReadings.length > 0) {
      res.status(200).json(waterReadings);
    } else {
      return res.status(404).json({
        error: "No water data available for the specified month and year",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//For Application
router.get(
  "/user/all",
  checkRole(["KTX", "SCH", "STUDENT", "Admin"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { year, month } = req.query;

      // Get user document
      const userRef = await firestore.collection("users").doc(userId);
      const userDoc = await userRef.get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get user's room ID
      const roomId = userDoc.data().RoomId;
      const roomRef = await firestore.collection("rooms").doc(roomId).get();
      const roomDoc = await roomRef.data();

      // Construct date range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      // Fetch water data for the user's room within the specified date range
      const waterSnapshot = await firestore
        .collection("waters")
        .where("RoomId", "==", roomId)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .get();

      if (waterSnapshot.empty) {
        return res.status(404).json({ error: "Water data not found" });
      }

      // Accumulate water data
      let waterData = {};
      waterSnapshot.forEach((doc) => {
        const data = doc.data();
        waterData = {
          ...data,
          roomNumber: roomDoc.roomNumber,
        };
      });

      res.status(200).json(waterData); // Send waterData as a single object
    } catch (error) {
      console.error("Error fetching water data:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
