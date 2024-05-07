const express = require("express");
const { checkRole } = require("../middleware/authenticateToken");
const router = express.Router();
const admin = require("firebase-admin");
const { firestore } = require("../firebase/firebase");
const sendPushNotifications = require("../utils/sendPushNotifications");
router.post("/send", checkRole(["KTX", "SCH"]), async (req, res) => {
  try {
    const { description, content, type, notificationTo } = req.body;
    const userId = req.user.id;
    const sentAt = admin.firestore.FieldValue.serverTimestamp();

    // Create a new notification document in Firestore
    const newNotificationRef = await firestore.collection("notifications").add({
      description,
      content,
      type,
      sentBy: userId,
      sentAt,
      recipients: [], // Initialize recipients array
    });

    let userSnapshot;

    if (type === "Dorms") {
      const roomSnapshot = await firestore
        .collection("rooms")
        .where("DormitoryId", "==", notificationTo)
        .get();
      const roomIds = roomSnapshot.docs.map((doc) => doc.id);
      userSnapshot = await firestore
        .collection("users")
        .where("RoomId", "in", roomIds)
        .get();
    } else if (type === "Univ") {
      const majorSnapshot = await firestore
        .collection("majors")
        .where("SchoolId", "==", notificationTo)
        .get();
      const majorIds = majorSnapshot.docs.map((doc) => doc.id);
      userSnapshot = await firestore
        .collection("users")
        .where("MajorId", "in", majorIds)
        .get();
    }

    // Construct an array of recipient objects containing user references and isSeen field
    const recipientsData = userSnapshot.docs.map((doc) => ({
      userId: doc.id,
      isSeen: false,
    }));

    // Update recipients array in the notification document with recipient objects
    await newNotificationRef.update({
      recipients: recipientsData,
    });

    // Send push notifications
    const tokens = userSnapshot.docs.map((doc) => doc.data().expo_push_token);
    await sendPushNotifications(
      tokens.filter(Boolean),
      description,
      content,
      newNotificationRef.id,
      "notification"
    );
    res.status(201).json({ message: "Notification sent successfully" });
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
    // Get all notifications
    const userNotificationsSnapshot = await firestore
      .collection("notifications")
      .get();

    // Filter notifications where the userRef exists in recipients array
    const userNotifications = [];
    userNotificationsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Check if the userId matches any recipient's userId
      if (data.recipients.some((recipient) => recipient.userId === userId)) {
        userNotifications.push({
          id: doc.id,
          data: data,
        });
      }
    });

    res.status(200).json(userNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/detail/:notificationId",
  checkRole(["STUDENT", "Admin", "SCH", "KTX"]),
  async (req, res) => {
    try {
      const notificationId = req.params.notificationId;
      const userId = req.user.id;
      // Reference the notification document in Firestore
      const notificationRef = firestore
        .collection("notifications")
        .doc(notificationId);

      // Get the notification document
      const doc = await notificationRef.get();

      // Check if the document exists
      if (!doc.exists) {
        res.status(404).json({ error: "Notification not found" });
        return;
      }

      // Extract notification data
      const notificationData = doc.data();

      // Find the recipient with the current user's ID
      const recipientIndex = notificationData.recipients.findIndex(
        (recipient) => recipient.userId === userId
      );

      // Check if the recipient exists in the recipients array
      if (recipientIndex === -1) {
        res
          .status(404)
          .json({ error: "You are not a recipient of this notification" });
        return;
      }

      // Update the isSeen flag for the recipient
      notificationData.recipients[recipientIndex].isSeen = true;

      // Update the notification document in Firestore with the modified data
      await notificationRef.update({ recipients: notificationData.recipients });

      // Return the updated notification details
      res.status(200).json({
        id: doc.id,
        data: notificationData,
      });
    } catch (error) {
      console.error("Error fetching notification:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
router.get("/number-notification", checkRole("STUDENT"), async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all notifications where the userRef matches any recipient's userRef and isSeen is false
    const userNotificationsSnapshot = await firestore
      .collection("notifications")
      .where("recipients", "array-contains", { userId, isSeen: false })
      .get();

    // Get the count of notifications
    const count = userNotificationsSnapshot.size;

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching number of notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
module.exports = router;
