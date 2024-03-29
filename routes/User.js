const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { generateToken, checkRole } = require("../middleware/authenticateToken");
const Room = require("../models/Room");
const Dormitory = require("../models/Dormitory");
const Role = require("../models/Role");
const Major = require("../models/Major");
const School = require("../models/School");
const { Op } = require("sequelize");
const router = express.Router();
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      password,
      confirmPassword,
      roleId,
      majorId,
      roomId,
      firstName,
      lastName,
      age,
      nationality,
      gender,
      email,
      phoneNumber,
      facebook,
      zalo,
      avatar,
      expo_push_token,
    } = req.body;

    // Input validation
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // Check if username already exists
    const existingUser = await User.findOne({
      where: { username: username },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      RoleId: roleId,
      MajorId: majorId,
      RoomId: roomId,
      firstName,
      lastName,
      age,
      nationality,
      gender,
      email,
      phoneNumber,
      facebook,
      zalo,
      avatar,
      expo_push_token,
    });

    // Return success response
    res.status(201).json(newUser);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password, expoToken } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    const user = await User.findOne({
      where: { username: username },
      include: { model: Role },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    await user.update({ expo_push_token: expoToken });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = generateToken(user);
    res.status(200).json(token);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/all/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const allStudents = await User.findAll({
      where: {
        id: {
          [Op.not]: userId,
        },
      },
      include: { model: Room, include: { model: Dormitory } },
      attributes: { exclude: ["password"] },
    });
    res.status(200).json(allStudents);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

//For Appliciation
router.get("/:userId/detail", async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await User.findOne({
      where: { id: userId },
      attributes: { exclude: "password" },
      include: [
        {
          model: Room,
        },
        {
          model: Major,
          include: [{ model: School }],
        },
      ],
    });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get(
  "/alluser",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const allUsers = await User.findAll({
        where: {
          id: {
            [Op.not]: userId,
          },
        },
      });
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
