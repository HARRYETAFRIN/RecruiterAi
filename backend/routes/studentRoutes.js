const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");

// All routes are POST-based
router.post("/add", studentController.addStudent);
router.post("/delete", studentController.deleteStudent);
router.get("/all", studentController.getAllStudents);

module.exports = router;
