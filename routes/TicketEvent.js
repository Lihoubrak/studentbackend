const express = require("express");
const { firestore } = require("../firebase/firebase");
const { checkRole } = require("../middleware/authenticateToken");

const router = express.Router();
const admin = require("firebase-admin");
router.post(
  "/create",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    try {
      const {
        date = new Date().toISOString().split("T")[0],
        typePayMoney = "Card",
        numberOfTicket,
        userId,
        eventId,
      } = req.body;
      // Get event reference
      const eventRef = firestore.collection("events").doc(eventId);

      // Get event data
      const eventDoc = await eventRef.get();
      const eventData = eventDoc.data();

      // Check if the event exists
      if (!eventDoc.exists) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check available tickets
      const availableTickets = eventData.numberOfTicket;
      if (availableTickets < numberOfTicket) {
        return res.status(400).json({ error: "Not enough tickets available." });
      }

      // Extract price from event data
      const price = eventData.ticketPrice;

      // Calculate payment amount
      const payMoney = parseInt(price) * parseInt(numberOfTicket);

      // Update the number of tickets available in the event
      const updatedTickets = availableTickets - numberOfTicket;
      await eventRef.update({ numberOfTicket: updatedTickets });

      // Create a new ticket event
      const newTicketEvent = await firestore.collection("ticketEvents").add({
        date,
        typePayMoney,
        payMoney,
        numberOfTicket,
        price,
        UserId: userId,
        EventId: eventId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(date),
      });

      // Retrieve the newly created document and send it in the response
      const newTicketEventDoc = await newTicketEvent.get();
      const newTicket = {
        id: newTicketEventDoc.id,
        ...newTicketEventDoc.data(),
      };

      res.status(201).json(newTicket);
    } catch (error) {
      console.error("Error creating ticket event:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);
router.delete("/delete/:ticketId", async (req, res) => {
  try {
    const ticketId = req.params.ticketId;

    // Get ticket reference
    const ticketRef = firestore.collection("ticketEvents").doc(ticketId);

    // Check if the ticket exists
    const ticketDoc = await ticketRef.get();
    if (!ticketDoc.exists) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Delete the ticket
    await ticketRef.delete();

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
