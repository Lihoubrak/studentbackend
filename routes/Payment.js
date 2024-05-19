const express = require("express");
const stripe = require("stripe")(process.env.SECRET_KEY_STRIPE);
const router = express.Router();
const dotenv = require("dotenv");
const { firestore } = require("../firebase/firebase");
const { checkRole } = require("../middleware/authenticateToken");

// Load environment variables from .env file
dotenv.config();

router.post(
  "/intents",
  checkRole(["STUDENT", "KTX", "SCH", "Admin"]),
  async (req, res) => {
    try {
      const { eventId } = req.body;
      const eventDoc = await firestore.collection("events").doc(eventId).get();

      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      const event = eventDoc.data();
      const amount = event.paymentPerStudent;
      const currency = "vnd";
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.post(
  "/intentsforhealth",
  checkRole(["STUDENT", "KTX", "SCH", "Admin"]),
  async (req, res) => {
    try {
      const { amount } = req.body;
      const currency = "vnd";
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency,
        automatic_payment_methods: { enabled: true },
      });
      res.json({ paymentIntent: paymentIntent.client_secret });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
module.exports = router;
