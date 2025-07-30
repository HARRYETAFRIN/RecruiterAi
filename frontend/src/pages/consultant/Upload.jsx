import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUserPlus,
  FiX,
  FiUpload,
  FiUser,
  FiMail,
  FiFileText,
  FiTrash2,
  FiDownload,
  FiClock,
} from "react-icons/fi";
import axios from "axios";
import Header from "./Header";

const Upload = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    resume: null,
    resumeUrl: "",
    resumeSummary: null,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setError(null);

    try {
      const cloudinaryData = new FormData();
      cloudinaryData.append("file", file);
      cloudinaryData.append("upload_preset", "hg73yvrn");

      const cloudinaryResponse = await axios.post(
        `https://api.cloudinary.com/v1_1/didyxuyd5/upload`,
        cloudinaryData
      );

      const resumeUrl = cloudinaryResponse.data.secure_url;

      const resumeAnalysisData = new FormData();
      resumeAnalysisData.append("file", file);

      const resumeAnalysisResponse = await axios.post(
        "http://127.0.0.1:8000/api/resume/upload",
        resumeAnalysisData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      console.log(resumeAnalysisResponse?.data?.summary);

      setFormData((prev) => ({
        ...prev,
        resumeUrl,
        resumeSummary: resumeAnalysisResponse.data.summary.summary,
      }));

      setSuccess("Resume uploaded and analyzed successfully!");
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to process resume. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, resume: file }));
      handleFileUpload(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    setError(null);

    try {
      if (!formData.resumeUrl || !formData.resumeSummary) {
        throw new Error("Please upload a resume first");
      }

      const response = await axios.post(
        "http://localhost:5000/api/student/add",
        {
          name: formData.name,
          email: formData.email,
          resume: formData.resumeUrl,
          summary: formData.resumeSummary,
        }
      );

      console.log("Student added:", response.data);
      setSuccess("Student added successfully!");
      setFormData({
        name: "",
        email: "",
        resume: null,
        resumeUrl: "",
        resumeSummary: null,
      });
      setTimeout(() => {
        setIsModalOpen(false);
        getAllStudents();
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to add student"
      );
    } finally {
      setIsUploading(false);
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
          <FiUserPlus className="text-xl" />
          <span className="font-medium">Add Student</span>
        </motion.button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Resume
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Added On
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
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
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={student.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
                        >
                          <FiDownload className="mr-1" /> View Resume
                        </a>
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
                      No students found. Add your first student above.
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
              className="fixed inset-0  bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
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
                    <FiUserPlus />
                    Add New Student
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white hover:text-indigo-200 transition-colors"
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                    <label
                      htmlFor="name"
                      className="flex items-center gap-2 text-gray-700 font-medium"
                    >
                      <FiUser />
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Enter student's full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="flex items-center gap-2 text-gray-700 font-medium"
                    >
                      <FiMail />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                      placeholder="Enter student's email"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="resume"
                      className="flex items-center gap-2 text-gray-700 font-medium"
                    >
                      <FiFileText />
                      Resume (PDF/DOCX)
                    </label>
                    <div className="flex items-center gap-4">
                      <label
                        htmlFor="resume-upload"
                        className={`flex-1 cursor-pointer ${
                          isUploading ? "opacity-70 cursor-not-allowed" : ""
                        }`}
                      >
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 text-center transition-all ${
                            formData.resumeUrl
                              ? "border-green-500 bg-green-50"
                              : "border-gray-300 hover:border-indigo-400"
                          }`}
                        >
                          {isUploading ? (
                            <div className="flex items-center justify-center gap-2 text-gray-600">
                              <svg
                                className="animate-spin h-5 w-5 text-indigo-500"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                ></circle>
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                ></path>
                              </svg>
                              Uploading...
                            </div>
                          ) : formData.resumeUrl ? (
                            <div className="text-green-600 flex items-center justify-center gap-2">
                              <FiUpload />
                              Resume Uploaded!
                            </div>
                          ) : (
                            <div className="text-gray-600 flex items-center justify-center gap-2">
                              <FiUpload />
                              Click to upload resume
                            </div>
                          )}
                        </div>
                        <input
                          id="resume-upload"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileChange}
                          disabled={isUploading}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isUploading || !formData.resumeUrl}
                      className={`w-full ${
                        isUploading || !formData.resumeUrl
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-indigo-500 to-purple-600"
                      } text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all`}
                    >
                      {isUploading ? (
                        <span className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        "Add Student"
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Upload;
