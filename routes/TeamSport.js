const express = require("express");
const { firestore } = require("../firebase/firebase");
const { checkRole } = require("../middleware/authenticateToken");
const upload = require("../middleware/uploadImage");
const router = express.Router();
const admin = require("firebase-admin");
router.post(
  "/create",
  checkRole(["KTX", "SCH", "Admin"]),
  upload.single("logo"),
  async (req, res) => {
    try {
      const {
        teamName,
        representative,
        location,
        numberOfMember,
        phoneNumber,
        sportId,
        logo,
        rank,
      } = req.body;

      let logoUrl;

      // Check if logo is a file or a link
      if (req.file) {
        // If logo is a file, construct the URL
        logoUrl = `${req.protocol}://${req.get("host")}/${req.file.filename}`;
      } else if (logo && typeof logo === "string" && logo.startsWith("http")) {
        // If logo is already a URL, use it directly
        logoUrl = logo;
      } else {
        // Handle the case where logo is neither a file nor a valid URL
        throw new Error("Invalid logo provided.");
      }
      const teamSportData = {
        teamName,
        representative,
        location,
        numberOfMember,
        phoneNumber,
        rank: "Not Yet",
        SportId: sportId,
        logo: logoUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await firestore
        .collection("teamSports")
        .add(teamSportData);
      const newTeamSportSnapshot = await docRef.get();
      const newTeamSport = newTeamSportSnapshot.data();
      res.status(201).json({ id: docRef.id, ...newTeamSport });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);
router.put("/rank/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;
    const { rank } = req.body;

    // Update rank in Firestore
    const teamRef = firestore.collection("teamSports").doc(teamId);
    await teamRef.update({ rank });

    // Respond with updated team data
    const updatedTeamSnapshot = await teamRef.get();
    const updatedTeamData = updatedTeamSnapshot.data();
    res.status(200).json(updatedTeamData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
