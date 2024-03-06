const express = require("express");
const SupportEvent = require("../models/SupportEvent");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { supportName, supportSpecific, eventId } = req.body;
    if (!supportName || !supportSpecific) {
      return res
        .status(400)
        .json({ error: "Support name and specific are required." });
    }
    const newSupportEvent = await SupportEvent.create({
      supportName,
      supportSpecific,
      EventId: eventId,
    });

    res.status(201).json(newSupportEvent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
