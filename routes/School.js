const express = require("express");
const School = require("../models/School");
const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const {
      schoolName,
      schoolLocation,
      schoolDescription,
      schoolImage,
      userId,
    } = req.body;
    if (!schoolName || !schoolLocation || !schoolDescription) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newSchool = await School.create({
      UserId: userId,
      schoolName,
      schoolLocation,
      schoolDescription,
      schoolImage: schoolImage || "No Image",
    });

    res.status(201).json(newSchool);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
