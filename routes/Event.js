const express = require("express");
const upload = require("../middleware/uploadImage");
const { checkRole } = require("../middleware/authenticateToken");
const { firestore } = require("../firebase/firebase");
const admin = require("firebase-admin");
const router = express.Router();
router.post(
  "/create",
  checkRole(["KTX", "SCH", "Admin"]),
  upload.single("eventImage"),
  async (req, res) => {
    try {
      const {
        eventName,
        eventLocation,
        eventDescription,
        eventDate,
        eventExpiry,
        foodMenu,
        eventsInProgram,
        ticketPrice,
        paymentPerStudent,
        numberOfTicket,
        managers,
      } = req.body;

      if (
        !eventName ||
        !eventLocation ||
        !eventDescription ||
        !eventDate ||
        !eventExpiry ||
        !ticketPrice ||
        !paymentPerStudent ||
        !numberOfTicket
      ) {
        return res
          .status(400)
          .json({ error: "All required fields must be provided." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Event image is required." });
      }

      const userId = req.user.id;

      // Khởi tạo mảng managers, nếu không được cung cấp, mặc định là một mảng chứa userRef
      const managersArray = managers ? [...managers, userId] : [userId];

      // Chuyển đổi foodMenu và eventsInProgram thành mảng nếu chúng được cung cấp dưới dạng chuỗi JSON
      const parsedFoodMenu = foodMenu ? JSON.parse(foodMenu) : ["No Food Menu"];
      const parsedEventsInProgram = eventsInProgram
        ? JSON.parse(eventsInProgram)
        : ["No Events in Program"];

      // Lưu thông tin sự kiện vào Firestore
      const newEventRef = await firestore.collection("events").add({
        UserId: userId,
        managers: managersArray,
        eventName,
        eventLocation,
        eventDescription,
        eventImage: `http://localhost:3000/${req.file.filename}`,
        eventDate: new Date(eventDate),
        eventExpiry: new Date(eventExpiry),
        foodMenu: parsedFoodMenu,
        eventsInProgram: parsedEventsInProgram,
        ticketPrice,
        paymentPerStudent,

        numberOfTicket: numberOfTicket || 0,
      });

      const newEventDoc = await newEventRef.get();
      const newEvent = newEventDoc.data();
      res.status(201).json(newEvent);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error. Failed to create event." });
    }
  }
);

router.get("/all", checkRole(["KTX", "SCH"]), async (req, res) => {
  try {
    const userId = req.user.id;
    let eventsQuery = firestore
      .collection("events")
      .where("UserId", "==", userId);

    const { year } = req.query;
    if (year) {
      eventsQuery = eventsQuery
        .where("eventDate", ">=", new Date(`${year}-01-01`))
        .where("eventDate", "<=", new Date(`${year}-12-31`));
    }

    const eventsSnapshot = await eventsQuery.get();
    const allEvents = [];
    eventsSnapshot.forEach((doc) => {
      allEvents.push({ id: doc.id, ...doc.data() });
    });

    if (allEvents.length === 0) {
      return res.status(404).json({ error: "No events found." });
    }

    res.status(200).json(allEvents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put(
  "/:eventId/update",
  upload.single("eventImage"),
  async (req, res) => {
    try {
      const eventId = req.params.eventId;
      const {
        eventName,
        eventLocation,
        eventDescription,
        eventDate,
        eventExpiry,
        foodMenu,
        eventsInProgram,
        ticketPrice,
        paymentPerStudent,
        numberOfTicket,
      } = req.body;

      // Assuming "events" is your collection name in Firestore
      const eventRef = firestore.collection("events").doc(eventId);
      const eventDoc = await eventRef.get();
      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found." });
      }

      // Get existing event data
      const eventToUpdate = eventDoc.data();

      // Check if foodMenu and eventsInProgram contain default values
      const isFoodMenuDefault =
        JSON.parse(foodMenu) &&
        JSON.parse(foodMenu).every((item) => item.name === "");
      const isEventsInProgramDefault =
        JSON.parse(eventsInProgram) &&
        JSON.parse(eventsInProgram).every((item) => item.eventName === "");
      // Update event fields based on request body, or retain existing values if not provided
      const updatedEventData = {
        eventName: eventName || eventToUpdate.eventName,
        eventLocation: eventLocation || eventToUpdate.eventLocation,
        eventDescription: eventDescription || eventToUpdate.eventDescription,
        eventImage: req.file
          ? `${req.protocol}://${req.get("host")}/${req.file.filename}`
          : eventToUpdate.eventImage,
        eventDate: eventDate || eventToUpdate.eventDate,
        eventExpiry: eventExpiry || eventToUpdate.eventExpiry,
        foodMenu: isFoodMenuDefault
          ? eventToUpdate.foodMenu
          : JSON.parse(foodMenu),
        eventsInProgram: isEventsInProgramDefault
          ? eventToUpdate.eventsInProgram
          : JSON.parse(eventsInProgram),
        ticketPrice: ticketPrice || eventToUpdate.ticketPrice,
        paymentPerStudent: paymentPerStudent || eventToUpdate.paymentPerStudent,
        numberOfTicket: numberOfTicket || eventToUpdate.numberOfTicket,
      };

      // Update the event document with the new data
      await eventRef.update(updatedEventData);

      // Retrieve the updated event document and send it in the response
      const updatedEventDoc = await eventRef.get();
      const updatedEvent = updatedEventDoc.data();

      res.status(200).json(updatedEvent);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

router.get("/:eventId/detail", async (req, res) => {
  try {
    const eventId = req.params.eventId;

    // Fetch event document
    const eventDoc = await firestore.collection("events").doc(eventId).get();

    if (!eventDoc.exists) {
      return res.status(404).json({ error: "Event not found." });
    }

    // Extract userId from the event document
    const eventData = eventDoc.data();
    const userId = eventData.UserId; // Assuming userId is a string ID

    // Fetch user document using the userId
    const userDoc = await firestore.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found." });
    }

    const { firstName, lastName } = userDoc.data();

    // Combine event data with user data
    const eventDataWithUserInfo = {
      ...eventData,
      user: {
        id: userId,
        firstName,
        lastName,
      },
    };

    // Send the response
    res.status(200).json(eventDataWithUserInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.put(
  "/update/:eventId/managers",
  checkRole(["KTX", "SCH", "Admin"]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const { eventId } = req.params;
      const currentTime = new Date().toISOString();

      // Update managers for the event
      await firestore
        .collection("events")
        .doc(eventId)
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
  "/remove/:eventId/manager",
  checkRole(["KTX", "SCH", "Admin"]),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const { eventId } = req.params;
      const currentTime = new Date().toISOString();
      // Remove the manager from the event's managers array
      await firestore
        .collection("events")
        .doc(eventId)
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

//for Application
router.get("/allevent", async (req, res) => {
  try {
    const { year } = req.query;
    const allEventSnapshot = await firestore
      .collection("events")
      .where("eventDate", ">=", new Date(`${year}-01-01`))
      .where("eventDate", "<=", new Date(`${year}-12-31`))
      .get();

    const allEvent = [];
    allEventSnapshot.forEach((doc) => {
      const eventData = doc.data();
      // Include the event ID in the data
      allEvent.push({ id: doc.id, ...eventData });
    });
    res.status(200).json(allEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/detailevent/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;

    // Retrieve event details from Firestore
    const eventSnapshot = await firestore
      .collection("events")
      .doc(eventId)
      .get();
    const eventDetail = eventSnapshot.data();

    if (!eventDetail) {
      return res.status(404).json({ error: "Event not found" });
    }

    res.status(200).json(eventDetail);
  } catch (error) {
    console.error("Error fetching event details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
