const express = require("express");
const { firestore } = require("../firebase/firebase");
const { checkRole } = require("../middleware/authenticateToken");
const router = express.Router();
const admin = require("firebase-admin");
router.post("/create", checkRole(["KTX", "SCH", "Admin"]), async (req, res) => {
  try {
    const { playerPosition, playerDescription, userId, teamSportId } = req.body;
    const existingPlayer = await firestore
      .collection("sportPlayers")
      .where("UserId", "==", userId)
      .where("TeamSportId", "==", teamSportId)
      .get();
    if (!existingPlayer.empty) {
      return res
        .status(400)
        .json({ error: "User already exists in this team." });
    }
    const playerData = {
      playerPosition,
      playerDescription,
      UserId: userId,
      TeamSportId: teamSportId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await firestore.collection("sportPlayers").add(playerData);
    const newPlayerSnapshot = await docRef.get();
    const newPlayer = newPlayerSnapshot.data();
    res.status(201).json({ id: docRef.id, ...newPlayer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
router.delete(
  "/delete/:playerId",
  checkRole(["KTX", "SCH", "Admin"]),
  async (req, res) => {
    try {
      const playerId = req.params.playerId;
      // Delete the player
      await firestore.collection("sportPlayers").doc(playerId).delete();
      res.status(200).json({ message: "Player deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

module.exports = router;
