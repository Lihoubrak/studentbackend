const express = require("express");
const { firestore } = require("../firebase/firebase");
const { checkRole } = require("../middleware/authenticateToken");
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

    const total = productPriceUnit * productQuantity;
    // Create a new document in the "productEvents" collection
    const newProductEventRef = await firestore.collection("productEvents").add({
      productName,
      productQuantity,
      productPriceUnit,
      dateBuy,
      note,
      total,
      EventId: eventId,
    });

    // Retrieve the newly created document and send it in the response
    const newProductEventDoc = await newProductEventRef.get();
    const newProductEvent = {
      id: newProductEventDoc.id,
      ...newProductEventDoc.data(),
    };

    res.status(201).json(newProductEvent);
  } catch (error) {
    console.error("Error creating product event:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.delete(
  "/delete/:productEventId",
  checkRole(["KTX", "SCH"]),
  async (req, res) => {
    try {
      const productEventId = req.params.productEventId;
      // Delete the product event from Firestore
      await firestore.collection("productEvents").doc(productEventId).delete();
      res.status(200).json({ message: "Product event deleted successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error. Failed to delete product event.",
      });
    }
  }
);

//using firebase instead of it
// router.get("/all/:eventId", async (req, res) => {
//   try {
//     const eventId = req.params.eventId;
//     const eventRef = await firestore.collection("events").doc(eventId);
//     // Retrieve all product events for the specified event
//     const productEventsSnapshot = await firestore
//       .collection("productEvents")
//       .where("EventId", "==", eventRef)
//       .get();

//     if (productEventsSnapshot.empty) {
//       return res.status(404).json({
//         error: "No product events found for the given event.",
//       });
//     }

//     // Extract data from Firestore snapshot
//     const productEvents = [];
//     productEventsSnapshot.forEach((doc) => {
//       productEvents.push({
//         id: doc.id,
//         ...doc.data(),
//       });
//     });

//     res.status(200).json(productEvents);
//   } catch (error) {
//     console.error("Error fetching product events:", error);
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

module.exports = router;
