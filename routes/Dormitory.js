const express = require("express");
const Dormitory = require("../models/Dormitory");
const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { dormName, dormLocation, dormDescription, dormImage, userId } =
      req.body;
    if (!dormName || !dormLocation || !dormDescription) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newDormitory = await Dormitory.create({
      UserId: userId,
      dormName,
      dormLocation,
      dormDescription,
      dormImage: dormImage || "No Image",
    });
    res.status(201).json(newDormitory);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
