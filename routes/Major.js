const express = require("express");
const Major = require("../models/Major");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { majorName, majorDescription, majorImage, schoolId } = req.body;
    if (!majorName || !majorDescription) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newMajor = await Major.create({
      SchoolId: schoolId,
      majorName,
      majorDescription,
      majorImage: majorImage || "No Image",
    });

    res.status(201).json(newMajor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
