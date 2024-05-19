const { Expo } = require("expo-server-sdk");
const { convert } = require("html-to-text");

const sendPushNotifications = async (
  tokenIds,
  title,
  content,
  notificationId,
  type
) => {
  // Create a new Expo SDK client
  const expo = new Expo();
  // Convert HTML content to plain text
  const plainTextContent = convert(content, {
    wordwrap: 130,
  });

  // Prepare the messages to be sent
  const messages = tokenIds.map((tokenId) => ({
    to: tokenId, // TokenId as a string (no need for array)
    sound: "default",
    title: title + " 📬",
    body: plainTextContent,
    data: {
      screen:
        type === "chat"
          ? "messagechat"
          : type === "passport"
          ? "passport"
          : type === "tabBottomBar"
          ? "tabBottomBar"
          : "notificationdetail",
      notificationId: notificationId,
    },
  }));

  // Chunk the messages if necessary (Expo recommends sending in chunks of 100)
  const chunks = expo.chunkPushNotifications(messages);
  // Iterate over the chunks and send each chunk
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error(error);
    }
  }
};

module.exports = sendPushNotifications;
