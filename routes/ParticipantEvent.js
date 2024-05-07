const express = require("express");
const { firestore } = require("../firebase/firebase");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const {
      date = new Date().toISOString().split("T")[0],
      typePayMoney = "Card",
      userId,
      eventId,
    } = req.body;

    // Check if the user has already registered for the event
    const existingParticipantEvent = await firestore
      .collection("participantEvents")
      .where("UserId", "==", userId)
      .where("EventId", "==", eventId)
      .get();

    if (!existingParticipantEvent.empty) {
      return res
        .status(400)
        .json({ error: "User already registered for the event" });
    }

    // Retrieve the event document from the "events" collection
    const eventRef = await firestore.collection("events").doc(eventId).get();

    if (!eventRef.exists) {
      return res.status(404).json({ error: "Event not found" });
    }

    // Extract the price from the event document
    const eventPrice = eventRef.data().ticketPrice;

    // Create a new document in the "participantEvents" collection
    const newParticipantEventRef = await firestore
      .collection("participantEvents")
      .add({
        date,
        typePayMoney,
        payMoney: eventPrice,
        UserId: userId,
        EventId: eventId,
      });

    // Retrieve the newly created document and send it in the response
    const newParticipantEventDoc = await newParticipantEventRef.get();
    const newParticipantEvent = {
      id: newParticipantEventDoc.id,
      ...newParticipantEventDoc.data(),
    };

    res.status(201).json(newParticipantEvent);
  } catch (error) {
    console.error("Error creating participant event:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/all/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Retrieve all participant events for the specified event
    const participantEventsSnapshot = await firestore
      .collection("participantEvents")
      .where("EventId", "==", eventId)
      .get();

    if (participantEventsSnapshot.empty) {
      return res.status(404).json({
        error: "No participant events found for the given event.",
      });
    }

    // Extracting participant data from the snapshot
    const participants = [];
    for (const doc of participantEventsSnapshot.docs) {
      const participantData = doc.data();
      const userId = participantData.UserId;

      // Retrieve user data
      const userSnapshot = await firestore
        .collection("users")
        .doc(userId)
        .get();
      const userData = userSnapshot.data();
      delete userData.password;
      delete userData.expo_push_token;

      const roomId = userData.RoomId;
      // Retrieve room data
      const roomSnapshot = await firestore
        .collection("rooms")
        .doc(roomId)
        .get();
      const roomData = roomSnapshot.data();

      const dormitoryId = roomData.DormitoryId;
      // Retrieve dormitory data
      const dormitorySnapshot = await firestore
        .collection("dormitories")
        .doc(dormitoryId)
        .get();
      const dormitoryData = dormitorySnapshot.data();

      participants.push({
        id: doc.id,
        date: participantData.date,
        typePayMoney: participantData.typePayMoney,
        payMoney: participantData.payMoney,
        User: {
          id: userId,
          ...userData,
          Room: {
            id: roomId,
            roomNumber: roomData.roomNumber,
            Dormitory: {
              id: dormitoryId,
              dormName: dormitoryData.dormName,
            },
          },
        },
      });
    }

    res.status(200).json(participants);
  } catch (error) {
    console.error("Error fetching participant events:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
router.delete("/delete/:participantEventId", async (req, res) => {
  try {
    const participantEventId = req.params.participantEventId;

    // Check if the participant event exists
    const participantEventRef = await firestore
      .collection("participantEvents")
      .doc(participantEventId)
      .get();

    if (!participantEventRef.exists) {
      return res.status(404).json({ error: "Participant event not found" });
    }

    // Delete the participant event
    await participantEventRef.ref.delete();
    res.status(200).json({ message: "Participant event deleted successfully" });
  } catch (error) {
    console.error("Error deleting participant event:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
