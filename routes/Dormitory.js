const express = require("express");
const Dormitory = require("../models/Dormitory");
const upload = require("../middleware/uploadImage");
const { checkRole } = require("../middleware/authenticateToken");
const router = express.Router();

router.post(
  "/create",
  checkRole("KTX"),
  upload.single("dormImage"),
  async (req, res) => {
    try {
      const { dormName, dormLocation, dormDescription } = req.body;
      const userId = req.user.id;
      // Validate required fields
      if (!dormName || !dormLocation || !dormDescription) {
        return res.status(400).json({
          error: "Dormitory name, location, and description are required.",
        });
      }

      let dormImage = "No Image";
      if (req.file) {
        // If a file is uploaded, set dormImage to the filename
        const localhost = "http://localhost:3000/";
        dormImage = localhost + req.file.filename;
      }

      const newDormitory = await Dormitory.create({
        UserId: userId,
        dormName,
        dormLocation,
        dormDescription,
        dormImage,
      });

      res.status(201).json(newDormitory);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error. Failed to create dormitory." });
    }
  }
);

router.get("/all", checkRole("KTX"), async (req, res) => {
  try {
    const userId = req.user.id;
    const allDorm = await Dormitory.findAll({ where: { UserId: userId } });
    res.json(allDorm);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
