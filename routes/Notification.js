const express = require("express");
const Notification = require("../models/Notification");
const ExpoNotifications = require("../models/ExpoNotifications");
const { checkRole } = require("../middleware/authenticateToken");
const Room = require("../models/Room");
const User = require("../models/User");
const { Op } = require("sequelize");
const Major = require("../models/Major");
const router = express.Router();
const sendPushNotifications = require("../utils/sendPushNotifications");
router.post("/send", checkRole(["KTX", "SCH"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const { description, content, file, type, notificationTo } = req.body;

    // Step 1: Create a new notification
    const newNotification = await Notification.create({
      description,
      content,
      file,
      type,
      UserId: userId,
    });

    let AllIds;
    let tokenIds; // Define tokenIds variable

    if (type === "Dorms") {
      AllIds = await Room.findAll({
        where: { DormitoryId: notificationTo },
      });
      if (AllIds.length === 0) {
        return res
          .status(404)
          .json({ error: "No rooms found for the given notificationTo" });
      }
      tokenIds = await User.findAll({
        attributes: ["expo_push_token"],
        where: { RoomId: { [Op.in]: AllIds.map((room) => room.id) } },
      });
      if (tokenIds.length === 0) {
        return res
          .status(404)
          .json({ error: "No users found for the given roomIds" });
      }
    } else if (type === "Univ") {
      AllIds = await Major.findAll({
        where: { SchoolId: notificationTo },
      });
      if (AllIds.length === 0) {
        return res
          .status(404)
          .json({ error: "No major found for the given notificationTo" });
      }
      tokenIds = await User.findAll({
        attributes: ["expo_push_token"],
        where: { MajorId: { [Op.in]: AllIds.map((major) => major.id) } },
      });
      if (tokenIds.length === 0) {
        return res
          .status(404)
          .json({ error: "No users found for the given majorIds" });
      }
    }
    await sendPushNotifications(
      tokenIds.map((user) => user.expo_push_token),
      description,
      content
    );

    res.status(201).json({
      notification: newNotification,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the notification" });
  }
});

module.exports = router;
