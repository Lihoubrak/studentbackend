const express = require("express");
const upload = require("../middleware/uploadImage");
const { checkRole } = require("../middleware/authenticateToken");
const { firestore } = require("../firebase/firebase");
const router = express.Router();
const admin = require("firebase-admin");
const { Filter } = require("firebase-admin/firestore");
const { deleteMajorsAndClearUsers } = require("../services/firestoreService");
router.post(
  "/create",
  checkRole(["Admin"]),
  upload.single("schoolImage"),
  async (req, res) => {
    try {
      const { schoolName, schoolLocation, schoolDescription, managers } =
        req.body;

      // Validate required fields
      if (!schoolName || !schoolLocation || !schoolDescription) {
        return res.status(400).json({
          error: "School name, location, and description are required.",
        });
      }

      let schoolImage = "No Image";
      if (req.file) {
        // If a file is uploaded, set schoolImage to the filename
        const localhost = "http://localhost:3000/";
        schoolImage = localhost + req.file.filename;
      }
      const userId = req.user.id;
      const newSchoolRef = await firestore.collection("schools").add({
        UserId: userId,
        schoolName,
        schoolLocation,
        schoolDescription,
        schoolImage,
        managers: managers || [],
      });

      res.status(201).json(newSchoolRef);
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Internal server error. Failed to create school." });
    }
  }
);

