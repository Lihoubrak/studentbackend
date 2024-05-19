const express = require("express");
const { checkRole } = require("../middleware/authenticateToken");
const { firestore } = require("../firebase/firebase");
const router = express.Router();
const admin = require("firebase-admin");
const sendPushNotifications = require("../utils/sendPushNotifications");
// Route to create a new message
router.post(
  "/create",
  checkRole(["KTX", "SCH", "STUDENT", "Admin"]),
  async (req, res) => {
    try {
      const { receiverId, content } = req.body;
      const senderId = req.user.id;
      if (!senderId || !receiverId || !content) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const messageRef = await firestore.collection("messages").add({
        senderId,
        receiverId,
        content,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        seenBy: {
          [senderId]: true,
          [receiverId]: false, // Initially, the message is not seen by the receiver
        },
      });
      const userSnapshot = await firestore
        .collection("users")
        .doc(receiverId)
        .get();
      if (userSnapshot.exists) {
        const userData = userSnapshot.data();
        if (userData && userData.expo_push_token) {
          await sendPushNotifications(
            [userData.expo_push_token],
            "New Message",
            content,
            receiverId,
            "chat"
          );
        }
      }
      res.status(201).json({
        message: "Message sent successfully",
        messageId: messageRef.id,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);
// Route to get the list of users the current user has chatted with, along with the last message
router.get(
  "/last-message-users",
  checkRole(["KTX", "SCH", "STUDENT", "Admin"]),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Truy vấn để lấy tất cả các tin nhắn mà người dùng hiện tại là người gửi hoặc người nhận
      const sentMessagesSnapshot = await firestore
        .collection("messages")
        .where("senderId", "==", userId)
        .orderBy("timestamp", "desc")
        .get();

      const receivedMessagesSnapshot = await firestore
        .collection("messages")
        .where("receiverId", "==", userId)
        .orderBy("timestamp", "desc")
        .get();

      const lastMessages = {};

      // Lặp qua các tin nhắn đã gửi để lấy tin nhắn cuối cùng cho mỗi người nhận
      sentMessagesSnapshot.forEach((doc) => {
        const message = doc.data();
        const receiverId = message.receiverId;

        if (!lastMessages[receiverId]) {
          lastMessages[receiverId] = message;
        }
      });

      // Lặp qua các tin nhắn đã nhận để lấy tin nhắn cuối cùng từ mỗi người gửi
      receivedMessagesSnapshot.forEach((doc) => {
        const message = doc.data();
        const senderId = message.senderId;

        if (!lastMessages[senderId]) {
          lastMessages[senderId] = message;
        }
      });

      // Chuyển đổi đối tượng lastMessages thành một mảng
      const lastMessagesArray = Object.values(lastMessages);

      res.json(lastMessagesArray);
    } catch (error) {
      console.error("Error fetching last messages:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// Route to get all messages between two users
router.get(
  "/message-between-users/:userId2",
  checkRole(["KTX", "SCH", "STUDENT", "Admin"]),
  async (req, res) => {
    try {
      const { userId2 } = req.params;
      const userId1 = req.user.id;

      // Fetch messages between the two users
      const messagesSnapshot = await firestore
        .collection("messages")
        .where("senderId", "in", [userId1, userId2])
        .where("receiverId", "in", [userId1, userId2])
        .orderBy("timestamp", "asc")
        .get();

      const messages = [];
      messagesSnapshot.forEach((doc) => {
        messages.push(doc.data());
      });

      // Update seen status of messages sent to the current user by userId2
      await firestore
        .collection("messages")
        .where("senderId", "==", userId2)
        .where("receiverId", "==", userId1)
        .get()
        .then((querySnapshot) => {
          const batch = firestore.batch();

          querySnapshot.forEach((doc) => {
            const messageRef = firestore.collection("messages").doc(doc.id);
            const seenBy = doc.data().seenBy || {};
            seenBy[userId1] = true;
            batch.update(messageRef, { seenBy });
          });

          return batch.commit();
        });

      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

// Route to update seen status of messages sent to the current user by a specific sender
router.put(
  "/seen-from/:senderId",
  checkRole(["KTX", "SCH", "STUDENT", "Admin"]),
  async (req, res) => {
    try {
      const { senderId } = req.params;
      const receiverId = req.user.id;

      const messagesSnapshot = await firestore
        .collection("messages")
        .where("senderId", "==", senderId)
        .where("receiverId", "==", receiverId)
        .get();

      const batch = firestore.batch();

      for (const doc of messagesSnapshot.docs) {
        const messageRef = firestore.collection("messages").doc(doc.id);
        const seenBy = doc.data().seenBy || {};

        seenBy[receiverId] = true;
        batch.update(messageRef, { seenBy });
      }

      await batch.commit();

      res.json({ message: "Messages marked as seen" });
    } catch (error) {
      console.error("Error marking messages as seen:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  }
);

// router.get(
//   "/all/:receiverId",
//   checkRole(["KTX", "SCH", "STUDENT", "Admin"]),
//   async (req, res) => {
//     const { receiverId } = req.params;
//     const senderId = req.user.id;

//     try {
//       // Query conversations where senderId is a participant
//       const senderConversations = await firestore
//         .collection("conversations")
//         .where(
//           "participants",
//           "array-contains",
//           firestore.collection("users").doc(senderId)
//         )
//         .get();

//       // Filter conversations to find the one involving receiverId
//       const conversationSnapshot = senderConversations.docs.find(
//         (conversation) => {
//           const participants = conversation.data().participants;
//           const senderIncluded = participants.some(
//             (participant) => participant.id === senderId
//           );
//           const receiverIncluded = participants.some(
//             (participant) => participant.id === receiverId
//           );
//           return senderIncluded && receiverIncluded;
//         }
//       );

//       if (!conversationSnapshot) {
//         // No conversation found, return an empty response
//         return res.status(200).json({ messages: [], receiver: null });
//       }

//       // Conversation found, retrieve messages
//       const conversationId = conversationSnapshot.ref;
//       const messagesSnapshot = await firestore
//         .collection("messages")
//         .where("ConversationId", "==", conversationId)
//         .orderBy("createdAt", "desc")
//         .get();

//       const messages = [];
//       const receiverSnapshot = await firestore
//         .collection("users")
//         .doc(receiverId)
//         .get();
//       const receiverData = receiverSnapshot.data();

//       // Update seenByReceiver status for each message
//       for (const doc of messagesSnapshot.docs) {
//         const messageData = doc.data();
//         const seenByReceiver =
//           messageData.ReceiverId.id === receiverId
//             ? messageData.seenByReceiver
//             : true; // Assume sender always sees their own messages

//         // Update seenByReceiver status in Firestore
//         if (!seenByReceiver && messageData.ReceiverId.id === receiverId) {
//           await doc.ref.update({ seenByReceiver: true });
//         }

//         messages.push({
//           id: doc.id,
//           content: messageData.content,
//           SenderId: messageData.SenderId,
//           ReceiverId: messageData.ReceiverId,
//           ConversationId: messageData.ConversationId,
//           createdAt: messageData.createdAt,
//           seenBySender: messageData.seenBySender,
//           seenByReceiver: seenByReceiver,
//         });
//       }

//       res.status(200).json({
//         messages: messages,
//         receiver: {
//           id: receiverSnapshot.id,
//           firstName: receiverData.firstName,
//           lastName: receiverData.lastName,
//           avatar: receiverData.avatar,
//         },
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Server Error" });
//     }
//   }
// );
router.get(
  "/receiver/:receiverId",
  checkRole(["KTX", "SCH", "STUDENT", "Admin"]),
  async (req, res) => {
    const { receiverId } = req.params;

    try {
      const receiverSnapshot = await firestore
        .collection("users")
        .doc(receiverId)
        .get();
      if (!receiverSnapshot.exists) {
        return res.status(404).json({ message: "Receiver not found" });
      }

      const receiverData = receiverSnapshot.data();
      const receiver = {
        id: receiverSnapshot.id,
        firstName: receiverData.firstName,
        lastName: receiverData.lastName,
        avatar: receiverData.avatar,
        // Add any other fields you need
      };

      res.status(200).json({ receiver });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;
