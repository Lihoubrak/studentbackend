const express = require("express");
const Event = require("../models/Event");
const { Op } = require("sequelize");
const upload = require("../middleware/uploadImage");
const { checkRole } = require("../middleware/authenticateToken");
const router = express.Router();
router.post(
  "/create",
  checkRole("KTX"),
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
        return res
          .status(400)
          .json({ error: "All required fields must be provided." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Event image is required." });
      }
      const userId = req.user.id;
      const localhost = "http://localhost:3000/";
      const eventImage = req.file ? localhost + req.file.filename : "No Image";

      const newEvent = await Event.create({
        UserId: userId,
        eventName,
        eventLocation,
        eventDescription,
        eventImage,
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
      res
        .status(500)
        .json({ error: "Internal server error. Failed to create event." });
    }
  }
);

router.get("/all", checkRole("KTX"), async (req, res) => {
  try {
    const userId = req.user.id;
    const allEvents = await Event.findAll({ where: { id: userId } });
    if (allEvents.length === 0) {
      return res.status(404).json({ error: "No events found." });
    }
    res.status(200).json(allEvents);
  } catch (error) {
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
      const eventToUpdate = await Event.findByPk(eventId);
      if (!eventToUpdate) {
        return res.status(404).json({ error: "Event not found." });
      }
      const localhost = "http://localhost:3000/";
      const eventImage = req.file && localhost + req.file.filename;
      eventToUpdate.eventName = eventName || eventToUpdate.eventName;
      eventToUpdate.eventLocation =
        eventLocation || eventToUpdate.eventLocation;
      eventToUpdate.eventDescription =
        eventDescription || eventToUpdate.eventDescription;
      eventToUpdate.eventImage = eventImage || eventToUpdate.eventImage;
      eventToUpdate.eventDate = eventDate || eventToUpdate.eventDate;
      eventToUpdate.eventExpiry = eventExpiry || eventToUpdate.eventExpiry;
      eventToUpdate.foodMenu = foodMenu || eventToUpdate.foodMenu;
      eventToUpdate.eventsInProgram =
        eventsInProgram || eventToUpdate.eventsInProgram;
      eventToUpdate.ticketPrice = ticketPrice || eventToUpdate.ticketPrice;
      eventToUpdate.paymentPerStudent =
        paymentPerStudent || eventToUpdate.paymentPerStudent;
      eventToUpdate.numberOfTicket =
        numberOfTicket || eventToUpdate.numberOfTicket;

      await eventToUpdate.save();

      res.status(200).json(eventToUpdate);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);
router.get("/:eventId/detail", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { year } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const event = await Event.findOne({
      where: {
        id: eventId,
        eventDate: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
    if (!event) {
      return res.status(404).json({ error: "Event not found." });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
