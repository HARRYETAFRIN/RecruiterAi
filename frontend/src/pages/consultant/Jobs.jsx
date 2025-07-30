import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiBriefcase,
  FiMapPin,
  FiUser,
  FiMail,
  FiClock,
  FiDollarSign,
  FiBookmark,
  FiShare2,
  FiX,
  FiCheck,
  FiAward,
} from "react-icons/fi";
import Header from "./Header";
import axios from "axios";

const Jobs = () => {
  const [jobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchingResults, setMatchingResults] = useState([]);
  const [isMatching, setIsMatching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [countdown, setCountdown] = useState(0);


const sendTopMatches = async () => {
  if (!selectedJob || matchingResults.length === 0) return;

  try {
    const topThree = getTopThreeStudents();

    const payload = {
      recruiterEmail: selectedJob.recruiter.email,
      jobTitle: selectedJob.title,
      jobDescription: selectedJob.description,
      students: topThree.map((result) => ({
        id: result.student._id,
        name: result.student.name,
        email: result.student.email,
        match_percentage: result.matchData.match_percentage,
        recommendation: result.matchData.recommendation,
        resumeUrl: result.student.resume,
      })),
    };

    // Send email with top matches
    await axios.post("http://localhost:5000/api/send-mail", payload);

    // Add students to the job - sending as array
    await axios.post("http://localhost:5000/api/recruiter/add-student", {
      jobId: selectedJob._id,
      studentIds: topThree.map((result) => result.student._id), // Changed to studentIds (plural)
    });

    // Reset countdown
    setCountdown(-1);
  } catch (error) {
    console.error("Error sending matches:", error);
    setCountdown(-1);
  }
};
  const getAllStudents = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/student/all");
      setAllStudents(data?.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    }
  };

  const getAllJobs = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(
        "http://localhost:5000/api/recruiter/allJobs"
      );
      setAllJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllJobs();
    getAllStudents();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMatchClick = (job) => {
    setSelectedJob(job);
    setSelectedStudents([]);
    setMatchingResults([]);
    setShowResults(false);
    setIsModalOpen(true);
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

const handleMatchStudents = async () => {
  if (!selectedJob || selectedStudents.length === 0) return;

  setIsMatching(true);
  const results = [];

  for (const studentId of selectedStudents) {
    const student = allStudents.find((s) => s._id === studentId);
    if (!student) continue;

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/job/match", {
        resume_summary: student.summary || "No summary provided",
        job_description: selectedJob.description,
      });

      results.push({
        student,
        matchData: response.data,
      });
    } catch (error) {
      console.error("Error matching student:", error);
      results.push({
        student,
        matchData: {
          match_percentage: 0,
          recommendation: "Error processing match",
        },
      });
    }
  }

  setMatchingResults(results);
  setIsMatching(false);
  setShowResults(true);

  // Start countdown for automatic email sending
  setCountdown(3);
};

  const getTopThreeStudents = () => {
    return [...matchingResults]
      .sort(
        (a, b) => b.matchData.match_percentage - a.matchData.match_percentage
      )
      .slice(0, 3);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowResults(false);
    setMatchingResults([]);
    setSelectedStudents([]);
  };
