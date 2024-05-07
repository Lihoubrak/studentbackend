const express = require("express");
const { firestore } = require("../firebase/firebase");
const { checkRole } = require("../middleware/authenticateToken");
const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { supportName, supportSpecific, eventId, typePay, date } = req.body;

    if (!supportName || !supportSpecific || !typePay || !date) {
      return res.status(400).json({
        error:
          "Support name, specific, type of payment, and date are required.",
      });
    }

    // Create a new document in the "supportEvents" collection
    const newSupportEventRef = await firestore.collection("supportEvents").add({
      supportName,
      supportSpecific,
      typePay,
      date,
      EventId: eventId,
    });

    // Retrieve the newly created document and send it in the response
    const newSupportEventDoc = await newSupportEventRef.get();
    const newSupportEvent = {
      id: newSupportEventDoc.id,
      ...newSupportEventDoc.data(),
    };

    res.status(201).json(newSupportEvent);
  } catch (error) {
    console.error("Error creating support event:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
router.delete(
  "/delete/:supportEventId",
  checkRole(["KTX", "SCH"]),
  async (req, res) => {
    try {
      const supportEventId = req.params.supportEventId;

      // Delete the support event from Firestore
      await firestore.collection("supportEvents").doc(supportEventId).delete();

      res.status(200).json({ message: "Support event deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error. Failed to delete support event.",
      });
    }
  }
);

//using firebase instead of it
// router.get("/all/:eventId", async (req, res) => {
//   try {
//     const eventId = req.params.eventId;
//     const eventRef = await firestore.collection("events").doc(eventId);
//     // Retrieve all support events for the specified event
//     const supportEventsSnapshot = await firestore
//       .collection("supportEvents")
//       .where("EventId", "==", eventRef)
//       .get();

//     if (supportEventsSnapshot.empty) {
//       return res.status(404).json({
//         error: "No support events found for the given event.",
//       });
//     }

//     // Extract data from Firestore snapshot
//     const supportEvents = [];
//     supportEventsSnapshot.forEach((doc) => {
//       supportEvents.push({
//         id: doc.id,
//         ...doc.data(),
//       });
//     });

//     res.status(200).json(supportEvents);
//   } catch (error) {
//     console.error("Error fetching support events:", error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

module.exports = router;
