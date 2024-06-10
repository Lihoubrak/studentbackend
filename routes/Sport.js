const express = require("express");
const { firestore } = require("../firebase/firebase");
const { checkRole } = require("../middleware/authenticateToken");
const upload = require("../middleware/uploadImage");
const admin = require("firebase-admin");
const router = express.Router();
router.post(
  "/create",
  checkRole(["KTX", "SCH", "Admin"]),
  upload.single("sportImage"),
  async (req, res) => {
    try {
      const {
        sportName,
        sportDate,
        sportLocation,
        sportDescription,
        top1,
        top2,
        top3,
        managers,
      } = req.body;
      const userId = req.user.id;
      const managersArray = managers ? [...managers, userId] : [userId];
      const eventData = {
        sportName,
        sportDate: new Date(sportDate),
        sportLocation,
        sportDescription,
        top1,
        top2,
        top3,
        managers: managersArray,
        sportImage:
          req.file &&
          `${req.protocol}://${req.get("host")}/${req.file.filename}`,
        UserId: userId,
      };

      const docRef = await firestore.collection("sports").add(eventData);
      const newEventSnapshot = await docRef.get();
      const newEvent = newEventSnapshot.data();
      res.status(201).json({ id: docRef.id, ...newEvent });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

router.get(
  "/all/detail/:sportId",
  checkRole(["SCH", "KTX", "Admin"]),
  async (req, res) => {
    try {
      const sportId = req.params.sportId;

      const sportRef = await firestore.collection("sports").doc(sportId).get();
      if (!sportRef.exists) {
        return res.status(404).json({ error: "Sport not found" });
      }
      const sportData = sportRef.data();

      // Assuming UserId is a string ID and not a reference
      const userId = sportData.UserId;
      const userRef = await firestore.collection("users").doc(userId).get();
      if (!userRef.exists) {
        return res.status(404).json({ error: "User not found" });
      }
      const userData = userRef.data();
      const { firstName, lastName } = userData;
      // Assuming you want to include user data in the response
      const responseData = {
        ...sportData,
        User: { firstName, lastName },
      };
      res.status(200).json(responseData);
    } catch (error) {
      console.error("Error fetching sport:", error);
      res.status(500).json({ error: "Unable to fetch sport data" });
    }
  }
);

router.put(
  "/update/:sportId/managers",
  checkRole(["KTX", "SCH", "Admin"]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const { sportId } = req.params;
      const currentTime = new Date().toISOString();

      // Update managers for the sport
      await firestore
        .collection("sports")
        .doc(sportId)
        .update({
          managers: admin.firestore.FieldValue.arrayUnion(userId),
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
  "/remove/:sportId/manager",
  checkRole(["KTX", "SCH", "Admin"]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const { sportId } = req.params;
      const currentTime = new Date().toISOString();

      // Remove the manager from the sport's managers array
      await firestore
        .collection("sports")
        .doc(sportId)
        .update({
          managers: admin.firestore.FieldValue.arrayRemove(userId),
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

module.exports = router;
