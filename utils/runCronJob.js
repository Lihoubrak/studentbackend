const { firestore } = require("../firebase/firebase");
const sendPushNotifications = require("./sendPushNotifications");

// const runCronJob = async () => {
//   try {
//     const twoMonthsBeforeNow = new Date();
//     twoMonthsBeforeNow.setMonth(twoMonthsBeforeNow.getMonth() - 2);

//     const passportsSnapshot = await firestore.collection("passports").get();

//     const promises = passportsSnapshot.docs.map(async (doc) => {
//       const passportData = doc.data();
//       const visaUntilDate = passportData.visa.untilDate.toDate();
//       // Check if visaUntilDate is within the next two months
//       if (visaUntilDate < twoMonthsBeforeNow) {
//         const userId = passportData.UserId;
//         // Get user's Expo push token
//         const userSnapshot = await firestore
//           .collection("users")
//           .doc(userId)
//           .get();
//         const userDoc = userSnapshot.data();
//         const expoPushToken = userDoc.expo_push_token;

//         // Ensure expoPushToken is truthy before sending push notification
//         if (expoPushToken) {
//           // Send push notification
//           const description = "Visa Expiring Soon";
//           const content = "Your visa is expiring soon. Please renew it.";
//           await sendPushNotifications(
//             [expoPushToken],
//             description,
//             content,
//             null,
//             "tabBottomBar"
//           );
//         }
//       }
//     });

//     await Promise.all(promises);
//   } catch (error) {
//     console.error("Error in cron job:", error);
//   }
// };
const runCronJob = async () => {
  try {
    // Lấy ngày hiện tại
    const twoMonthsLater = new Date();
    twoMonthsLater.setMonth(twoMonthsLater.getMonth() + 2);

    const passportsSnapshot = await firestore.collection("passports").get();

    const promises = passportsSnapshot.docs.map(async (doc) => {
      const passportData = doc.data();
      const visaUntilDate = passportData.visa.untilDate.toDate();

      // Kiểm tra xem visaUntilDate có nằm trong vòng 2 tháng kể từ bây giờ không
      if (visaUntilDate <= twoMonthsLater && visaUntilDate >= new Date()) {
        const userId = passportData.UserId;

        // Lấy Expo push token của người dùng
        const userSnapshot = await firestore
          .collection("users")
          .doc(userId)
          .get();
        const userDoc = userSnapshot.data();
        const expoPushToken = userDoc.expo_push_token;
        // Đảm bảo rằng expoPushToken tồn tại trước khi gửi thông báo đẩy
        if (expoPushToken) {
          // Gửi thông báo đẩy
          const description = "Visa sắp hết hạn";

          const content = `Visa của bạn sắp hết hạn. Vui lòng gia hạn. ${userDoc.firstName} ${userDoc.lastName}`;
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
    console.error("Lỗi trong công việc cron:", error);
  }
};
module.exports = runCronJob;
