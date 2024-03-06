const express = require("express");
const Water = require("../models/Water");
const router = express.Router();
router.post("/water", async (req, res) => {
  try {
    const {
      oldIndex,
      newIndex,
      exceedLimit,
      totalConsumption,
      pricePerKwh,
      totalAmount,
      support,
      date,
      roomId,
    } = req.body;
    if (
      !oldIndex ||
      !newIndex ||
      !exceedLimit ||
      !totalConsumption ||
      !pricePerKwh ||
      !date
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newWaterRecord = await Water.create({
      oldIndex,
      newIndex,
      exceedLimit,
      totalConsumption,
      pricePerKwh,
      totalAmount: totalAmount || 0,
      support: support || 0,
      date,
      RoomId: roomId,
    });

    res.status(201).json(newWaterRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
