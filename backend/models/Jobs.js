const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const jobSchema = new Schema(
  {
    title: String,
    description: String,
    location: String,
    recruiter: {
      type: Schema.Types.ObjectId,
      ref: "Recruiter",
    },
    applicants: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
