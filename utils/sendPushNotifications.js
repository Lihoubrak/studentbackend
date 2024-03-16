const { Expo } = require("expo-server-sdk");

const sendPushNotifications = async (tokenIds, title, content) => {
  // Create a new Expo SDK client
  const expo = new Expo();

  // Prepare the messages to be sent
  const messages = tokenIds.map((tokenId) => ({
    to: tokenId,
    sound: "default",
    title: title + " 📬",
    body: content,
    data: { url: "dfdsf" },
  }));
  // Chunk the messages if necessary (Expo recommends sending in chunks of 100)
  const chunks = expo.chunkPushNotifications(messages);

  // Iterate over the chunks and send each chunk
  for (const chunk of chunks) {
    try {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log(ticketChunk);
    } catch (error) {
      console.error(error);
    }
  }
};

module.exports = sendPushNotifications;
