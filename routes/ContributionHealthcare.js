const express = require("express");
const ContributionHealthcare = require("../models/ContributionHealthcare");
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
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
