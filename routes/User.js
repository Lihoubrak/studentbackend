const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { generateToken } = require("../middleware/authenticateToken");
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
    } = req.body;
    if (!username || !password || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }
    const existingUser = await User.findOne({
      where: { username: username },
    });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
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
    });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "username and password are required." });
    }

    const user = await User.findOne({
      where: { username },
      include: { model: Role },
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }
    const token = generateToken(user);
    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
