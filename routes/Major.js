const express = require("express");
const upload = require("../middleware/uploadImage");
const { checkRole } = require("../middleware/authenticateToken");
const { firestore } = require("../firebase/firebase");
const router = express.Router();
router.post("/create", upload.single("majorImage"), async (req, res) => {
  try {
    const { majorName, majorDescription, schoolId } = req.body;

    // Validate required fields
    if (!majorName || !majorDescription || !schoolId) {
      return res.status(400).json({
        error:
          "Major name, description, date for studying, and school ID are required.",
      });
    }

    let majorImage = "No Image";
    if (req.file) {
      // If a file is uploaded, set majorImage to the filename
      const localhost = "http://localhost:3000/";
      majorImage = localhost + req.file.filename;
    }

    const newMajorRef = await firestore.collection("majors").add({
      SchoolId: schoolId,
      majorName,
      majorDescription,
      majorImage,
    });

    res.status(201).json(newMajorRef);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error. Failed to create major." });
  }
});

router.get("/all/:schoolId", async (req, res) => {
  try {
    const schoolId = req.params.schoolId;

    const majorsSnapshot = await firestore
      .collection("majors")
      .where("SchoolId", "==", schoolId)
      .get();

    // Initialize array to store all majors in the school
    const allMajorsInSchool = [];

    // Iterate through majors snapshot and extract major data
    majorsSnapshot.forEach((doc) => {
      allMajorsInSchool.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    res.status(200).json(allMajorsInSchool);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/detail/:majorId", async (req, res) => {
  try {
    const majorId = req.params.majorId;
    const { year } = req.query;

    // Fetch students in the major for the given year
    const studentsSnapshot = await firestore
      .collection("users")
      .where("MajorId", "==", majorId)
      .where("userDate", ">=", new Date(`${year}-01-01`))
      .where("userDate", "<=", new Date(`${year}-12-31`))
      .get();

    // Fetch major data
    const majorSnapshot = await firestore
      .collection("majors")
      .doc(majorId)
      .get();
    const majorData = majorSnapshot.data();

    const studentsInMajor = [];

    for (const doc of studentsSnapshot.docs) {
      const data = doc.data();
      delete data.password;
      delete data.expo_push_token;

      studentsInMajor.push({
        id: doc.id,
        ...data,
        majorName: majorData.majorName,
      });
    }

    if (studentsInMajor.length === 0) {
      return res
        .status(404)
        .json({ error: "No students found in this major for the given year" });
    }

    res.status(200).json(studentsInMajor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/addmajor", async (req, res) => {
  try {
    const { userId, majorId } = req.body;
    // Check if both userId and majorId are provided
    if (!userId || !majorId) {
      return res
        .status(400)
        .json({ error: "Both userId and majorId are required" });
    }

    // Check if the user exists
    const userSnapshot = await firestore.collection("users").doc(userId).get();
    if (!userSnapshot.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user's major information
    await firestore
      .collection("users")
      .doc(userId)
      .update({ MajorId: majorId });

    res.status(200).json({ message: "User's major updated successfully" });
  } catch (error) {
    console.error("Error updating user's major:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/updategraduated", async (req, res) => {
  try {
    const { graduated, studentId } = req.body;
    if (!studentId || graduated === undefined) {
      return res
        .status(400)
        .json({ error: "Both studentId and graduated status are required" });
    }
    const userSnapshot = await firestore
      .collection("users")
      .doc(studentId)
      .get();
    if (!userSnapshot.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    await firestore
      .collection("users")
      .doc(studentId)
      .update({ graduated: Boolean(graduated) });
    res
      .status(200)
      .json({ message: "User's graduated status updated successfully" });
  } catch (error) {
    console.error("Error updating user's graduated status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.put("/removemajor/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    // Check if the user exists
    const userSnapshot = await firestore.collection("users").doc(userId).get();
    if (!userSnapshot.exists) {
      return res.status(404).json({ error: "User not found" });
    }
    // Remove the user's major information
    await firestore.collection("users").doc(userId).update({ MajorId: null });
    res.status(200).json({ message: "User's major removed successfully" });
  } catch (error) {
    console.error("Error removing user's major:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
