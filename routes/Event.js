const express = require("express");
const Event = require("../models/Event");
const router = express.Router();
router.post("/events", async (req, res) => {
  try {
    const {
      eventName,
      eventLocation,
      eventDescription,
      eventImage,
      eventDate,
      eventExpiry,
      foodMenu,
      eventsInProgram,
      ticketPrice,
      paymentPerStudent,
      numberOfTicket,
      userId,
    } = req.body;
    if (
      !eventName ||
      !eventLocation ||
      !eventDescription ||
      !eventDate ||
      !eventExpiry ||
      !ticketPrice ||
      !paymentPerStudent
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newEvent = await Event.create({
      UserId: userId,
      eventName,
      eventLocation,
      eventDescription,
      eventImage: eventImage || "No Image",
      eventDate,
      eventExpiry,
      foodMenu: foodMenu || ["No Food Menu"],
      eventsInProgram: eventsInProgram || ["No Events in Program"],
      ticketPrice,
      paymentPerStudent,
      numberOfTicket: numberOfTicket || 0,
    });

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
