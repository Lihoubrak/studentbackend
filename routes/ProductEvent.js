const express = require("express");
const ProductEvent = require("../models/ProductEvent");
const router = express.Router();
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
    if (!productName || !productQuantity || !productPriceUnit || !dateBuy) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newProductEvent = await ProductEvent.create({
      productName,
      productQuantity,
      productPriceUnit,
      dateBuy,
      note,
      EventId: eventId,
    });

    res.status(201).json(newProductEvent);
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
