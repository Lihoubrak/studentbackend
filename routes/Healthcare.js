const express = require("express");
const { firestore } = require("../firebase/firebase");
const router = express.Router();
const admin = require("firebase-admin");
const { checkRole } = require("../middleware/authenticateToken");
const upload = require("../middleware/uploadImage");
router.post("/create", upload.array("images"), async (req, res) => {
  try {
    const {
      date = new Date(),
      note = "",
      cost,
      discount = "",
      hospital,
      typeofDisease,
      userId,
    } = req.body;

    // Check if date is provided
    if (!date) {
      return res.status(400).json({ error: "Date is required." });
    }

    // Check if cost is a valid number
    if (isNaN(cost)) {
      return res.status(400).json({ error: "Cost should be a number." });
    }

    // Calculate totalPatientPay based on cost and discount
    const totalPatientPay = cost - parseFloat(discount);

    // Handle uploaded images
    const images = req.files.map(
      (file) => `${req.protocol}://${req.get("host")}/${file.filename}`
    );
    // Save healthcare event to Firestore
    const newHealthcareEventRef = await firestore
      .collection("healthcares")
      .add({
        date,
        note,
        cost,
        discount,
        typeofDisease,
        totalPatientPay,
        hospital,
        UserId: userId,
        images: images,
      });
    const newHealthcareEventDoc = await newHealthcareEventRef.get();
    const newHealthcareEvent = newHealthcareEventDoc.data();
    res.status(201).json(newHealthcareEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/all", async (req, res) => {
  try {
    const { month, year } = req.query;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const allPatientSnapshot = await firestore
      .collection("healthcares")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .get();

    const allPatient = await Promise.all(
      allPatientSnapshot.docs.map(async (doc) => {
        const { UserId } = doc.data();
        const userRef = await firestore.collection("users").doc(UserId).get();
        const userDoc = userRef.data();
        delete userDoc.password;
        delete userDoc.expo_push_token;
        const roomRef = await firestore
          .collection("rooms")
          .doc(userDoc.RoomId)
          .get();
        const roomData = roomRef.data();
        const dormRef = await firestore
          .collection("dormitories")
          .doc(roomRef.data().DormitoryId)
          .get();
        return {
          id: doc.id,
          ...doc.data(),
          User: {
            ...userDoc,
            Room: {
              ...roomData,
              Dormitory: dormRef.data(),
            },
          },
        };
      })
    );

    if (allPatient.length === 0) {
      return res.status(404).json({
        error: "No patient data available for the specified month and year",
      });
    }

    res.status(200).json(allPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get(
  "/numberofgohospital",
  checkRole(["STUDENT", "KTX", "Admin", "SCH"]),
  async (req, res) => {
    try {
      const userId = req.user.id;

      const hospitalVisitsSnapshot = await firestore
        .collection("healthcares")
        .where("UserId", "==", userId)
        .get();

      const numberOfVisits = hospitalVisitsSnapshot.size;
      res.status(200).json({ numberOfVisits });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/healthcaredataforeachfiveyears",
  checkRole(["STUDENT", "KTX", "Admin", "SCH"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { startYear } = req.query;

      // Convert startYear to integer
      const startYearInt = parseInt(startYear);

      // Initialize an array to hold data for each year
      const fiveYearData = [];

      // Loop through each year in the next five years
      for (let i = 0; i < 5; i++) {
        const year = startYearInt + i;
        const startDate = new Date(year, 0, 1);
        const endDate = new Date(year, 11, 31);
        // Retrieve healthcare data for the current year and user
        const healthcareDataSnapshot = await firestore
          .collection("healthcares")
          .where("date", ">=", startDate)
          .where("date", "<=", endDate)
          .where("UserId", "==", userId)
          .get();

        // Calculate the total support amount for the current year
        let totalSupportAmount = 0;
        healthcareDataSnapshot.forEach((doc) => {
          totalSupportAmount += doc.data().discount;
        });

        // Push an object containing the year label and the total support amount to the array
        fiveYearData.push({
          year: year,
          supportAmount: totalSupportAmount,
        });
      }
      // Respond with the array containing support amounts for each year
      res.status(200).json(fiveYearData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
router.get("/images/:id", async (req, res) => {
  try {
    const healthcareId = req.params.id;

    // Retrieve the healthcare event from Firestore based on the provided ID
    const healthcareSnapshot = await firestore
      .collection("healthcares")
      .doc(healthcareId)
      .get();

    // Check if the healthcare event exists
    if (!healthcareSnapshot.exists) {
      return res.status(404).json({ error: "Healthcare event not found." });
    }

    // Extract healthcare event data
    const healthcareData = healthcareSnapshot.data();

    // Extract images from healthcare event data
    const images = healthcareData.images || [];

    // Return the images as the API response
    res.status(200).json(images);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.put("/update/:id", async (req, res) => {
  try {
    const healthcareId = req.params.id;
    const { note = "", discount = "" } = req.body;
    // Retrieve the current healthcare event from Firestore
    const healthcareSnapshot = await firestore
      .collection("healthcares")
      .doc(healthcareId)
      .get();

    // Check if the healthcare event exists
    if (!healthcareSnapshot.exists) {
      return res.status(404).json({ error: "Healthcare event not found." });
    }
    // Extract the current data of the healthcare event
    const healthcareData = healthcareSnapshot.data();
    // Calculate totalPatientPay based on the current cost and discount
    const totalPatientPay =
      parseFloat(healthcareData.cost) - parseFloat(discount);

    // Construct updated healthcare data
    const updatedHealthcareData = {
      note,
      discount,
      totalPatientPay,
    };

    // Update the healthcare event in Firestore
    await firestore
      .collection("healthcares")
      .doc(healthcareId)
      .update(updatedHealthcareData);
    // Return success response
    res.status(200).json({ message: "Healthcare event updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
