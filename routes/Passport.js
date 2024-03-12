const express = require("express");
const Passport = require("../models/Passport");
const User = require("../models/User");
const { Op, Sequelize } = require("sequelize");
const sequelize = require("../models/ConnectionDB");
const { checkRole } = require("../middleware/authenticateToken");
const Room = require("../models/Room");
const Dormitory = require("../models/Dormitory");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const {
      passportNumber,
      type,
      code,
      firstName,
      lastName,
      age,
      nationality,
      dateofbirth,
      placeofbirth,
      placeofissue,
      dateofissue,
      dateofexpiry,
      gender,
      image,
      userId,
    } = req.body;
    if (
      !passportNumber ||
      !type ||
      !code ||
      !firstName ||
      !lastName ||
      !age ||
      !nationality ||
      !placeofbirth ||
      !dateofbirth ||
      !placeofissue ||
      !dateofissue ||
      !dateofexpiry ||
      !gender
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newPassport = await Passport.create({
      UserId: userId,
      passportNumber,
      type,
      code,
      firstName,
      lastName,
      age,
      nationality,
      dateofbirth,
      placeofbirth,
      placeofissue,
      dateofissue,
      dateofexpiry,
      gender,
      image: image || "No Image",
    });

    res.status(201).json(newPassport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
router.get("/detail/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const passport = await Passport.findOne({ where: { UserId: userId } });
    res.status(200).json(passport);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/list", checkRole("KTX"), async (req, res) => {
  try {
    const { year } = req.query;
    const userId = req.user.id;
    const dormitories = await Dormitory.findAll({
      where: { UserId: userId },
      include: [{ model: Room }],
    });
    const roomIds = dormitories.flatMap((dormitory) =>
      dormitory.Rooms.map((room) => room.id)
    );

    const listStudentYear = await User.findAll({
      where: {
        RoomId: { [Op.in]: roomIds },
        createdAt: {
          [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
        },
      },
      attributes: { exclude: ["password"] },
      include: { model: Passport },
    });

    res.status(200).json(listStudentYear);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/year", async (req, res) => {
  try {
    const years = await User.findAll({
      attributes: [
        [Sequelize.fn("YEAR", Sequelize.col("createdAt")), "year"], // Extract year from createdAt field
      ],
      group: ["year"], // Group by year
      raw: true, // Set raw to true to get plain JSON objects instead of Sequelize model instances
    });
    const uniqueYears = years.map((year) => year.year);
    res.json(uniqueYears);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
