const Recruiter = require("../models/Recruiter");
const Job = require("../models/Jobs");
const Student = require("../models/Student");

// POST: Create Job
exports.createJob = async (req, res) => {
  try {
    const { recruiterId, title, description, location } = req.body;

    const job = new Job({
      title,
      description,
      location,
      recruiter: recruiterId,
    });
    await job.save();

    await Recruiter.findByIdAndUpdate(recruiterId, {
      $push: { jobs: job._id },
    });

    res.status(201).json({ message: "Job created successfully", job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Delete specific job
exports.deleteJob = async (req, res) => {
  try {
    const { recruiterId, jobId } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.recruiter.toString() !== recruiterId) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this job" });
    }

    await Job.findByIdAndDelete(jobId);
    await Recruiter.findByIdAndUpdate(recruiterId, {
      $pull: { jobs: jobId },
    });

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Update job
exports.updateJob = async (req, res) => {
  try {
    const { recruiterId, jobId, title, description, location } = req.body;

    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.recruiter.toString() !== recruiterId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this job" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { title, description, location },
      { new: true }
    );

    res.json({ message: "Job updated successfully", job: updatedJob });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Get recruiter by ID
exports.getRecruiterById = async (req, res) => {
  try {
    const { recruiterId } = req.body;

    const recruiter = await Recruiter.findById(recruiterId).populate("jobs");
    if (!recruiter)
      return res.status(404).json({ message: "Recruiter not found" });

    res.json({ recruiter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.addStudentToJob = async (req, res) => {
  try {
    const { jobId, studentId } = req.body;

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Add to job if not already present
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $addToSet: { applicants: studentId } }, // prevents duplicate entries
      { new: true }
    ).populate("applicants");

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({ message: "Student added to job successfully", job: updatedJob });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