useEffect(() => {
  if (countdown > 0) {
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  } else if (countdown === 0 && showResults && matchingResults.length > 0) {
    sendTopMatches();
  }
}, [countdown, showResults, matchingResults]);
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Find Your <span className="text-indigo-600">Dream Job</span>
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Browse through our latest job openings from top companies
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Jobs List */}
          {!loading && !error && (
            <div className="grid gap-8 lg:grid-cols-2">
              {jobs.length > 0 ? (
                jobs.map((job) => (
                  <motion.div
                    key={job._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200 hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Job Header */}
                    <div className="px-6 py-5 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                            <FiBriefcase className="h-6 w-6 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              {job.title}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <FiMapPin className="mr-1.5" />
                              {job.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="px-6 py-4">
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          Full-time
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Remote Possible
                        </span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Senior Level
                        </span>
                      </div>

                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="mr-1.5" />
                        Posted on {formatDate(job.createdAt)}
                      </div>
                    </div>

                    {/* Recruiter Info */}
                    <div className="px-6 py-4 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FiUser className="h-5 w-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <h4 className="text-sm font-medium text-gray-900">
                              Posted by {job.recruiter.name}
                            </h4>
                            <p className="text-sm text-gray-500 flex items-center">
                              <FiMail className="mr-1.5" />
                              {job.recruiter.email}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleMatchClick(job)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Match Students
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12">
                  <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No jobs available
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    There are currently no job openings. Please check back
                    later.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Matching Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {showResults ? "Matching Results" : "Select Students"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              {!showResults ? (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Job: {selectedJob?.title}
                    </h3>
                    <p className="text-gray-600">{selectedJob?.description}</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-gray-900">
                      Select Students to Match:
                    </h4>
                    {allStudents.length > 0 ? (
                      allStudents.map((student) => (
                        <div
                          key={student._id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {student.name}
                            </h4>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {student.summary || "No summary available"}
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleStudentSelect(student._id)}
                            className="h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No students available</p>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={handleMatchStudents}
                      disabled={selectedStudents.length === 0 || isMatching}
                      className={`px-4 py-2 rounded-md text-white ${
                        selectedStudents.length === 0
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      } transition-colors`}
                    >
                      {isMatching ? "Matching..." : "Match Students"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  
                  {countdown > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg flex items-center">
                      <FiClock className="mr-2" />
                      <span>
                        Sending top matches to recruiter in {countdown}{" "}
                        seconds...
                      </span>
                    </div>
                  )}

                  {countdown === 0 && (
                    <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-lg flex items-center">
                      <FiClock className="mr-2" />
                      <span>Sending email now...</span>
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Top 3 Matches
                    </h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      {getTopThreeStudents().map((result, index) => (
                        <div
                          key={result.student._id}
                          className="border rounded-lg p-4 relative"
                        >
                          {index === 0 && (
                            <div className="absolute top-0 right-0 bg-yellow-400 text-white px-2 py-1 rounded-bl-lg rounded-tr-lg flex items-center -mt-5">
                              <FiAward className="mr-1" />
                              <span>Best Match</span>
                            </div>
                          )}
                          <h4 className="font-bold text-lg text-gray-900">
                            {result.student.name}
                          </h4>
                          <div className="my-3">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div
                                className="bg-green-500 h-4 rounded-full"
                                style={{
                                  width: `${result.matchData.match_percentage}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {result.matchData.match_percentage.toFixed(2)}%
                              Match
                            </p>
                          </div>
                          <p className="text-gray-700 mb-2">
                            <span className="font-semibold">
                              Recommendation:
                            </span>{" "}
                            {result.matchData.recommendation}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {result.student.summary}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      All Results
                    </h3>
                    <div className="space-y-4">
                      {matchingResults
                        .sort(
                          (a, b) =>
                            b.matchData.match_percentage -
                            a.matchData.match_percentage
                        )
                        .map((result) => (
                          <div
                            key={result.student._id}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {result.student.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {result.matchData.match_percentage.toFixed(2)}
                                  % Match
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  result.matchData.match_percentage >= 70
                                    ? "bg-green-100 text-green-800"
                                    : result.matchData.match_percentage >= 40
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {result.matchData.match_percentage >= 70
                                  ? "Strong Match"
                                  : result.matchData.match_percentage >= 40
                                  ? "Moderate Match"
                                  : "Weak Match"}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="text-gray-700">
                                <span className="font-semibold">
                                  Recommendation:
                                </span>{" "}
                                {result.matchData.recommendation}
                              </p>
                            </div>
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                {result.student.summary}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default Jobs;
