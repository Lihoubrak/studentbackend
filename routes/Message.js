const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { Op, json } = require("sequelize");
const sequelize = require("../models/ConnectionDB");
const { checkRole } = require("../middleware/authenticateToken");
const Conversation = require("../models/Conversation");
const { getReceiverSocketId, io } = require("../sockets/sockets");
const sendPushNotifications = require("../utils/sendPushNotifications");
const router = express.Router();
// Route to create a new message
router.post(
  "/create",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    const { content, file, image, video, sticker, receiverId } = req.body;
    const senderId = req.user.id;
    try {
      const newMessage = await Message.create({
        file,
        image,
        video,
        sticker,
        content,
        sender_id: senderId,
        receiver_id: receiverId,
      });
      // SOCKET IO FUNCTIONALITY WILL GO HERE
      const receiverSocketId = getReceiverSocketId(receiverId);
      if (receiverSocketId) {
        // io.to(<socket_id>).emit() used to send events to specific client
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
      const findReceiver = await User.findAll({
        where: { id: receiverId },
        attributes: ["expo_push_token"],
      });
      await sendPushNotifications(
        findReceiver.map((user) => user.expo_push_token),
        (description = "lihou"),
        content
      );
      res.status(201).json(newMessage);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);
// Route to fetch all messages between two specific users
router.get(
  "/all/:receiverId",
  checkRole(["STUDENT", "SCH", "KTX"]),
  async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user.id;
    try {
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            {
              sender_id: receiverId,
              receiver_id: senderId,
            },
            {
              sender_id: senderId,
              receiver_id: receiverId,
            },
          ],
        },
      });
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);
router.get(
  "/users-with-conversations",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    const userId = req.user.id;
    try {
      // Find all messages sent or received by the user
      const userMessages = await Message.findAll({
        where: {
          [Op.or]: [{ sender_id: userId }, { receiver_id: userId }],
        },
        attributes: [
          "sender_id",
          "receiver_id",
          "createdAt",
          "content",
          "status",
        ],
        order: [["createdAt", "DESC"]],
      });

      // Create a set to store unique user IDs involved in conversations with the user
      const uniqueUserIds = new Set();

      // Loop through userMessages to collect unique user IDs
      userMessages.forEach((message) => {
        if (message.sender_id !== userId) {
          uniqueUserIds.add(message.sender_id);
        }
        if (message.receiver_id !== userId) {
          uniqueUserIds.add(message.receiver_id);
        }
      });

      // Fetch users corresponding to the unique user IDs
      const usersWithConversations = await User.findAll({
        where: { id: [...uniqueUserIds] },
        attributes: ["id", "firstName", "lastName", "avatar"],
      });

      // Enhance each user with the last message content and time
      const usersWithLastMessage = usersWithConversations.map((user) => {
        const lastMessage = userMessages.find(
          (message) =>
            (message.receiver_id === user.id && message.sender_id === userId) ||
            (message.sender_id === user.id && message.receiver_id === userId)
        );
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          lastMessage: lastMessage ? lastMessage.content : null,
          sendDate: lastMessage ? lastMessage.createdAt : null,
          status: lastMessage ? lastMessage.status : null,
        };
      });
      // Emit real-time event to the client with the list of users
      const receiverSocketId = getReceiverSocketId(userId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit(
          "usersWithConversations",
          usersWithLastMessage
        );
      }
      res.status(200).json(usersWithLastMessage);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.put(
  "/update-status-seen/:receiverId",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    try {
      const receiverId = req.params.receiverId;

      // Update messages for the specified receiver as 'seen'
      await Message.update(
        { status: "seen" },
        {
          where: {
            receiver_id: receiverId,
            status: "pending",
          },
        }
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Error updating message status:", error);
      res.sendStatus(500);
    }
  }
);

module.exports = router;
