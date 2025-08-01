const Student = require("../models/Student");

// POST: Add a student
exports.addStudent = async (req, res) => {
  try {
    const { name, email, resume , summary } = req.body;
    console.log(summary);
    const student = new Student({ name, email, resume ,summary });
    await student.save();

    res.status(201).json({ message: "Student added successfully", student });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Delete a student by ID
exports.deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    const student = await Student.findByIdAndDelete(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json({ message: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST: Get all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json({ students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
