const express = require("express");
const Notification = require("../models/Notification");
const ExpoNotifications = require("../models/ExpoNotifications");
const { checkRole } = require("../middleware/authenticateToken");
const Room = require("../models/Room");
const User = require("../models/User");
const { Op, where } = require("sequelize");
const Major = require("../models/Major");
const router = express.Router();
const sendPushNotifications = require("../utils/sendPushNotifications");
const Role = require("../models/Role");
const { getReceiverSocketId, io } = require("../sockets/sockets");
router.post("/send", checkRole(["KTX", "SCH"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const { description, content, file, type, notificationTo } = req.body;
    const newNotification = await Notification.create({
      description,
      content,
      file,
      type,
      UserId: userId,
    });
    // Fetch the newly created notification with associated user and role
    const notificationWithUser = await Notification.findByPk(
      newNotification.id,
      {
        include: [
          {
            model: User,
            attributes: ["id", "firstName", "lastName", "avatar"],
            include: {
              model: Role,
              attributes: ["roleName"],
            },
          },
        ],
      }
    );
    // Format the response as desired
    const formattedNotification = {
      isSeen: false,
      Notification: {
        id: notificationWithUser.id,
        description: notificationWithUser.description,
        content: notificationWithUser.content,
        file: notificationWithUser.file,
        type: notificationWithUser.type,
        createdAt: notificationWithUser.createdAt,
        updatedAt: notificationWithUser.updatedAt,
        UserId: notificationWithUser.UserId,
        User: {
          id: notificationWithUser.User.id,
          firstName: notificationWithUser.User.firstName,
          lastName: notificationWithUser.User.lastName,
          avatar: notificationWithUser.User.avatar,
          Role: {
            roleName: notificationWithUser.User.Role.roleName,
          },
        },
      },
    };

    let AllIds;
    let tokenIds;

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
        attributes: ["expo_push_token", "id"],
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
        attributes: ["expo_push_token", "id"],
        where: { MajorId: { [Op.in]: AllIds.map((major) => major.id) } },
      });
      if (tokenIds.length === 0) {
        return res
          .status(404)
          .json({ error: "No users found for the given majorIds" });
      }
    }

    const notificationsToStore = tokenIds.map((user) => {
      if (user.expo_push_token) {
        return {
          expo_push_token: user.expo_push_token,
          sent_at: new Date(),
          NotificationId: newNotification.id,
        };
      }
      return null;
    });

    // Emit Socket.IO events to specific clients (users)
    tokenIds.forEach((user) => {
      const receiverSocketId = getReceiverSocketId(user.id);
      if (receiverSocketId) {
        // Emit event only if socket ID is available
        io.to(receiverSocketId).emit("newNotification", formattedNotification);
      } else {
        console.log(
          `Socket ID not found for user ${user.id}. Skipping notification.`
        );
      }
    });
    await ExpoNotifications.bulkCreate(notificationsToStore);
    // Step 3: Send push notifications
    await sendPushNotifications(
      tokenIds.map((user) => user.expo_push_token),
      description,
      content
    );
    res.status(201).json(formattedNotification);
  } catch (error) {
    console.error("Error sending notification:", error);
    res
      .status(500)
      .json({ error: "An error occurred while sending the notification" });
  }
});

router.get("/all", checkRole(["STUDENT"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const allNotificationsForUser = await ExpoNotifications.findAll({
      where: { expo_push_token: user.expo_push_token },
      attributes: ["isSeen"],
      include: {
        model: Notification,
        include: {
          model: User,
          attributes: ["id", "firstName", "lastName", "avatar"],
          include: {
            model: Role,
            attributes: ["roleName"],
          },
        },
      },
    });
    res.status(200).json(allNotificationsForUser);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/detail/:notificationId", async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    const notification = await Notification.findOne({
      where: { id: notificationId },
      include: { model: User, attributes: ["firstName", "lastName"] },
    });

    res.status(200).json(notification);
  } catch (error) {}
});

router.put(
  "/user-seen-notification/:notificationId",
  checkRole(["STUDENT"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.notificationId;
      const user = await User.findOne({
        where: { id: userId },
        attributes: ["id", "expo_push_token"],
      });
      await ExpoNotifications.update(
        { isSeen: true },
        {
          where: {
            [Op.and]: [
              { expo_push_token: user.expo_push_token },
              { NotificationId: notificationId },
            ],
          },
        }
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Error marking notifications as seen:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
module.exports = router;
