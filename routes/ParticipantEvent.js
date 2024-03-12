const express = require("express");
const ParticipantEvent = require("../models/ParticipantEvent");
const { Op } = require("sequelize");
const Room = require("../models/Room");
const Dormitory = require("../models/Dormitory");
const User = require("../models/User");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const { date, typePayMoney, payMoney, userId, eventId } = req.body;
    const newParticipantEvent = await ParticipantEvent.create({
      date,
      typePayMoney,
      payMoney,
      UserId: userId,
      EventId: eventId,
    });
    res.status(201).json(newParticipantEvent);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/all/:eventId", async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { year } = req.query;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const participants = await ParticipantEvent.findAll({
      where: {
        EventId: eventId,
        date: {
          [Op.between]: [startDate, endDate],
        },
      },
      include: [
        {
          model: User,
          include: [
            {
              model: Room,
              include: {
                model: Dormitory,
                attributes: {
                  exclude: ["dormLocation", "dormDescription", "dormImage"],
                },
              },
              attributes: {
                exclude: [
                  "numberOfStudents",
                  "temporaryResidencePeriod",
                  "meansOfTransportation",
                  "medicalInsurance",
                ],
              },
            },
          ],
          attributes: { exclude: ["password"] },
        },
      ],
    });
    if (participants.length === 0) {
      return res.status(404).json({
        error: "No participants events found for the given year and event.",
      });
    }
    res.status(200).json(participants);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
