const express = require("express");
const cors = require("cors");
const path = require("path");
const port = 3000;
const userRouter = require("./routes/User");
const dormRouter = require("./routes/Dormitory");
const roomRouter = require("./routes/Room");
const schoolRouter = require("./routes/School");
const majorlRouter = require("./routes/Major");
const passportRouter = require("./routes/Passport");
const electricalRouter = require("./routes/Electrical");
const waterRouter = require("./routes/Water");
const eventRouter = require("./routes/Event");
const productEventRouter = require("./routes/ProductEvent");
const participantEventRouter = require("./routes/ParticipantEvent");
// const heathcareRouter = require("./routes/Healthcare");
// const contributionHealthcareRouter = require("./routes/ContributionHealthcare");
const supportEventRouter = require("./routes/SupportEvent");
const notificationsRouter = require("./routes/Notification");
const messageRouter = require("./routes/Message");
const ticketEventRouter = require("./routes/TicketEvent");
const sportRouter = require("./routes/Sport");
const teamsportsRouter = require("./routes/TeamSport");
const sportplayersRouter = require("./routes/SportPlayer");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public/images")));
app.use("/users/v1", userRouter);
app.use("/dorms/v2", dormRouter);
app.use("/rooms/v3", roomRouter);
app.use("/schools/v4", schoolRouter);
app.use("/majors/v5", majorlRouter);
app.use("/passports/v6", passportRouter);
app.use("/electricals/v7", electricalRouter);
app.use("/waters/v8", waterRouter);
app.use("/events/v9", eventRouter);
app.use("/productevents/v10", productEventRouter);
app.use("/participantevents/v11", participantEventRouter);
// app.use("/heathcares/v12", heathcareRouter);
// app.use("/contributionhealthcares/v13", contributionHealthcareRouter);
app.use("/supportevents/v14", supportEventRouter);
app.use("/notifications/v15", notificationsRouter);
app.use("/messages/v16", messageRouter);
app.use("/ticketevents/v17", ticketEventRouter);
app.use("/sports/v18", sportRouter);
app.use("/teamsports/v19", teamsportsRouter);
app.use("/sportplayers/v20", sportplayersRouter);
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
