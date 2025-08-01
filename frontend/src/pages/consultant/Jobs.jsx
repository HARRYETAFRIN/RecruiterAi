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
  FiFolder,
  FiUpload,
  FiRefreshCw,
  FiFile,
  FiArchive,
} from "react-icons/fi";
import Header from "./Header";
import axios from "axios";

const Jobs = () => {
  const [jobs, setAllJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchingResults, setMatchingResults] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState("");

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
  }, []);


 const sendTopMatches = async () => {
   if (!selectedJob || matchingResults.length === 0 || isProcessing) return;

   try {
     setIsProcessing(true);
     setStatus("Saving candidates and sending email...");

     // Prepare candidate data
     const candidates = matchingResults.map((result) => ({
       name: result.name || result.filename.replace(/\.(pdf|docx)$/i, ""),
       email:
         result.email ||
         `${result.filename.replace(/\.(pdf|docx)$/i, "")}@candidate.com`,
       resume: result.filename,
       summary: result.summary || result.recommendation,
       skills: result.skills || [],
     }));

     // Send to backend - single API call
     await axios.post(
       "http://localhost:5000/api/recruiter/process-candidates",
       {
         jobId: selectedJob._id,
         candidates,
       }
     );

     // Send email to recruiter
     const topThree = getTopThreeStudents();
     await axios.post("http://localhost:5000/api/send-mail", {
       jobDescription: selectedJob.description,
       recruiterEmail: selectedJob.recruiter.email,
       jobTitle: selectedJob.title,
       students: topThree.map((result) => ({
         name: result.name || result.filename.replace(/\.(pdf|docx)$/i, ""),
         match_percentage: result.match_score,
         recommendation: result.recommendation,
         email:result.email
       })),
     });

     setStatus("Process completed successfully!");
     setCountdown(-1); // Set to -1 to prevent re-triggering
   } catch (error) {
     console.error("Processing error:", error);
     setError(error.response?.data?.error || "Failed to process candidates");
     setCountdown(-1);
   } finally {
     setIsProcessing(false);
   }
 };
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleMatchClick = (job) => {
    setSelectedJob(job);
    setMatchingResults([]);
    setShowResults(false);
    setIsModalOpen(true);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (
      (file && file.type === "application/zip") ||
      file.type === "application/x-zip-compressed"
    ) {
      setSelectedFile(file);
    } else {
      setError("Please select a valid ZIP file");
      setSelectedFile(null);
    }
  };

  const startResumeProcessing = async () => {
    if (!selectedFile || !selectedJob) {
      setError("Please select a ZIP file and a job first");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStatus("Starting resume processing...");

    try {
      const formData = new FormData();
      formData.append("zip_file", selectedFile);

      const parseResponse = await axios.post(
        "http://127.0.0.1:8000/api/parse-resumes-zip",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { job_id } = parseResponse.data;
      setJobId(job_id);
      setStatus("Resume parsing started...");

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
        `http://127.0.0.1:8000/api/status/${jobId}`
      );
      const { status, progress_percentage } = statusResponse.data;
      setStatus(status);
      setProgress(progress_percentage);

      if (status === "completed") {
        const { result_csv_path } = statusResponse.data;
        await matchResumesWithJob(jobId, result_csv_path);
      } else if (status === "failed") {
        setError("Resume parsing failed");
        setIsProcessing(false);
      } else {
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (err) {
      console.error("Status check error:", err);
      setError("Failed to check job status");
      setIsProcessing(false);
    }
  };

 const matchResumesWithJob = async (jobId, csvFilePath) => {
   try {
     setStatus("Matching resumes with job description...");

     const matchResponse = await axios.post(
       "http://127.0.0.1:8000/api/match-jobs",
       {
         csv_file_path: csvFilePath,
         job_description: selectedJob.description,
       }
     );

     setMatchingResults(matchResponse.data.results);
     setStatus("Matching completed");
     setShowResults(true);

     // Only start countdown if we're not already processing
     if (!isProcessing) {
       setCountdown(3);
     }
   } catch (err) {
     console.error("Matching error:", err);
     setError("Failed to match resumes with job description");
   } finally {
     setIsProcessing(false);
   }
 };

  // const sendTopMatches = async () => {
  //   if (!selectedJob || matchingResults.length === 0) return;

  //   try {
  //     const topThree = getTopThreeStudents();

  //     const payload = {
  //       recruiterEmail: selectedJob.recruiter.email,
  //       jobTitle: selectedJob.title,
  //       jobDescription: selectedJob.description,
  //       students: topThree.map((result) => ({
  //         id: result.filename.replace(".pdf", "").replace(".docx", ""),
  //         name: result.name || "Unknown",
  //         email: result.email || "no-email@example.com",
  //         match_percentage: result.match_score,
  //         recommendation: result.recommendation,
  //         resumeUrl: result.filename,
  //       })),
  //     };

  //     await axios.post("http://localhost:5000/api/send-mail", payload);
  //     setCountdown(-1);
  //   } catch (error) {
  //     console.error("Error sending matches:", error);
  //     setCountdown(-1);
  //   }
  // };

  const getTopThreeStudents = () => {
    return [...matchingResults]
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 3);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setShowResults(false);
    setMatchingResults([]);
    setSelectedFile(null);
  };

useEffect(() => {
  let timer;
  if (countdown > 0) {
    timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
  } else if (
    countdown === 0 &&
    showResults &&
    matchingResults.length > 0 &&
    !isProcessing
  ) {
    sendTopMatches();
  }
  return () => clearTimeout(timer);
}, [countdown, showResults, matchingResults, isProcessing]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Find Your <span className="text-indigo-600">Dream Job</span>
            </h1>
            <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
              Browse through our latest job openings from top companies
            </p>
          </div>

          {loading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

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

                    <div className="px-6 py-4">
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {job.description}
                      </p>

                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="mr-1.5" />
                        Posted on {formatDate(job.createdAt)}
                      </div>
                    </div>

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
                          Match Resumes
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
                  {showResults ? "Matching Results" : "Process Resumes"}
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
                      Upload Resumes ZIP:
                    </h4>
                    <div className="space-y-2">
                      <label className="block text-gray-700 font-medium">
                        Select ZIP File Containing Resumes
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors">
                          <FiArchive className="inline mr-2" />
                          Choose ZIP File
                          <input
                            type="file"
                            accept=".zip,application/zip,application/x-zip-compressed"
                            onChange={handleFileSelect}
                            className="hidden"
                            disabled={isProcessing}
                          />
                        </label>
                        {selectedFile && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FiFile className="mr-2" />
                            {selectedFile.name}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Please upload a ZIP file containing all resumes
                        (PDF/DOCX)
                      </p>
                    </div>
                  </div>

                  {isProcessing && (
                    <div className="space-y-3 mt-4">
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

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={startResumeProcessing}
                      disabled={isProcessing || !selectedFile}
                      className={`px-4 py-2 rounded-md text-white ${
                        isProcessing || !selectedFile
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-indigo-600 hover:bg-indigo-700"
                      } transition-colors flex items-center gap-2`}
                    >
                      {isProcessing ? (
                        <>
                          <FiRefreshCw className="animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FiUpload />
                          Process Resumes
                        </>
                      )}
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
                          key={result.filename}
                          className="border rounded-lg p-4 relative"
                        >
                          {index === 0 &&
                            result.match_score>0 &&(
                              <div className="absolute top-0 right-0 bg-yellow-400 text-white px-2 py-1 rounded-bl-lg rounded-tr-lg flex items-center -mt-5">
                                <FiAward className="mr-1" />
                                <span>Best Match</span>
                              </div>
                            )}
                          <h4 className="font-bold text-lg text-gray-900">
                            {result.name || result.filename}
                          </h4>
                          <div className="my-3">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div
                                className="bg-green-500 h-4 rounded-full"
                                style={{
                                  width: `${result.match_score}%`,
                                }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {result.match_score.toFixed(2)}% Match
                            </p>
                          </div>
                          <p className="text-gray-700 mb-2">
                            <span className="font-semibold">
                              Recommendation:
                            </span>{" "}
                            {result.recommendation}
                          </p>
                          {result.summary && (
                            <p className="text-sm text-gray-600 line-clamp-3">
                              {result.summary}
                            </p>
                          )}
                          {result.email && (
                            <p className="text-sm text-gray-600 mt-2">
                              <FiMail className="inline mr-1" />
                              {result.email}
                            </p>
                          )}
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
                        .sort((a, b) => b.match_score - a.match_score)
                        .map((result) => (
                          <div
                            key={result.filename}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-900">
                                  {result.name || result.filename}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {result.match_score.toFixed(2)}% Match
                                </p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  result.match_score >= 70
                                    ? "bg-green-100 text-green-800"
                                    : result.match_score >= 40
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {result.match_score >= 70
                                  ? "Strong Match"
                                  : result.match_score >= 40
                                  ? "Moderate Match"
                                  : "Weak Match"}
                              </span>
                            </div>
                            <div className="mt-2">
                              <p className="text-gray-700">
                                <span className="font-semibold">
                                  Recommendation:
                                </span>{" "}
                                {result.recommendation}
                              </p>
                            </div>
                            {result.summary && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600">
                                  {result.summary}
                                </p>
                              </div>
                            )}
                            {result.email && (
                              <p className="text-sm text-gray-600 mt-2">
                                <FiMail className="inline mr-1" />
                                {result.email}
                              </p>
                            )}
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
