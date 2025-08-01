import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiFolder,
  FiX,
  FiUser,
  FiTrash2,
  FiClock,
  FiDownload,
  FiRefreshCw,
} from "react-icons/fi";
import axios from "axios";
import Header from "./Header";

const Upload = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [jobId, setJobId] = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [results, setResults] = useState([]);

  const getAllStudents = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/student/all");
      setAllStudents(data?.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      setError("Failed to fetch students");
    }
  };

  useEffect(() => {
    getAllStudents();
  }, []);

  const handleFolderSelect = async (e) => {
    const files = e.target.files;
    if (files.length === 0) return;

    // In a real app, you would upload the files to a server first
    // For this example, we'll just use the local path
    const path = files[0].path; // Electron-only property
    const folderPath = path.substring(0, path.lastIndexOf("\\"));
    setFolderPath(folderPath);
  };

  const startResumeParsing = async () => {
    if (!folderPath) {
      setError("Please select a folder first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Start resume parsing
      const parseResponse = await axios.post(
        "http://127.0.0.1:8001/api/parse-resumes",
        { folder_path: folderPath }
      );

      const { job_id } = parseResponse.data;
      setJobId(job_id);
      setStatus("Resume parsing started...");

      // Step 2: Poll for status
      await pollJobStatus(job_id);
    } catch (err) {
      console.error("Error:", err);
      setError(err.response?.data?.message || "Failed to process resumes");
      setIsProcessing(false);
    }
  };

  const pollJobStatus = async (jobId) => {
    try {
      const statusResponse = await axios.get(
        `http://127.0.0.1:8001/api/status/${jobId}`
      );

      const { status, progress_percentage } = statusResponse.data;
      setStatus(status);
      setProgress(progress_percentage);

      if (status === "completed") {
        const { result_csv_path } = statusResponse.data;
        await matchJobsWithDescription(jobId, result_csv_path);
      } else if (status === "failed") {
        setError("Resume parsing failed");
        setIsProcessing(false);
      } else {
        // Continue polling every 2 seconds
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (err) {
      console.error("Status check error:", err);
      setError("Failed to check job status");
      setIsProcessing(false);
    }
  };

  const matchJobsWithDescription = async (jobId, csvFilePath) => {
    if (!jobDescription) {
      setError("Please enter a job description");
      setIsProcessing(false);
      return;
    }

    try {
      setStatus("Matching resumes with job description...");

      const matchResponse = await axios.post(
        "http://127.0.0.1:8001/api/match-jobs",
        {
          csv_file_path: csvFilePath,
          job_description: jobDescription,
        }
      );

      setResults(matchResponse.data.results);
      setStatus("Matching completed");
      setSuccess("Resumes processed successfully!");

      // Save matched candidates to DB
      await saveMatchedCandidates(matchResponse.data.results);
    } catch (err) {
      console.error("Matching error:", err);
      setError("Failed to match resumes with job description");
    } finally {
      setIsProcessing(false);
    }
  };

  const saveMatchedCandidates = async (candidates) => {
    try {
      const validCandidates = candidates.filter(
        (c) => c.status === "success" && c.email
      );

      for (const candidate of validCandidates) {
        await axios.post("http://localhost:5000/api/student/add", {
          name: candidate.name || "Unknown",
          email: candidate.email,
          resume: candidate.filename,
          summary: candidate.summary || "No summary available",
          matchScore: candidate.match_score,
          recommendation: candidate.recommendation,
        });
      }

      getAllStudents();
    } catch (err) {
      console.error("Error saving candidates:", err);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;

    setIsDeleting(true);
    try {
      await axios.post(`http://localhost:5000/api/student/delete`, {
        studentId,
      });
      getAllStudents();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <>
      <Header />
      <div className="p-6 max-w-7xl mx-auto">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-5 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all mb-8"
        >
          <FiFolder className="text-xl" />
          <span className="font-medium">Process Resumes</span>
        </motion.button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added On
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allStudents.length > 0 ? (
                  allStudents.map((student) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <FiUser className="text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.recommendation}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <div
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.matchScore > 75
                                ? "bg-green-100 text-green-800"
                                : student.matchScore > 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {student.matchScore}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 flex items-center">
                          <FiClock className="mr-1.5 text-gray-400" />
                          {formatDate(student.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(student._id)}
                          disabled={isDeleting}
                          className="text-red-600 hover:text-red-900 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                          <FiTrash2 />
                        </motion.button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No students found. Process resumes to add candidates.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setIsModalOpen(false)}
            >
              <motion.div
                initial={{ y: -50, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 50, scale: 0.95 }}
                className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-5 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiFolder />
                    Process Resumes
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white hover:text-indigo-200 transition-colors"
                    disabled={isProcessing}
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>

                <div className="p-6 space-y-5">
                  {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
                      {success}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">
                      Select Folder Containing Resumes
                    </label>
                    <input
                      type="file"
                      webkitdirectory="true"
                      directory="true"
                      onChange={handleFolderSelect}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    />
                    {folderPath && (
                      <div className="text-sm text-gray-600 mt-1">
                        Selected: {folderPath}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-700 font-medium">
                      Job Description
                    </label>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all h-32"
                      placeholder="Enter the job description to match against..."
                    />
                  </div>

                  {isProcessing && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">
                        {status}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-indigo-600 h-2.5 rounded-full"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        {progress}% complete
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={startResumeParsing}
                      disabled={isProcessing || !folderPath}
                      className={`w-full ${
                        isProcessing || !folderPath
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-500 to-purple-600"
                      } text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2`}
                    >
                      {isProcessing ? (
                        <>
                          <FiRefreshCw className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Process Resumes"
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Upload;
