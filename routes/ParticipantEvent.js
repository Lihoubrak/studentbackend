const express = require("express");
const ParticipantEvent = require("../models/ParticipantEvent");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { date, typePayMoney, payMoney, userId, eventId } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required." });
    }
    const newParticipantEvent = await ParticipantEvent.create({
      date,
      typePayMoney,
      payMoney,
      UserId: userId,
      EventId: eventId,
    });
    res.status(201).json(newParticipantEvent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
