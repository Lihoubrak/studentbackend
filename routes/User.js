const express = require("express");
const bcrypt = require("bcrypt");
const { generateToken, checkRole } = require("../middleware/authenticateToken");
const { firestore, fireauth } = require("../firebase/firebase");
const { sendVerificationCode } = require("../utils/sendVerificationCode");
const router = express.Router();
router.post("/register", async (req, res) => {
  try {
    const {
      username,
      password,
      confirmPassword,
      firstName,
      lastName,
      birthday,
      nationality,
      gender,
      email,
      phoneNumber,
      facebook,
      zalo,
      expo_push_token,
      room,
      degree,
      major,
      schoolId,
      dormitoryId,
      year,
    } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required." });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // Check if the username already exists in Firestore
    const userRecordByUsername = await firestore
      .collection("users")
      .where("username", "==", username)
      .get();
    if (!userRecordByUsername.empty) {
      return res.status(400).json({ error: "Username is already in use." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get Room and Major IDs
    const roomSnapshot = await firestore
      .collection("rooms")
      .where("roomNumber", "==", String(room))
      .where("DormitoryId", "==", dormitoryId)
      .limit(1)
      .get();

    const dormrSnapshot = await firestore
      .collection("majors")
      .where("majorName", "==", String(major))
      .where("SchoolId", "==", schoolId)
      .limit(1)
      .get();

    const roomReference = roomSnapshot.docs[0] ? roomSnapshot.docs[0].id : null;
    const dormitoryReference = dormrSnapshot.docs[0]
      ? dormrSnapshot.docs[0].id
      : null;

    let roleStudentId;
    const roleStudentSnapshot = await firestore
      .collection("roles")
      .where("roleName", "==", "STUDENT")
      .get();

    if (!roleStudentSnapshot.empty) {
      const roleStudentDoc = roleStudentSnapshot.docs[0];
      roleStudentId = roleStudentDoc.id;
    } else {
      console.log("No role with roleName 'STUDENT' found.");
    }

    // Create new user object
    const newUser = {
      username,
      password: hashedPassword,
      degree,
      year,
      RoleId: roleStudentId,
      MajorId: dormitoryReference,
      RoomId: roomReference,
      firstName,
      lastName,
      birthday,
      nationality,
      gender,
      email,
      phoneNumber,
      facebook,
      zalo,
      status: true,
      graduate: false,
      leftRoomYear: new Date().getFullYear(),
      avatar:
        gender === "Male" || gender === "ប្រុស"
          ? `${req.protocol}://${req.get("host")}/boy.png`
          : `${req.protocol}://${req.get("host")}/human.png`,
      expo_push_token: expo_push_token || null,
      userDate: new Date(),
    };

    // Create user document in Firestore
    const userRef = await firestore.collection("users").add(newUser);
    const userId = userRef.id;

    res.status(201).json({ userId, message: "User registered successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
router.post("/login", async (req, res) => {
  try {
    const { username, password, expoToken } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    // Fetch user credentials from Firestore
    const userSnapshot = await firestore
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (userSnapshot.empty) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const userData = userSnapshot.docs[0].data();
    const userId = userSnapshot.docs[0].id;

    // Check if user status is false, prevent login
    if (!userData.status) {
      return res
        .status(401)
        .json({ error: "Your account is inactive. Please contact support." });
    }

    // Fetch the role document using the RoleId reference
    const roleDoc = await firestore
      .collection("roles")
      .doc(userData.RoleId)
      .get();

    // Check if the role document exists and extract the roleName
    let roleName = null;
    if (roleDoc.exists) {
      roleName = roleDoc.data().roleName;
    } else {
      console.error("Role document does not exist for user:", username);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    // Update expo push token in Firestore
    if (expoToken) {
      await firestore
        .collection("users")
        .doc(userId)
        .update({ expo_push_token: expoToken });
    }

    // Generate Firebase custom token with additional claims
    const user = {
      id: userId,
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar,
      role: roleName,
    };
    const token = generateToken(user);
    res.status(200).json(token);
  } catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});
//   try {
//     const querySnapshot = await firestore.collection("users").get();
//     const allStudents = [];

//     for (const doc of querySnapshot.docs) {
//       const studentData = doc.data();

//       delete studentData.password;
//       delete studentData.expo_push_token;

//       const roomRef = studentData.RoomId;
//       const majorRef = studentData.MajorId;

//       if (!roomRef && !majorRef) {
//         allStudents.push({
//           id: doc.id,
//           ...studentData,
//           Room: null,
//           Major: null,
//           School: null,
//         });
//         continue;
//       }

//       const roomData = roomRef
//         ? (await firestore.collection("rooms").doc(roomRef).get()).data()
//         : null;
//       const majorData = majorRef
//         ? (await firestore.collection("majors").doc(majorRef).get()).data()
//         : null;
//       const dormitoryData =
//         roomData && roomData.DormitoryId
//           ? (
//               await firestore
//                 .collection("dormitories")
//                 .doc(roomData.DormitoryId)
//                 .get()
//             ).data()
//           : null;
//       const schoolData =
//         majorData && majorData.SchoolId
//           ? (
//               await firestore
//                 .collection("schools")
//                 .doc(majorData.SchoolId)
//                 .get()
//             ).data()
//           : null;

//       const room = roomData
//         ? {
//             id: roomRef,
//             roomNumber: roomData.roomNumber,
//             numberOfStudents: roomData.numberOfStudents,
//             Dormitory: dormitoryData
//               ? {
//                   id: roomData.DormitoryId,
//                   dormName: dormitoryData.dormName,
//                 }
//               : null,
//           }
//         : null;

//       const major = majorData
//         ? {
//             id: majorRef,
//             majorName: majorData.majorName,
//             School: schoolData
//               ? {
//                   id: majorData.SchoolId,
//                   schoolName: schoolData.schoolName,
//                 }
//               : null,
//           }
//         : null;

//       allStudents.push({
//         id: doc.id,
//         ...studentData,
//         Room: room,
//         Major: major,
//       });
//     }

//     res.status(200).json(allStudents);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });
router.get("/all", async (req, res) => {
  const limit = parseInt(req.query.limit) || 6; // Default to 10 documents per page
  const startAfter = req.query.startAfter || null; // Document ID to start after
  const searchQuery = req.query.searchQuery || ""; // Search query for user names

  try {
    let query = firestore.collection("users").limit(limit);

    if (startAfter) {
      const startAfterDoc = await firestore
        .collection("users")
        .doc(startAfter)
        .get();
      query = query.startAfter(startAfterDoc);
    }

    // If there's a search query, adjust the query to filter based on the searchQuery
    if (searchQuery) {
      query = query
        .where("firstName", ">=", searchQuery)
        .where("firstName", "<=", searchQuery + "\uf8ff");
    }

    const querySnapshot = await query.get();
    const allStudents = [];

    for (const doc of querySnapshot.docs) {
      const studentData = doc.data();

      delete studentData.password;
      delete studentData.expo_push_token;

      const roomRef = studentData.RoomId;
      const majorRef = studentData.MajorId;

      if (!roomRef && !majorRef) {
        allStudents.push({
          id: doc.id,
          ...studentData,
          Room: null,
          Major: null,
          School: null,
        });
        continue;
      }

      const roomData = roomRef
        ? (await firestore.collection("rooms").doc(roomRef).get()).data()
        : null;
      const majorData = majorRef
        ? (await firestore.collection("majors").doc(majorRef).get()).data()
        : null;
      const dormitoryData =
        roomData && roomData.DormitoryId
          ? (
              await firestore
                .collection("dormitories")
                .doc(roomData.DormitoryId)
                .get()
            ).data()
          : null;
      const schoolData =
        majorData && majorData.SchoolId
          ? (
              await firestore
                .collection("schools")
                .doc(majorData.SchoolId)
                .get()
            ).data()
          : null;

      const room = roomData
        ? {
            id: roomRef,
            roomNumber: roomData.roomNumber,
            numberOfStudents: roomData.numberOfStudents,
            Dormitory: dormitoryData
              ? {
                  id: roomData.DormitoryId,
                  dormName: dormitoryData.dormName,
                }
              : null,
          }
        : null;

      const major = majorData
        ? {
            id: majorRef,
            majorName: majorData.majorName,
            School: schoolData
              ? {
                  id: majorData.SchoolId,
                  schoolName: schoolData.schoolName,
                }
              : null,
          }
        : null;

      allStudents.push({
        id: doc.id,
        ...studentData,
        Room: room,
        Major: major,
      });
    }

    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
    const nextPageToken = lastVisible ? lastVisible.id : null;

    res.status(200).json({ students: allStudents, nextPageToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/all/manager", checkRole(["Admin"]), async (req, res) => {
  try {
    const { role } = req.query;
    const roleRef = await firestore.collection("roles").doc(role).get();
    const roleData = roleRef.data();
    if (!roleData) {
      return res.status(404).json({ error: "Role not found" });
    }

    const usersSnapshot = await firestore
      .collection("users")
      .where("RoleId", "==", roleRef.id)
      .get();
    if (!usersSnapshot) {
      return res.status(500).json({ error: "Failed to fetch users data" });
    }
    const usersData = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      Role: roleData,
    }));

    res.status(200).json(usersData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.put("/update/status/:userId", checkRole(["Admin"]), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    await firestore
      .collection("users")
      .doc(userId)
      .update({
        status: Boolean(status),
      });
    res.status(200).json({ message: "User status updated successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
});
router.put("/update-password", checkRole(["Admin"]), async (req, res) => {
  try {
    const { newPassword, userId } = req.body;
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await firestore.collection("users").doc(userId).update({
      password: hashedPassword,
    });
    res.status(200).json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ error: "Failed to update password." });
  }
});

//Role
router.get("/all/role", checkRole(["Admin"]), async (req, res) => {
  try {
    const rolesSnapshot = await firestore.collection("roles").get();
    const rolesData = rolesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(rolesData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/role/update", checkRole(["Admin"]), async (req, res) => {
  const { roleId, userId } = req.body;
  try {
    await firestore.collection("users").doc(userId).update({
      RoleId: roleId,
    });
    res.status(200).json({ message: "Role updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//verificationCodes
router.post(
  "/send-verification-code",
  checkRole(["Admin", "SCH", "STUDENT", "KTX"]),
  async (req, res) => {
    try {
      const { userEmailAddress } = req.body;
      const userId = req.user.id;
      const userDoc = await firestore.collection("users").doc(userId).get();

      // Check if the user exists with the provided email address
      if (!userDoc.exists || userDoc.data().email !== userEmailAddress) {
        return res
          .status(400)
          .json({ error: "User with this email does not exist." });
      }

      // Check if the user already has a verification code record
      const verificationCodeRef = await firestore
        .collection("verificationCodes")
        .where("email", "==", userEmailAddress)
        .get();

      let verificationCodeDocRef;

      // If a verification code record already exists, get its reference
      if (!verificationCodeRef.empty) {
        verificationCodeDocRef = verificationCodeRef.docs[0].ref;
      } else {
        // If no verification code record exists, create a new one
        const { code, expiration } = await sendVerificationCode(
          userEmailAddress
        );
        const hashedCode = await bcrypt.hash(code.toString(), 10);

        verificationCodeDocRef = await firestore
          .collection("verificationCodes")
          .add({
            UserId: userId,
            email: userEmailAddress,
            code: hashedCode,
            expiration,
          });
      }

      // Send a new verification code
      const { code, expiration } = await sendVerificationCode(userEmailAddress);
      const hashedCode = await bcrypt.hash(code.toString(), 10);

      // Update the verification code document
      await verificationCodeDocRef.update({
        code: hashedCode,
        expiration: expiration,
      });

      res.status(200).json({ message: "Verification code sent successfully." });
    } catch (error) {
      console.error("Error sending verification code:", error);
      res.status(500).json({ error: "Failed to send verification code." });
    }
  }
);

router.post(
  "/verify-code",
  checkRole(["Admin", "SCH", "STUDENT", "KTX"]),
  async (req, res) => {
    try {
      const { code } = req.body;
      const userId = req.user.id;
      // Retrieve hashed verification code from the database
      const verificationCodeSnapshot = await firestore
        .collection("verificationCodes")
        .where("UserId", "==", userId)
        .get();

      if (verificationCodeSnapshot.empty) {
        return res.status(400).json({ error: "Verification code not found." });
      }

      const verificationCodeDoc = verificationCodeSnapshot.docs[0];
      const verificationCodeData = verificationCodeDoc.data();
      const storedHashedCode = verificationCodeData.code;
      const expirationDate = verificationCodeData.expiration.toDate();

      // Check if the code is expired
      if (expirationDate < new Date()) {
        return res
          .status(400)
          .json({ error: "Verification code has expired." });
      }

      // Compare the provided code with the hashed code
      const isMatch = await bcrypt.compare(code, storedHashedCode);

      if (!isMatch) {
        return res.status(400).json({ error: "Invalid verification code." });
      }

      // Delete the verification code record after successful verification
      await verificationCodeDoc.ref.delete();

      res.status(200).json({ message: "Verification successful." });
    } catch (error) {
      console.error("Error verifying code:", error);
      res.status(500).json({ error: "Failed to verify code." });
    }
  }
);

router.post(
  "/reset-otp",
  checkRole(["Admin", "SCH", "STUDENT", "KTX"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const userDoc = await firestore.collection("users").doc(userId).get();

      // Check if the user exists
      if (!userDoc.exists) {
        return res.status(400).json({ error: "User not found." });
      }

      // Generate a new verification code
      const { code, expiration } = await sendVerificationCode(
        userDoc.data().email
      );

      // Hash the new verification code
      const hashedCode = await bcrypt.hash(code.toString(), 10);

      // Find the existing verification code or create a new one
      let verificationCodeDoc;
      const verificationCodeSnapshot = await firestore
        .collection("verificationCodes")
        .where("UserId", "==", userId)
        .get();

      if (verificationCodeSnapshot.empty) {
        // Create a new verification code record
        verificationCodeDoc = await firestore
          .collection("verificationCodes")
          .add({
            UserId: userId,
            email: userDoc.data().email,
            code: hashedCode,
            expiration: expiration,
          });
      } else {
        verificationCodeDoc = verificationCodeSnapshot.docs[0];
        // Update the existing verification code in Firestore
        await verificationCodeDoc.ref.update({
          code: hashedCode, // Store the hashed code instead of the plain code
          expiration: expiration,
        });
      }

      res.status(200).json({ message: "OTP reset successfully." });
    } catch (error) {
      console.error("Error resetting OTP:", error);
      res.status(500).json({ error: "Failed to reset OTP." });
    }
  }
);
router.put(
  "/update-password-by-user",
  checkRole(["KTX", "Admin", "SCH", "STUDENT"]),
  async (req, res) => {
    try {
      const { newPassword } = req.body;
      const userId = req.user.id;
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // Update the user's password in the database
      await firestore.collection("users").doc(userId).update({
        password: hashedPassword,
      });
      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ error: "Failed to update password." });
    }
  }
);
router.get("/profile", checkRole(["KTX", "Admin", "SCH"]), async (req, res) => {
  try {
    const userId = req.user.id;
    // Retrieve user document from Firestore
    const userSnapshot = await firestore.collection("users").doc(userId).get();
    const userData = userSnapshot.data();

    // Check if user exists
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // Include related data using additional queries
    const roomId = userData.RoomId;
    const majorId = userData.MajorId;

    // Initialize roomData and majorData as empty objects
    let roomData = {};
    let majorData = {};

    // Retrieve room data if RoomId exists
    if (roomId) {
      const roomSnapshot = await firestore
        .collection("rooms")
        .doc(roomId)
        .get();
      roomData = roomSnapshot.data() || {};
    }

    // Retrieve major data if MajorId exists
    if (majorId) {
      const majorSnapshot = await firestore
        .collection("majors")
        .doc(majorId)
        .get();
      majorData = majorSnapshot.data() || {};
    }
    // Retrieve school data if SchoolId exists in majorData
    const schoolId = majorData.SchoolId;
    let schoolData = {};
    if (schoolId) {
      const schoolSnapshot = await firestore
        .collection("schools")
        .doc(schoolId)
        .get();
      schoolData = schoolSnapshot.data() || {};
    }

    // Construct response object
    const userDetail = {
      id: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      avatar: userData.avatar,
      degree: userData.degree,
      facebook: userData.facebook,
      Room: roomData,
      Major: {
        ...majorData,
        School: schoolData,
      },
    };
    res.status(200).json(userDetail);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
//For Appliciation
router.get("/detail/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    // Retrieve user document from Firestore
    const userSnapshot = await firestore.collection("users").doc(userId).get();
    const userData = userSnapshot.data();

    // Check if user exists
    if (!userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // Include related data using additional queries
    const roomId = userData.RoomId;
    const majorId = userData.MajorId;

    // Initialize roomData and majorData as empty objects
    let roomData = {};
    let majorData = {};

    // Retrieve room data if RoomId exists
    if (roomId) {
      const roomSnapshot = await firestore
        .collection("rooms")
        .doc(roomId)
        .get();
      roomData = roomSnapshot.data() || {};
    }

    // Retrieve major data if MajorId exists
    if (majorId) {
      const majorSnapshot = await firestore
        .collection("majors")
        .doc(majorId)
        .get();
      majorData = majorSnapshot.data() || {};
    }
    // Retrieve school data if SchoolId exists in majorData
    const schoolId = majorData.SchoolId;
    let schoolData = {};
    if (schoolId) {
      const schoolSnapshot = await firestore
        .collection("schools")
        .doc(schoolId)
        .get();
      schoolData = schoolSnapshot.data() || {};
    }

    // Construct response object
    const userDetail = {
      id: userId,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phoneNumber: userData.phoneNumber,
      avatar: userData.avatar,
      degree: userData.degree,
      Room: roomData,
      Major: {
        ...majorData,
        School: schoolData,
      },
    };
    res.status(200).json(userDetail);
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get(
  "/detail",
  checkRole(["STUDENT", "SCH", "KTX", "Admin"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      // Retrieve user document from Firestore
      const userSnapshot = await firestore
        .collection("users")
        .doc(userId)
        .get();
      const userData = userSnapshot.data();

      // Check if user exists
      if (!userData) {
        return res.status(404).json({ error: "User not found" });
      }

      // Include related data using additional queries
      const roomId = userData.RoomId;
      const majorId = userData.MajorId;

      // Initialize roomData and majorData as empty objects
      let roomData = {};
      let majorData = {};

      // Retrieve room data if RoomId exists
      if (roomId) {
        const roomSnapshot = await firestore
          .collection("rooms")
          .doc(roomId)
          .get();
        roomData = roomSnapshot.data() || {};
      }

      // Retrieve major data if MajorId exists
      if (majorId) {
        const majorSnapshot = await firestore
          .collection("majors")
          .doc(majorId)
          .get();
        majorData = majorSnapshot.data() || {};
      }

      // Retrieve school data if SchoolId exists in majorData
      const schoolId = majorData.SchoolId;
      let schoolData = {};
      if (schoolId) {
        const schoolSnapshot = await firestore
          .collection("schools")
          .doc(schoolId)
          .get();
        schoolData = schoolSnapshot.data() || {};
      }

      // Construct response object
      const userDetail = {
        id: userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        avatar: userData.avatar,
        degree: userData.degree,
        Room: roomData,
        Major: {
          ...majorData,
          School: schoolData,
        },
      };
      res.status(200).json(userDetail);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/alluser",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      // Get all user documents except for the current user
      const userSnapshot = await firestore.collection("users").get();

      const allUsers = [];
      userSnapshot.forEach((doc) => {
        // Exclude current user from the result
        if (doc.id !== userId) {
          const { avatar, firstName, lastName } = doc.data();
          allUsers.push({ id: doc.id, avatar, firstName, lastName });
        }
      });

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
router.put(
  "/edit",
  checkRole(["KTX", "SCH", "STUDENT", "Admin"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { avatar, phoneNumber, email } = req.body;

      // Construct updated user object
      const updatedUser = {};
      if (avatar) updatedUser.avatar = avatar;
      if (phoneNumber) updatedUser.phoneNumber = phoneNumber;
      if (email) updatedUser.email = email;

      // Update user document in Firestore
      await firestore.collection("users").doc(userId).update(updatedUser);

      res
        .status(200)
        .json({ message: "User information updated successfully." });
    } catch (error) {
      console.error("Error updating user information:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get(
  "/leader",
  checkRole(["KTX", "SCH", "STUDENT"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      // Retrieve user document from Firestore
      const userSnapshot = await firestore
        .collection("users")
        .doc(userId)
        .get();
      const userData = userSnapshot.data();

      // Extract room and major IDs from user data
      const roomId = userData.RoomId;
      const majorId = userData.MajorId;
      if (!roomId || !majorId) {
        return res
          .status(404)
          .json({ error: "User does not have RoomId or MajorId" });
      }
      // Retrieve room and major documents from Firestore
      const roomSnapshot = await firestore
        .collection("rooms")
        .doc(roomId)
        .get();
      const majorSnapshot = await firestore
        .collection("majors")
        .doc(majorId)
        .get();

      // Extract dormitory and school IDs from room and major data
      const dormitoryId = roomSnapshot.data().DormitoryId;
      const schoolId = majorSnapshot.data().SchoolId;

      // Retrieve dormitory and school documents from Firestore
      const dormitorySnapshot = await firestore
        .collection("dormitories")
        .doc(dormitoryId)
        .get();
      const schoolSnapshot = await firestore
        .collection("schools")
        .doc(schoolId)
        .get();

      // Extract manager IDs from dormitory and school data
      const dormitoryManagers = dormitorySnapshot.data().managers;
      const schoolManagers = schoolSnapshot.data().managers;

      // Fetch manager details from Firestore with specific fields
      const dormitoryManagerPromises = dormitoryManagers.map(
        async (manager) => {
          const { userId, role } = manager;
          const managerSnapshot = await firestore
            .collection("users")
            .doc(userId)
            .get();
          const managerData = managerSnapshot.data();
          return {
            id: managerSnapshot.id,
            lastName: managerData.lastName,
            firstName: managerData.firstName,
            avatar: managerData.avatar,
            phoneNumber: managerData.phoneNumber,
            major: managerData.major,
            room: managerData.room,
            role: role,
          };
        }
      );

      const schoolManagerPromises = schoolManagers.map(async (manager) => {
        const { userId, role } = manager;
        const managerSnapshot = await firestore
          .collection("users")
          .doc(userId)
          .get();
        const managerData = managerSnapshot.data();
        return {
          id: managerSnapshot.id,
          lastName: managerData.lastName,
          firstName: managerData.firstName,
          avatar: managerData.avatar,
          phoneNumber: managerData.phoneNumber,
          major: managerData.major,
          room: managerData.room,
          role: role,
        };
      });

      // Wait for all manager details to be fetched
      const dormitoryManagerData = await Promise.all(dormitoryManagerPromises);
      const schoolManagerData = await Promise.all(schoolManagerPromises);

      // Construct the response object
      const response = {
        dormitoryManagers: dormitoryManagerData,
        schoolManagers: schoolManagerData,
      };

      res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching user details:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

module.exports = router;
