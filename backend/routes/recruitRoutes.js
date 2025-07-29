const express = require("express");
const router = express.Router();
const recruiterController = require("../controllers/recruiterController");

// All routes use POST
router.post("/create-job", recruiterController.createJob);
router.post("/delete-job", recruiterController.deleteJob);
router.post("/update-job", recruiterController.updateJob);
router.post("/get-recruiter", recruiterController.getRecruiterById);
router.post("/add-student", recruiterController.addStudentToJob);

module.exports = router;
