const express = require("express");
const { checkRole } = require("../middleware/authenticateToken");
const { firestore } = require("../firebase/firebase");
const checkPassportEntered = require("../utils/checkPassportEntered");
const upload = require("../middleware/uploadImage");
const router = express.Router();
router.post(
  "/create",
  checkRole(["STUDENT", "SCH", "KTX", "Admin"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        passportNumber,
        type,
        code,
        firstName,
        lastName,
        nationality,
        dateofbirth,
        placeofbirth,
        placeofissue,
        dateofissue,
        dateofexpiry,
        gender,
      } = req.body;
      // Construct the URL of the uploaded image
      const imageUrl = req.file
        ? `${req.protocol}://${req.get("host")}/${req.file.filename}`
        : "No Image";

      const userId = req.user.id;
      // Assuming "passports" is your collection name in Firestore
      const newPassportRef = await firestore.collection("passports").add({
        UserId: userId,
        passportNumber,
        type,
        code,
        firstName,
        lastName,
        nationality,
        dateofbirth: new Date(dateofbirth),
        placeofbirth,
        placeofissue,
        dateofissue: new Date(dateofissue),
        dateofexpiry: new Date(dateofexpiry),
        gender,
        isApprove: false,
        isRequestEdit: false,
        image: imageUrl,
        visa: {
          validityDate: "",
          untilDate: "",
        },
      });

      const newPassportDoc = await newPassportRef.get();
      const newPassportData = newPassportDoc.data();

      res.status(201).json(newPassportData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);
router.put("/update/visa/:userId", checkRole(["KTX"]), async (req, res) => {
  try {
    const { userId } = req.params;
    const { visaUntilDate, visaValidityDate } = req.body;
    // Tìm và cập nhật thông tin visa trong Firestore
    const passportQuery = firestore
      .collection("passports")
      .where("UserId", "==", userId);
    const passportSnapshot = await passportQuery.get();

    if (passportSnapshot.empty) {
      return res
        .status(404)
        .json({ error: "Passport not found for this user." });
    }

    const passportDoc = passportSnapshot.docs[0];
    const passportRef = passportDoc.ref;

    await passportRef.update({
      "visa.untilDate": new Date(visaUntilDate),
      "visa.validityDate": new Date(visaValidityDate),
    });

    const updatedPassportDoc = await passportRef.get();
    const updatedPassportData = updatedPassportDoc.data();

    res.status(200).json(updatedPassportData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});

router.get("/detail/:userId", checkRole(["KTX"]), async (req, res) => {
  try {
    const userId = req.params.userId;
    const passportSnapshot = await firestore
      .collection("passports")
      .where("UserId", "==", userId)
      .get();

    let passportData = null;
    passportSnapshot.forEach((doc) => {
      passportData = doc.data();
    });

    res.status(200).json(passportData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
router.get("/list", checkRole(["KTX"]), async (req, res) => {
  try {
    const { year, lastVisible, name } = req.query;
    const userId = req.user.id;
    const limit = 6;

    const rolesArray = [
      { id: 4, roleName: "Economics Leader" },
      { id: 5, roleName: "Sports Leader" },
      { id: 6, roleName: "Technical Leader" },
      { id: 7, roleName: "Cultural Leader" },
      { id: 8, roleName: "Communication Leader" },
      { id: 9, roleName: "Leader" },
    ];

    const roomIds = [];

    // Fetch room IDs based on roles
    for (const role of rolesArray) {
      const dormitoriesSnapshot = await firestore
        .collection("dormitories")
        .where("managers", "array-contains", { userId, role: role.roleName })
        .get();

      for (const doc of dormitoriesSnapshot.docs) {
        const dormitoryId = doc.id;
        const roomsSnapshot = await firestore
          .collection("rooms")
          .where("DormitoryId", "==", dormitoryId)
          .get();
        roomsSnapshot.forEach((roomDoc) => {
          roomIds.push(roomDoc.id);
        });
      }
    }

    // Split the roomIds into chunks of 10
    const chunkArray = (array, size) => {
      const chunkedArray = [];
      for (let i = 0; i < array.length; i += size) {
        chunkedArray.push(array.slice(i, i + size));
      }
      return chunkedArray;
    };

    const roomChunks = chunkArray(roomIds, 6);
    const userList = [];
    let lastFetchedUser = null;

    // Fetch users in batches
    for (const chunk of roomChunks) {
      let query = firestore
        .collection("users")
        .where("RoomId", "in", chunk)
        .where("userDate", ">=", new Date(`${year}-01-01`))
        .where("userDate", "<=", new Date(`${year}-12-31`))
        .limit(limit);

      if (lastVisible) {
        const lastDoc = await firestore
          .collection("users")
          .doc(lastVisible)
          .get();
        if (lastDoc.exists) {
          query = query.startAfter(lastDoc);
        }
      }

      if (name) {
        query = query
          .where("firstName", ">=", name)
          .where("firstName", "<=", name + "\uf8ff");
      }

      const usersSnapshot = await query.get();

      // Process each user
      for (const doc of usersSnapshot.docs) {
        const { firstName, lastName } = doc.data();
        const passportSnapshot = await firestore
          .collection("passports")
          .where("UserId", "==", doc.id)
          .get();

        let passportImage = null;
        let requestEdit = false;
        let isApprove = false;
        let passportEntered = false;
        let isVisaExpired = false;

        if (!passportSnapshot.empty) {
          const {
            image,
            isApprove: passportIsApprove,
            isRequestEdit: passportIsRequestEdit,
            visa: { untilDate: visaUntilDate },
          } = passportSnapshot.docs[0].data();

          passportImage = image;
          isApprove = passportIsApprove;
          requestEdit = passportIsRequestEdit;
          passportEntered = await checkPassportEntered(doc);

          const twoMonthsBeforeNow = new Date();
          twoMonthsBeforeNow.setMonth(twoMonthsBeforeNow.getMonth() - 2);

          // Convert visaUntilDate to a JavaScript Date object if it's not already
          const visaDate =
            visaUntilDate instanceof Date
              ? visaUntilDate
              : visaUntilDate.toDate
              ? visaUntilDate.toDate()
              : new Date(visaUntilDate);

          if (visaDate < twoMonthsBeforeNow) {
            isVisaExpired = true;
          }
        } else {
          passportEntered = await checkPassportEntered(doc);
        }

        userList.push({
          id: doc.id,
          firstName,
          lastName,
          passportImage,
          requestEdit,
          isApprove,
          passportEntered,
          isVisaExpired,
        });

        lastFetchedUser = doc;
      }

      // Stop processing more chunks if we have already reached the limit
      if (userList.length >= limit) {
        break;
      }
    }

    if (userList.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found for the specified criteria." });
    }

    res.status(200).json({
      users: userList,
      lastVisible: lastFetchedUser ? lastFetchedUser.id : null,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/year", checkRole(["KTX"]), async (req, res) => {
  try {
    const querySnapshot = await firestore.collection("users").get();
    const yearsSet = new Set();
    querySnapshot.forEach((doc) => {
      const createdAt = doc.data().userDate.toDate();
      const year = createdAt.getFullYear();
      yearsSet.add(year);
    });
    const uniqueYears = Array.from(yearsSet);
    res.json(uniqueYears);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
router.put(
  "/edit/:passportId",
  checkRole(["KTX", "SCH", "STUDENT"]),
  upload.single("image"),
  async (req, res) => {
    try {
      const passportId = req.params.passportId;
      const {
        passportNumber,
        type,
        code,
        firstName,
        lastName,
        nationality,
        dateofbirth,
        placeofbirth,
        placeofissue,
        dateofissue,
        dateofexpiry,
        gender,
      } = req.body;

      const passportRef = firestore.collection("passports").doc(passportId);
      const passportDoc = await passportRef.get();
      if (!passportDoc.exists) {
        return res.status(404).json({ error: "Passport not found." });
      }

      const passportData = passportDoc.data();
      // Check if the edit has been approved
      if (!passportData.isApprove) {
        await passportRef.update({ isRequestEdit: true });
        return res
          .status(403)
          .json({ error: "Edit has not been approved yet." });
      }

      // Check if date strings are valid and parse them
      const parseDate = (dateString) => {
        return dateString ? new Date(dateString) : passportData.dateofbirth;
      };

      const imageUrl =
        req.file && `${req.protocol}://${req.get("host")}/${req.file.filename}`;

      // Update passport data with parsed date values
      const updateData = {
        passportNumber: passportNumber || passportData.passportNumber,
        type: type || passportData.type,
        code: code || passportData.code,
        firstName: firstName || passportData.firstName,
        lastName: lastName || passportData.lastName,
        nationality: nationality || passportData.nationality,
        dateofbirth: parseDate(dateofbirth),
        placeofbirth: placeofbirth || passportData.placeofbirth,
        placeofissue: placeofissue || passportData.placeofissue,
        dateofissue: parseDate(dateofissue),
        dateofexpiry: parseDate(dateofexpiry),
        gender: gender || passportData.gender,
        image: imageUrl || passportData.image,
        isApprove: false,
      };

      await passportRef.update(updateData);
      res
        .status(200)
        .json({ message: "Passport information updated successfully." });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

router.put("/approve/:userId", checkRole(["KTX"]), async (req, res) => {
  try {
    const userId = req.params.userId;
    // Find the passport associated with the user
    const passportSnapshot = await firestore
      .collection("passports")
      .where("UserId", "==", userId)
      .get();

    // Check if the passport exists
    if (passportSnapshot.empty) {
      return res
        .status(404)
        .json({ error: "Passport not found for this user." });
    }

    // Assuming there's only one passport associated with a user
    const passportDoc = passportSnapshot.docs[0];
    const passportRef = passportDoc.ref;

    // Approve passport edit by setting isApprove to true
    await passportRef.update({
      isApprove: true,
      isRequestEdit: false,
    });

    // Get user's Expo push token
    const userSnapshot = await firestore.collection("users").doc(userId).get();
    const userDoc = userSnapshot.data();

    // Send push notifications
    const tokens = [userDoc.expo_push_token];
    const description = "Passport Edit Approved";
    const content = "Your passport edit has been approved.";

    // Use the ID of the updated passport as the notification reference
    await sendPushNotifications(
      tokens.filter(Boolean),
      description,
      content,
      null,
      "passport"
    );
    res.status(200).json({ message: "Passport edit approved successfully." });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//for Application
router.get(
  "/all",
  checkRole(["STUDENT", "SCH", "KTX", "Admin"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      // Query the passport collection to find the passport associated with the user
      const passportSnapshot = await firestore
        .collection("passports")
        .where("UserId", "==", userId)
        .get();
      // Check if the passport exists
      if (passportSnapshot.empty) {
        return res
          .status(404)
          .json({ error: "Passport not found for this user." });
      }

      // Assuming there's only one passport associated with a user
      const passportDoc = passportSnapshot.docs[0];
      const passportData = passportDoc.data();
      res.status(200).json({ id: passportDoc.id, ...passportData });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);

module.exports = router;
