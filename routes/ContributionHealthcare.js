const express = require("express");
const { Op } = require("sequelize");
const ContributionHealthcare = require("../models/ContributionHealthcare");
const User = require("../models/User");
const Room = require("../models/Room");
const Dormitory = require("../models/Dormitory");

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { date, typePayMoney, payMoney, userId } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required." });
    }
    const newContribution = await ContributionHealthcare.create({
      date,
      typePayMoney,
      payMoney,
      UserId: userId,
    });
    res.status(201).json(newContribution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/all", async (req, res) => {
  try {
    const { month, year } = req.query;
    const parsedMonth = parseInt(month, 10);
    const parsedYear = parseInt(year, 10);

    if (isNaN(parsedMonth) || isNaN(parsedYear)) {
      return res.status(400).json({ error: "Invalid month or year." });
    }

    const startDate = new Date(parsedYear, parsedMonth - 1, 1);
    const endDate = new Date(parsedYear, parsedMonth, 0);

    const allContribution = await ContributionHealthcare.findAll({
      where: {
        createdAt: {
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

    if (allContribution.length === 0) {
      return res.status(404).json({
        error:
          "No contribution data available for the specified month and year",
      });
    }
    res.status(200).json(allContribution);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
