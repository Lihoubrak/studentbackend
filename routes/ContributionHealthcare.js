const express = require("express");
const { firestore } = require("../firebase/firebase");
const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const {
      date = new Date(),
      typePayMoney = "Cash",
      payMoney,
      userId,
    } = req.body;
    if (!date) {
      return res.status(400).json({ error: "Date is required." });
    }
    const newContributionRef = await firestore
      .collection("contributionHealthcare")
      .add({
        date: new Date(date),
        typePayMoney,
        payMoney,
        UserId: userId,
      });

    const newContributionDoc = await newContributionRef.get();

    res.status(201).json({
      id: newContributionRef.id,
      ...newContributionDoc.data(),
    });
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

    const allContributionSnapshot = await firestore
      .collection("contributionHealthcare")
      .where("date", ">=", startDate)
      .where("date", "<=", endDate)
      .get();

    const allContribution = await Promise.all(
      allContributionSnapshot.docs.map(async (doc) => {
        const { UserId } = doc.data();
        const userRef = await firestore.collection("users").doc(UserId).get();
        const userDoc = userRef.data();
        delete userDoc.password;
        delete userDoc.expo_push_token;
        const roomRef = await firestore
          .collection("rooms")
          .doc(userDoc.RoomId)
          .get();
        const roomData = roomRef.data();
        const dormRef = await firestore
          .collection("dormitories")
          .doc(roomRef.data().DormitoryId)
          .get();
        const dormData = dormRef.data();
        return {
          id: doc.id,
          ...doc.data(),
          User: {
            ...userDoc,
            Room: {
              ...roomData,
              Dormitory: dormData,
            },
          },
        };
      })
    );

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
