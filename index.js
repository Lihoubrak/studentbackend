const express = require("express");
const sequelize = require("./models/ConnectionDB");
const app = express();
const cors = require("cors");
const Relationship = require("./models/Relationship");
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
const heathcareRouter = require("./routes/Healthcare");
const contributionHealthcareRouter = require("./routes/ContributionHealthcare");
const supportEventRouter = require("./routes/SupportEvent");
const notificationsRouter = require("./routes/Notification");
const Dormitory = require("./models/Dormitory");
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public/images")));
Relationship();
sequelize
  .sync()
  .then(() => {
    console.log("Your table was created!");
  })
  .catch((err) => {
    console.error("Unable to create table:", err);
  });
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
app.use("/heathcares/v12", heathcareRouter);
app.use("/contributionhealthcares/v13", contributionHealthcareRouter);
app.use("/supportevents/v14", supportEventRouter);
app.use("/notifications/v15", notificationsRouter);
//Get All Dorm and University in Hanoi
app.use("/alldormuniversity", async (req, res, next) => {
  try {
    const alldorm = await Dormitory.findAll();
    res.status(200).json(alldorm);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
