const express = require("express");
const router = express.Router();
router.post("/create", async (req, res) => {
  try {
    const {
      passportNumber,
      type,
      code,
      firstName,
      lastName,
      age,
      nationality,
      placeofbirth,
      placeofissue,
      dateofissue,
      dateofexpiry,
      gender,
      image,
      userId,
    } = req.body;
    if (
      !passportNumber ||
      !type ||
      !code ||
      !firstName ||
      !lastName ||
      !age ||
      !nationality ||
      !placeofbirth ||
      !placeofissue ||
      !dateofissue ||
      !dateofexpiry ||
      !gender
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }
    const newPassport = await Passport.create({
      UserId: userId,
      passportNumber,
      type,
      code,
      firstName,
      lastName,
      age,
      nationality,
      placeofbirth,
      placeofissue,
      dateofissue,
      dateofexpiry,
      gender,
      image: image || "No Image",
    });

    res.status(201).json(newPassport);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
module.exports = router;
