const express = require("express");
const Healthcare = require("../models/Healthcare");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { date, note, cost, discount, totalPatientPay, hospital, userId } =
      req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required." });
    }
    const newHealthcareEvent = await Healthcare.create({
      date,
      note,
      cost,
      discount,
      totalPatientPay,
      hospital,
      UserId: userId,
    });

    res.status(201).json(newHealthcareEvent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
