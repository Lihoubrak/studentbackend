const express = require("express");
const Room = require("../models/Room");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { roomNumber, numberOfStudents, dormitoryId } = req.body;
    if (!roomNumber || !numberOfStudents) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newRoom = await Room.create({
      DormitoryId: dormitoryId,
      roomNumber,
      numberOfStudents,
    });
    res.status(201).json(newRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
