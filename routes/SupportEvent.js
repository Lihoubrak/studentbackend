const express = require("express");
const SupportEvent = require("../models/SupportEvent");
const { Op } = require("sequelize");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { supportName, supportSpecific, eventId, typePay, date } = req.body;
    if (!supportName || !supportSpecific || !typePay || !date) {
      return res
        .status(400)
        .json({ error: "Support name and specific are required." });
    }
    const newSupportEvent = await SupportEvent.create({
      supportName,
      supportSpecific,
      typePay,
      date,
      EventId: eventId,
    });

    res.status(201).json(newSupportEvent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});
router.get("/all/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { year } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const supportEvents = await SupportEvent.findAll({
      where: {
        EventId: eventId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
    if (supportEvents.length === 0) {
      return res.status(404).json({
        error: "No support events found for the given eventId and year.",
      });
    }
    return res.status(200).json(supportEvents);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
