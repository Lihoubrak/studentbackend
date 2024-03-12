const express = require("express");
const { Op } = require("sequelize");
const ProductEvent = require("../models/ProductEvent");
const router = express.Router();

// Route to create a new ProductEvent
router.post("/create", async (req, res) => {
  try {
    const {
      productName,
      productQuantity,
      productPriceUnit,
      dateBuy,
      note,
      eventId,
    } = req.body;
    console.log(req.body);
    if (!productName || !productQuantity || !productPriceUnit || !dateBuy) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const total = productPriceUnit * productQuantity;
    const newProductEvent = await ProductEvent.create({
      productName,
      productQuantity,
      productPriceUnit,
      dateBuy,
      note,
      total,
      EventId: eventId,
    });

    res.status(201).json(newProductEvent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});
router.get("/all/:eventId", async (req, res) => {
  try {
    const { year } = req.query;
    const eventId = req.params.eventId;
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    const productEvents = await ProductEvent.findAll({
      where: {
        EventId: eventId,
        dateBuy: {
          [Op.between]: [startDate, endDate],
        },
      },
    });
    if (productEvents.length === 0) {
      return res.status(404).json({
        error: "No product events found for the given year and event.",
      });
    }
    res.status(200).json(productEvents);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
