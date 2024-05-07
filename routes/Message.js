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
    const { content, receiverId } = req.body;
    const senderId = req.user.id;
    const receiverRef = await firestore.collection("users").doc(receiverId);
    try {
      // Check if a conversation between the sender and receiver already exists
      const conversationsSnapshot = await firestore
        .collection("conversations")
        .where("participants", "array-contains", senderId)
        .get();

      let conversationRef;
      let conversationId;

      // Find an existing conversation where both users are participants
      conversationsSnapshot.forEach((conversationDoc) => {
        const participants = conversationDoc.data().participants;

        // Check if receiverRef is included in the participants' references
        const receiverIsParticipant = participants.some((participant) => {
          return participant === receiverId;
        });

        if (receiverIsParticipant) {
          // If receiver is a participant, set conversationRef to the current conversation
          conversationRef = conversationDoc.ref;
          conversationId = conversationDoc.id;
        }
      });

      if (conversationRef) {
        // If conversation exists, send the message to the existing conversation
        const messageRef = await firestore.collection("messages").add({
          content,
          SenderId: senderId,
          ReceiverId: receiverId,
          ConversationId: conversationId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          seenBySender: true,
          seenByReceiver: false,
        });

        // Update the lastMessage and lastMessageTime fields in the conversation
        await conversationRef.update({
          lastMessage: content,
          lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Get receiver's tokenIds for push notification
        const receiverSnapshot = await receiverRef.get();
        const receiverData = receiverSnapshot.data();
        const expo_push_token = receiverData.expo_push_token || [];
        // Send push notifications to receiver
        await sendPushNotifications(
          [expo_push_token],
          "New Chat Message",
          "You have received a new chat message",
          receiverSnapshot.id,
          "chat"
        );

        res.status(201).json({
          message: "Message sent successfully",
          messageId: messageRef.id,
          conversationId: conversationRef,
        });
      } else {
        // If conversation doesn't exist, create a new conversation
        const newConversationRef = await firestore
          .collection("conversations")
          .add({
            participants: [senderId, receiverId],
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            lastMessage: content,
            lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
          });

        // Send the message to the new conversation
        const messageRef = await firestore.collection("messages").add({
          content,
          SenderId: senderId,
          ReceiverId: receiverId,
          ConversationId: newConversationRef.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          seenBySender: true,
          seenByReceiver: false,
        });
        // Get receiver's tokenIds for push notification
        const receiverSnapshot = await receiverRef.get();
        const receiverData = receiverSnapshot.data();
        const expo_push_token = receiverData.expo_push_token || [];

        // Send push notifications to receiver
        await sendPushNotifications(
          [expo_push_token],
          "New Chat Message",
          "You have received a new chat message",
          receiverSnapshot.id,
          "chat"
        );

        res.status(201).json({
          message: "Message sent successfully",
          messageId: messageRef.id,
          conversationId: newConversationRef.id,
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
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

router.get(
  "/users-with-conversations",
  checkRole(["Admin", "STUDENT", "SCH", "KTX"]),
  async (req, res) => {
    try {
      const usersWithConversations = [];

      const conversationsSnapshot = await firestore
        .collection("conversations")
        .get();
      const userIds = new Set();

      conversationsSnapshot.forEach((conversationDoc) => {
        const conversationData = conversationDoc.data();
        conversationData.participants.forEach((participantRef) => {
          userIds.add(participantRef.id);
        });
      });

      const promises = Array.from(userIds).map(async (userId) => {
        if (userId !== req.user.id) {
          const userDataSnapshot = await firestore
            .collection("users")
            .doc(userId)
            .get();
          const userData = userDataSnapshot.data();

          const userConversationsSnapshot = await firestore
            .collection("conversations")
            .where(
              "participants",
              "array-contains",
              firestore.doc(`users/${userId}`)
            )
            .get();

          const conversations = [];

          for (const conversationDoc of userConversationsSnapshot.docs) {
            const conversationData = conversationDoc.data();
            const conversationId = conversationDoc.id;

            const lastMessageSnapshot = await firestore
              .collection("messages")
              .where(
                "ConversationId",
                "==",
                firestore.doc(`conversations/${conversationId}`)
              )
              .orderBy("createdAt", "desc")
              .limit(1)
              .get();

            let hasSeenMessage = false;
            lastMessageSnapshot.forEach((messageDoc) => {
              const messageData = messageDoc.data();
              if (
                messageData.ReceiverId.id === userId &&
                messageData.seenByReceiver
              ) {
                hasSeenMessage = true;
              }
            });

            conversations.push({
              id: conversationId,
              participants: conversationData.participants,
              createdAt: conversationData.createdAt,
              lastMessage: conversationData.lastMessage,
              lastMessageTime: conversationData.lastMessageTime,
              hasSeenMessage: hasSeenMessage,
            });
          }

          usersWithConversations.push({
            id: userId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatar: userData.avatar,
            conversations: conversations,
          });
        }
      });

      await Promise.all(promises);

      res.status(200).json(usersWithConversations);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.put(
  "/update-status-seen/:messageId",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    const { messageId } = req.params;
    const receiverId = req.user.id;
    try {
      const messageRef = firestore.collection("messages").doc(messageId);
      const messageSnapshot = await messageRef.get();

      // Check if the message exists
      if (!messageSnapshot.exists) {
        return res.status(404).json({ message: "Message not found" });
      }

      const messageData = messageSnapshot.data();

      // Check if the message belongs to the receiver
      if (messageData.ReceiverId !== receiverId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to update this message" });
      }

      // Update seen by receiver to true
      await messageRef.update({
        seenByReceiver: true,
      });

      res.status(200).json({ message: "Message seen by receiver" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.get("/number-message", checkRole(["STUDENT"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);
    const numberMessageNotYetSeen = await Message.count({
      where: {
        seen_by_user2: false,
        receiver_id: user.id,
      },
    });
    res.status(200).json({ count: numberMessageNotYetSeen });
  } catch (error) {
    console.error("Error fetching number of messages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