router.get("/all", checkRole(["Admin", "SCH"]), async (req, res) => {
  try {
    const userId = req.user.id;
    const rolesArray = [
      { id: 1, roleName: "Admin" },
      { id: 2, roleName: "Manager" },
      { id: 3, roleName: "User" },
      // Add more roles as needed
    ];

    // Query schools where the user is listed as a manager with a specific role or is the owner
    const schoolsSnapshot = await firestore
      .collection("schools")
      .where(
        Filter.or(
          // Check for the user as a manager with a specific role
          ...rolesArray.map((role) =>
            Filter.where("managers", "array-contains", {
              userId: userId,
              role: role.roleName,
            })
          ),
          // Check for the user as the owner
          Filter.where("UserId", "==", userId)
        )
      )
      .get();

    const schools = [];
    schoolsSnapshot.forEach((doc) => {
      schools.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json(schools);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/detail/:schoolId", async (req, res) => {
  try {
    const schoolId = req.params.schoolId;
    const { year } = req.query;

    // Fetch majors under the given school
    const majorsSnapshot = await firestore
      .collection("majors")
      .where("SchoolId", "==", schoolId)
      .get();

    // Extract major IDs
    const majorIds = majorsSnapshot.docs.map((doc) => doc.id);
    if (majorIds.length === 0) {
      return res.status(404).json({
        error:
          "No majors found for the school , Please create Major for this school",
      });
    }
    // Fetch students in majors under the given school for the given year
    const studentsQuery = await firestore
      .collection("users")
      .where("MajorId", "in", majorIds)
      .where("userDate", ">=", new Date(`${year}-01-01`))
      .where("userDate", "<=", new Date(`${year}-12-31`))
      .get();

    const studentsInSchool = [];

    for (const doc of studentsQuery.docs) {
      const data = doc.data();
      delete data.password;
      delete data.expo_push_token;

      const majorId = data.MajorId;

      // Fetch major data using majorId
      const majorSnapshot = await firestore
        .collection("majors")
        .doc(majorId)
        .get();
      const majorData = majorSnapshot.data();

      studentsInSchool.push({
        id: doc.id,
        Major: majorData,
        ...data,
      });
    }

    if (studentsInSchool.length === 0) {
      return res.status(404).json({
        error: "No students found in this major for the given year",
      });
    }

    res.status(200).json(studentsInSchool);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/allschool", checkRole(["Admin", "KTX"]), async (req, res) => {
  try {
    const allSchoolSnapshot = await firestore.collection("schools").get();
    const allSchool = [];
    allSchoolSnapshot.forEach((doc) => {
      allSchool.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    res.status(200).json(allSchool);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/all/student/:schoolId", checkRole(["Admin"]), async (req, res) => {
  try {
    const schoolId = req.params.schoolId;
    const year = req.query.year;

    // Fetch all majors in the specified school
    const majorsSnapshot = await firestore
      .collection("majors")
      .where("SchoolId", "==", schoolId)
      .get();
    // Get major IDs for the fetched majors
    const majorIds = majorsSnapshot.docs.map((doc) => doc.id);
    // If there are no major IDs, return an error
    if (majorIds.length === 0) {
      return res.status(404).json({
        error:
          "No majors found for the school , Please create Major for this school",
      });
    }
    // Fetch all students in the majors for the specified year
    const studentsSnapshot = await firestore
      .collection("users")
      .where("MajorId", "in", majorIds)
      .where("userDate", ">=", new Date(`${year}-01-01`))
      .where("userDate", "<=", new Date(`${year}-12-31`))
      .get();

    const studentsData = await Promise.all(
      studentsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        delete data.password;
        delete data.expo_push_token;

        // Fetch major information
        const majorDoc = await firestore
          .collection("majors")
          .doc(data.MajorId)
          .get();
        const majorData = majorDoc.data();

        // Fetch school information
        const schoolDoc = await firestore
          .collection("schools")
          .doc(schoolId)
          .get();
        const schoolData = schoolDoc.data();

        return {
          id: doc.id,
          ...data,
          Major: {
            id: majorDoc.id,
            ...majorData,
            School: {
              id: schoolId,
              ...schoolData,
            },
          },
        };
      })
    );

    if (studentsData.length === 0) {
      return res.status(404).json({ error: "No student found for the year" });
    }

    res.status(200).json(studentsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put(
  "/update/:schoolId/managers",
  checkRole(["Admin"]),
  async (req, res) => {
    try {
      const { userId, role } = req.body;
      const { schoolId } = req.params;
      const currentTime = new Date().toISOString();

      // Check if the user ID is valid
      const userSnapshot = await firestore
        .collection("users")
        .doc(userId)
        .get();
      if (!userSnapshot.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      // Update managers for the school
      await firestore
        .collection("schools")
        .doc(schoolId)
        .update({
          managers: admin.firestore.FieldValue.arrayUnion({ userId, role }),
          updatedAt: currentTime,
        });

      res.status(200).json({ message: "Managers updated successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error. Failed to update managers.",
      });
    }
  }
);

router.put(
  "/remove/:schoolId/manager",
  checkRole(["Admin"]),
  async (req, res) => {
    try {
      const { userId, role } = req.body;
      const { schoolId } = req.params;
      const currentTime = new Date().toISOString();

      // Check if the user ID is valid
      const userSnapshot = await firestore
        .collection("users")
        .doc(userId)
        .get();
      if (!userSnapshot.exists) {
        return res.status(404).json({ error: "User not found" });
      }

      // Remove the manager from the school's managers array
      await firestore
        .collection("schools")
        .doc(schoolId)
        .update({
          managers: admin.firestore.FieldValue.arrayRemove({ userId, role }),
          updatedAt: currentTime,
        });

      res.status(200).json({ message: "Manager removed successfully." });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        error: "Internal server error. Failed to remove manager.",
      });
    }
  }
);
router.delete("/remove/:schoolId", checkRole(["Admin"]), async (req, res) => {
  try {
    const { schoolId } = req.params;

    // Check if the school exists
    const schoolDoc = await firestore.collection("schools").doc(schoolId).get();
    if (!schoolDoc.exists) {
      return res.status(404).json({ error: "School not found." });
    }
    // Delete majors associated with the school
    await deleteMajorsAndClearUsers(schoolId);

    // Delete the school document
    await firestore.collection("schools").doc(schoolId).delete();

    res
      .status(200)
      .json({ message: "School and associated data removed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        "Internal server error. Failed to remove school and associated data.",
    });
  }
});

router.get(
  "/getstudentinmajor",
  checkRole(["STUDENT", "KTX", "SCH", "Admin"]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { year } = req.query;

      // Lấy MajorId và SchoolId của người dùng từ Firestore
      const userRef = await firestore.collection("users").doc(userId).get();
      const majorId = userRef.data().MajorId;

      // Lấy thông tin về major từ Firestore
      const majorSnapshot = await firestore
        .collection("majors")
        .doc(majorId)
        .get();
      const majorData = majorSnapshot.data();
      const major = {
        majorName: majorData.majorName,
        majorImage: majorData.majorImage,
      };

      // Truy vấn danh sách sinh viên trong cùng Major và cùng School
      const studentsSnapshot = await firestore
        .collection("users")
        .where("MajorId", "==", majorId)
        .where("userDate", ">=", new Date(`${year}-01-01`))
        .where("userDate", "<=", new Date(`${year}-12-31`))
        .get();

      // Chuyển đổi dữ liệu snapshot thành mảng danh sách sinh viên
      const students = [];
      studentsSnapshot.forEach((doc) => {
        const student = doc.data();
        delete student.password;
        delete student.expo_push_token;
        students.push({ ...student, id: doc.id });
      });

      // Trả về danh sách sinh viên và thông tin về major cho client
      res.status(200).json({ students, major });
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
