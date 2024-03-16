const express = require("express");
const Message = require("../models/Message");
const User = require("../models/User");
const { Op, json } = require("sequelize");
const sequelize = require("../models/ConnectionDB");
const { checkRole } = require("../middleware/authenticateToken");
const Conversation = require("../models/Conversation");
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
        include: [
          {
            model: User,
            as: "sender",
            attributes: ["id", "firstName", "lastName", "avatar"],
          },
          {
            model: User,
            as: "receiver",
            attributes: ["id", "firstName", "lastName", "avatar"],
          },
        ],
      });
      res.json(messages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.get(
  "/users-with-conversations/",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    const senderId = req.user.id;
    try {
      // Find all messages sent by the sender including time and status
      const senderMessages = await Message.findAll({
        where: { sender_id: senderId },
        attributes: ["receiver_id", "createdAt"],
      });

      // Extract receiver IDs from sender's messages
      const receiverIds = senderMessages.map((message) => message.receiver_id);

      // Find all users who have conversations with the sender
      const usersWithConversations = await User.findAll({
        where: { id: receiverIds },
        attributes: ["id", "firstName", "lastName", "avatar"],
      });
      res.status(200).json(usersWithConversations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
