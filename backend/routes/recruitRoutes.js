const express = require("express");
const router = express.Router();
const recruiterController = require("../controllers/recruiterController");

// All routes use POST
router.post("/create-job", recruiterController.createJob);
router.post("/delete-job", recruiterController.deleteJob);
router.post("/update-job", recruiterController.updateJob);
router.post("/get-recruiter", recruiterController.getRecruiterById);
router.post("/add-student", recruiterController.addStudentToJob);
router.post("/signup", recruiterController.signupRecruiter);
router.post("/login", recruiterController.loginRecruiter);
router.post("/login", recruiterController.loginRecruiter);
router.get("/allJobs", recruiterController.getALLJobs);
router.post("/process-candidates", recruiterController.processCandidates);

module.exports = router;
