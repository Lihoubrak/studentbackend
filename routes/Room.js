const express = require("express");
const Room = require("../models/Room");
const User = require("../models/User");
const { Op } = require("sequelize");
const Dormitory = require("../models/Dormitory");
const { checkRole } = require("../middleware/authenticateToken");
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
router.get("/all/:dormId", async (req, res) => {
  try {
    const dormId = req.params.dormId;
    const allRoom = await Room.findAll({ where: { DormitoryId: dormId } });
    if (!allRoom) {
      return res
        .status(404)
        .json({ error: "Rooms not found for the dormitory ID provided" });
    }
    return res.status(200).json(allRoom);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/detail/:roomId", async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const { year } = req.query;
    const studentsInRoom = await User.findAll({
      where: {
        RoomId: roomId,
        createdAt: {
          [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
        },
      },
      attributes: { exclude: ["password"] },
      include: [{ model: Room, include: { model: Dormitory } }],
    });
    if (!studentsInRoom || studentsInRoom.length === 0) {
      return res
        .status(404)
        .json({ error: "No students found in this room for the given year" });
    }
    res.status(200).json(studentsInRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/all", checkRole("KTX"), async (req, res) => {
  try {
    const userId = req.user.id;
    const dormitories = await Dormitory.findAll({ where: { UserId: userId } });
    const allRooms = await Room.findAll({
      where: {
        DormitoryId: { [Op.in]: dormitories.map((dormitory) => dormitory.id) },
      },
    });
    res.status(200).json(allRooms);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/switchrooms", async (req, res) => {
  try {
    const { userAId, userBId } = req.body;
    const userA = await User.findOne({ where: { id: userAId } });
    const userB = await User.findOne({ where: { id: userBId } });
    if (!userA || !userB) {
      return res.status(404).json({ message: "One or both users not found" });
    }

    // Swap their room IDs
    const tempRoomId = userA.RoomId;
    userA.RoomId = userB.RoomId;
    userB.RoomId = tempRoomId;

    // Save the changes to the database
    await Promise.all([userA.save(), userB.save()]);
    return res
      .status(200)
      .json({ message: "Users' rooms switched successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});
router.put("/addstudentroom", async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    if (!roomId || !userId) {
      return res
        .status(400)
        .json({ error: "Both roomId and userId are required" });
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    await user.update({ RoomId: roomId });
    res.status(200).json({ message: "User's room updated successfully" });
  } catch (error) {
    console.error("Error updating user's room:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
