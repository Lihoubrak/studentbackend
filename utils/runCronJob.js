const { firestore } = require("../firebase/firebase");
const sendPushNotifications = require("./sendPushNotifications");

const runCronJob = async () => {
  try {
    const twoMonthsBeforeNow = new Date();
    twoMonthsBeforeNow.setMonth(twoMonthsBeforeNow.getMonth() - 2);

    const passportsSnapshot = await firestore.collection("passports").get();

    const promises = passportsSnapshot.docs.map(async (doc) => {
      const passportData = doc.data();
      const visaUntilDate = passportData.visa.untilDate.toDate();
      // Check if visaUntilDate is within the next two months
      if (visaUntilDate < twoMonthsBeforeNow) {
        const userId = passportData.UserId;
        // Get user's Expo push token
        const userSnapshot = await firestore
          .collection("users")
          .doc(userId)
          .get();
        const userDoc = userSnapshot.data();
        const expoPushToken = userDoc.expo_push_token;

        // Ensure expoPushToken is truthy before sending push notification
        if (expoPushToken) {
          // Send push notification
          const description = "Visa Expiring Soon";
          const content = "Your visa is expiring soon. Please renew it.";
          await sendPushNotifications(
            [expoPushToken],
            description,
            content,
            null,
            "tabBottomBar"
          );
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error in cron job:", error);
  }
};

module.exports = runCronJob;
