const express = require("express");
const Electrical = require("../models/Electrical");
const Room = require("../models/Room");
const { Op } = require("sequelize");
const { checkRole } = require("../middleware/authenticateToken");
const Dormitory = require("../models/Dormitory");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { newIndex, pricePerKwh, support, date, roomId } =
      req.body.formDataToSend;

    // Check if required fields are provided
    if (!newIndex || !pricePerKwh || !date || !roomId || !support) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Calculate the total consumption
    const oldRecord = await Electrical.findOne({
      where: {
        date: {
          [Op.lt]: date, // Get records before the current date
        },
        RoomId: roomId, // Assuming RoomId is the foreign key connecting to the Room table
      },
      order: [
        ["date", "DESC"], // Order by date in descending order to get the latest record before the current date
      ],
    });

    // If there's no old record found, set oldIndex to 0
    const oldIndex = oldRecord ? oldRecord.newIndex : 0;
    const consumption = newIndex - oldIndex;
    let totalAmount = 0;
    let exceedLimit = 0;

    if (consumption > support) {
      exceedLimit = consumption - support;
      totalAmount = exceedLimit * pricePerKwh;
    }

    // Create a new electrical record
    const newElectricalRecord = await Electrical.create({
      oldIndex,
      newIndex,
      exceedLimit,
      totalConsumption: consumption,
      pricePerKwh,
      totalAmount,
      support,
      date,
      RoomId: roomId,
    });

    res.status(201).json(newElectricalRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/all", checkRole("KTX"), async (req, res) => {
  try {
    const { year, month } = req.query;
    const userId = req.user.id;
    const startDate = new Date(year, month - 1, 1); // Note: month is zero-based in JavaScript Date object
    const endDate = new Date(year, month, 0); // Note: month is zero-based in JavaScript Date object
    const dormitories = await Dormitory.findAll({
      where: {
        UserId: userId,
      },
      include: [{ model: Room }],
    });
    const roomIds = dormitories.flatMap((dormitory) =>
      dormitory.Rooms.map((room) => room.id)
    );
    const allElectricalWithMonthYear = await Electrical.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
        RoomId: { [Op.in]: roomIds },
      },
      include: { model: Room },
    });
    if (allElectricalWithMonthYear.length === 0) {
      return res.status(404).json({
        error: "No electrical data available for the specified month and year",
      });
    }
    res.status(200).json(allElectricalWithMonthYear);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
