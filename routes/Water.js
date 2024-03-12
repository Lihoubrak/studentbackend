const express = require("express");
const Water = require("../models/Water");
const { Sequelize, Op } = require("sequelize");
const Room = require("../models/Room");
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
    const oldRecord = await Water.findOne({
      where: {
        date: {
          [Sequelize.Op.lt]: date, // Get records before the current date
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

    let exceedLimit = 0;
    let amountToPay = 0;

    // Check if consumption exceeds support
    if (consumption > support) {
      exceedLimit = consumption - support; // Assuming support is subtracted from consumption

      // Calculate the total amount to pay for water
      amountToPay = exceedLimit * pricePerKwh;
    }

    // Create a new water record
    const newWaterRecord = await Water.create({
      oldIndex,
      newIndex,
      exceedLimit,
      totalConsumption: consumption,
      pricePerKwh,
      totalAmount: amountToPay,
      support: support,
      date,
      RoomId: roomId,
    });

    res.status(201).json(newWaterRecord);
  } catch (error) {
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
    const allWaterWithMonthYear = await Water.findAll({
      where: {
        date: {
          [Op.between]: [startDate, endDate],
        },
        RoomId: { [Op.in]: roomIds },
      },
      include: { model: Room },
    });
    if (allWaterWithMonthYear.length === 0) {
      return res.status(404).json({
        error: "No water data available for the specified month and year",
      });
    }
    res.status(200).json(allWaterWithMonthYear);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
