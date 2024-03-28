const express = require("express");
const Major = require("../models/Major");
const User = require("../models/User");
const { Op } = require("sequelize");
const upload = require("../middleware/uploadImage");
const { checkRole } = require("../middleware/authenticateToken");
const School = require("../models/School");
const router = express.Router();
router.post("/create", upload.single("majorImage"), async (req, res) => {
  try {
    const { majorName, majorDescription, dateForStudying, schoolId } = req.body;

    // Validate required fields
    if (!majorName || !majorDescription || !dateForStudying || !schoolId) {
      return res.status(400).json({
        error:
          "Major name, description, date for studying, and school ID are required.",
      });
    }

    let majorImage = "No Image";
    if (req.file) {
      // If a file is uploaded, set majorImage to the filename
      const localhost = "http://localhost:3000/";
      majorImage = localhost + req.file.filename;
    }

    const newMajor = await Major.create({
      SchoolId: schoolId,
      majorName,
      majorDescription,
      majorImage,
      dateForStudying,
    });

    res.status(201).json(newMajor);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Internal server error. Failed to create major." });
  }
});

router.get("/all/:schoolId", async (req, res) => {
  try {
    const schoolId = req.params.schoolId;
    const allMajorsInSchool = await Major.findAll({
      where: { SchoolId: schoolId },
    });

    res.status(200).json(allMajorsInSchool);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/detail/:majorId", async (req, res) => {
  try {
    const majorId = req.params.majorId;
    const { year } = req.query;

    if (!year || isNaN(new Date(`${year}-01-01`))) {
      return res.status(400).json({ error: "Invalid year provided" });
    }

    const studentsInMajor = await User.findAll({
      where: {
        MajorId: majorId,
        createdAt: {
          [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
        },
      },
      attributes: { exclude: ["password"] },
      include: [{ model: Major }],
    });

    if (!studentsInMajor || studentsInMajor.length === 0) {
      return res
        .status(404)
        .json({ error: "No students found in this major for the given year" });
    }

    res.status(200).json(studentsInMajor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
