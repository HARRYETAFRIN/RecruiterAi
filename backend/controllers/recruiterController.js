const Recruiter = require("../models/Recruiter");
const Job = require("../models/Jobs");
const Student = require("../models/Student");


exports.signupRecruiter = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if recruiter already exists
    const existingRecruiter = await Recruiter.findOne({ email });
    if (existingRecruiter) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Save recruiter with plain password
    const newRecruiter = new Recruiter({
      name,
      email,
      password,
    });

    await newRecruiter.save();

    res
      .status(201)
      .json({
        message: "Recruiter registered successfully",
        recruiter: newRecruiter,
        success:true
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Recruiter Login
exports.loginRecruiter = async (req, res) => {
  try {
    const { email, password } = req.body;

    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    if (recruiter.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({ message: "Login successful", recruiter , success:true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


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

    const recruiter = await Recruiter.findById(recruiterId).populate({
      path: "jobs",
      populate: {
        path: "applicants",
        model: "Student", // Make sure this matches your Student model name
      },
    });

    if (!recruiter) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    res.json({ recruiter });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getALLJobs = async(req,res)=>{
  try {
    const jobs = await Job.find().populate("recruiter")
    return res.status(200).json(jobs);

  } catch (error) {
     res.status(500).json({ error: error.message });
  }
}


exports.processCandidates = async (req, res) => {
  try {
    const { jobId, candidates } = req.body;

    // Validate input
    if (!jobId || !Array.isArray(candidates)) {
      return res.status(400).json({ 
        message: "jobId and candidates array are required" 
      });
    }

    // Check if job exists
    const jobExists = await Job.exists({ _id: jobId });
    if (!jobExists) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Process candidates
    const processedCandidates = await Promise.all(
      candidates.map(async (candidate) => {
        // Create or find existing student
        let student = await Student.findOne({ email: candidate.email });
        
        if (!student) {
          student = new Student({
            name: candidate.name,
            email: candidate.email,
            resume: candidate.resume,
            summary: candidate.summary,
            skills: candidate.skills || []
          });
          await student.save();
        }

        return student._id;
      })
    );

    // Add candidates to job
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $addToSet: { applicants: { $each: processedCandidates } }},
      { new: true }
    ).populate("applicants");

    res.status(201).json({
      success: true,
      message: "Candidates processed successfully",
      job: updatedJob,
      addedCount: processedCandidates.length
    });

  } catch (error) {
    console.error("Error processing candidates:", error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

exports.addStudentToJob = async (req, res) => {
  try {
    const { jobId, studentIds } = req.body;

    // Validate input
    if (!Array.isArray(studentIds)) {
      return res.status(400).json({ message: "studentIds should be an array" });
    }

    // Check if all students exist
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      const foundIds = students.map((s) => s._id.toString());
      const missingIds = studentIds.filter((id) => !foundIds.includes(id));
      return res.status(404).json({
        message: "Some students not found",
        missingStudents: missingIds,
      });
    }

    // Add all students to the job (using $addToSet to prevent duplicates)
    const updatedJob = await Job.findByIdAndUpdate(
      jobId,
      { $addToSet: { applicants: { $each: studentIds } } }, // Add all IDs at once
      { new: true }
    ).populate("applicants");

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.json({
      message: "Students added to job successfully",
      job: updatedJob,
      addedCount: studentIds.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
