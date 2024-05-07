// const express = require("express");
// const Healthcare = require("../models/Healthcare");
// const { Op } = require("sequelize");
// const User = require("../models/User");
// const Dormitory = require("../models/Dormitory");
// const Room = require("../models/Room");
// const router = express.Router();
// router.post("/create", async (req, res) => {
//   try {
//     const { date, note, cost, discount, hospital, typeofDisease, userId } =
//       req.body;
//     if (!date) {
//       return res.status(400).json({ error: "Date is required." });
//     }

//     // Check if cost exists and is a valid number
//     if (isNaN(cost)) {
//       return res.status(400).json({ error: "Cost should be a number." });
//     }

//     // Calculate totalPatientPay based on cost
//     const totalPatientPay = cost - parseFloat(discount);

//     const newHealthcareEvent = await Healthcare.create({
//       date,
//       note,
//       cost,
//       discount,
//       typeofDisease,
//       totalPatientPay,
//       hospital,
//       UserId: userId,
//     });

//     res.status(201).json(newHealthcareEvent);
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error." });
//   }
// });

// router.get("/all", async (req, res) => {
//   try {
//     const { month, year } = req.query;
//     const startDate = new Date(year, month - 1, 1); // Note: month is zero-based in JavaScript Date object
//     const endDate = new Date(year, month, 0); // Note: month is zero-based in JavaScript Date object

//     const allPatient = await Healthcare.findAll({
//       where: {
//         createdAt: {
//           [Op.between]: [startDate, endDate],
//         },
//       },
//       include: [
//         {
//           model: User,
//           include: [
//             {
//               model: Room,
//               include: {
//                 model: Dormitory,
//                 attributes: {
//                   exclude: ["dormLocation", "dormDescription", "dormImage"],
//                 },
//               },
//               attributes: {
//                 exclude: [
//                   "numberOfStudents",
//                   "temporaryResidencePeriod",
//                   "meansOfTransportation",
//                   "medicalInsurance",
//                 ],
//               },
//             },
//           ],
//           attributes: { exclude: ["password"] },
//         },
//       ],
//     });

//     if (allPatient.length === 0) {
//       return res.status(404).json({
//         error: "No patient data available for the specified month and year",
//       });
//     }
//     res.status(200).json(allPatient);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// module.exports = router;
