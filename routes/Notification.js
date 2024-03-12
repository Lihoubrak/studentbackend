const express = require("express");
const Notification = require("../models/Notification");
const ExpoNotifications = require("../models/ExpoNotifications");
const { checkRole } = require("../middleware/authenticateToken");
const Room = require("../models/Room");
const User = require("../models/User");
const { Op } = require("sequelize");
const router = express.Router();

router.post("/send", checkRole("KTX"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { description, content, file, type, dormId } = req.body;

    // Step 1: Create a new notification
    const newNotification = await Notification.create({
      description,
      content,
      file,
      type,
      UserId: userId,
    });

    // Step 2: Retrieve roomIds
    const roomIds = await Room.findAll({ where: { DormitoryId: dormId } });
    if (roomIds.length === 0) {
      return res
        .status(404)
        .json({ error: "No rooms found for the given dormId" });
    }

    // Step 3: Retrieve tokenIds
    const tokenIds = await User.findAll({
      attributes: ["expo_push_token"],
      where: { RoomId: { [Op.in]: roomIds.map((room) => room.id) } },
    });

    if (tokenIds.length === 0) {
      return res
        .status(404)
        .json({ error: "No users found for the given roomIds" });
    }

    // Step 4: Create ExpoNotifications in bulk
    const expoNotifications = await ExpoNotifications.bulkCreate(
      tokenIds.map((token) => ({
        expo_push_token: token.expo_push_token,
        sent_at: new Date(),
        NotificationId: newNotification.id,
      }))
    );

    res.status(201).json({
      notification: newNotification,
      expoNotifications: expoNotifications,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the notification" });
  }
});

module.exports = router;
