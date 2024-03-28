const express = require("express");
const School = require("../models/School");
const Major = require("../models/Major");
const User = require("../models/User");
const { Op } = require("sequelize");
const upload = require("../middleware/uploadImage");
const { checkRole } = require("../middleware/authenticateToken");
const router = express.Router();

router.post(
  "/create",
  checkRole("SCH"),
  upload.single("schoolImage"),
  async (req, res) => {
    try {
      const { schoolName, schoolLocation, schoolDescription } = req.body;

      // Validate required fields
      if (!schoolName || !schoolLocation || !schoolDescription) {
        return res.status(400).json({
          error: "School name, location, and description are required.",
        });
      }

      let schoolImage = "No Image";
      if (req.file) {
        // If a file is uploaded, set schoolImage to the filename
        const localhost = "http://localhost:3000/";
        schoolImage = localhost + req.file.filename;
      }
      const userId = req.user.id;
      const newSchool = await School.create({
        UserId: userId,
        schoolName,
        schoolLocation,
        schoolDescription,
        schoolImage,
      });

      res.status(201).json(newSchool);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error. Failed to create school." });
    }
  }
);

router.get("/all", checkRole("SCH"), async (req, res) => {
  try {
    const userId = req.user.id;
    const schools = await School.findAll({ where: { UserId: userId } });
    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});
router.get("/detail/:schoolId", async (req, res) => {
  try {
    const schoolId = req.params.schoolId;
    const { year } = req.query;
    // Find all majors in the school
    const majors = await Major.findAll({ where: { SchoolId: schoolId } });

    // Extract an array of major IDs
    const majorIds = majors.map((major) => major.id);

    // Find all students in the majors
    const studentsInSchool = await User.findAll({
      where: {
        MajorId: majorIds,
        createdAt: {
          [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
        },
      },
      attributes: { exclude: ["password"] },
      include: [{ model: Major }],
    });
    if (!studentsInSchool || studentsInSchool.length === 0) {
      return res
        .status(404)
        .json({ error: "No students found in this major for the given year" });
    }
    res.status(200).json(studentsInSchool);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/allschool", async (req, res) => {
  try {
    const allSchool = await School.findAll();
    res.status(200).json(allSchool);
  } catch (error) {}
});

module.exports = router;
