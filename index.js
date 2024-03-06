const express = require("express");
const sequelize = require("./models/ConnectionDB");
const app = express();
const cors = require("cors");
const Relationship = require("./models/Relationship");
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
const heathcareRouter = require("./routes/ParticipantEvent");
const contributionHealthcareRouter = require("./routes/ContributionHealthcare");
const supportEventRouter = require("./routes/SupportEvent");
app.use(cors());
app.use(express.json());
Relationship();
sequelize
  .sync()
  .then(() => {
    console.log("You was table created!");
  })
  .catch((err) => {
    console.error("Unable to create  table:", err);
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
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
