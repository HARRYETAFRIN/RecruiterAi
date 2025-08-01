import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlusCircle,
  FiX,
  FiBriefcase,
  FiFileText,
  FiMapPin,
  FiTrash2,
  FiEdit,
  FiClock,
  FiUser,
} from "react-icons/fi";
import axios from "axios";
import Header from "./Header";

const CreateJob = () => {
  const data = JSON.parse(localStorage.getItem("rec"));
  const recruiterId = data?._id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
  });
  const [jobData, setJobData] = useState([]);
  const [editingJob, setEditingJob] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (!recruiterId) {
        throw new Error("Recruiter ID not found. Please login again.");
      }

      const jobData = {
        ...formData,
        recruiterId,
      };

      const endpoint = editingJob
        ? `http://localhost:5000/api/recruiter/update-job/${editingJob._id}`
        : "http://localhost:5000/api/recruiter/create-job";

      const response = await axios.post(endpoint, jobData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        editingJob ? "Job updated successfully:" : "Job created successfully:",
        response.data
      );
      setSuccess(
        editingJob ? "Job updated successfully!" : "Job created successfully!"
      );
      setIsModalOpen(false);
      setFormData({
        title: "",
        description: "",
        location: "",
      });
      setEditingJob(null);
      getRecruit();
    } catch (err) {
      console.error("Error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          (editingJob
            ? "Failed to update job."
            : "Failed to create job. Please try again.")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getRecruit = async () => {
    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/recruiter/get-recruiter",
        { recruiterId }
      );
      setJobData(data?.recruiter?.jobs || []);
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (jobId) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      try {
        await axios.post(
          `http://localhost:5000/api/recruiter/delete-job`,
          { recruiterId , jobId }
        );
       
        getRecruit();
      } catch (error) {
        setError(error.response?.data?.message || "Failed to delete job.");
      }
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      location: job.location,
    });
    setIsModalOpen(true);
  };

  useEffect(() => {
    getRecruit();
  }, []);

  return (
    <>
      <Header />
      <div className="p-4 max-w-6xl mx-auto">
        {/* Header and Create Job Button */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Your Job Listings
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingJob(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all"
          >
            <FiPlusCircle className="text-xl" />
            <span className="font-medium">Create Job</span>
          </motion.button>
        </div>

        {/* Jobs Grid */}
        {jobData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobData.map((job) => (
              <motion.div
                key={job._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {job.title}
                    </h3>
                   
                  </div>

                  <div className="flex items-center text-gray-600 mb-3">
                    <FiMapPin className="mr-2" />
                    <span>{job.location}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <FiClock className="mr-2" />
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>

                  <p className="text-gray-700 mb-6 line-clamp-3">
                    {job.description}
                  </p>

                  <div className="flex justify-end space-x-2">
                    {/* <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(job)}
                    className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FiEdit size={16} />
                    <span>Edit</span>
                  </motion.button> */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(job._id)}
                      className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 size={16} />
                      <span>Delete</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <FiBriefcase className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-600 mb-2">
              No Jobs Posted Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first job listing to attract candidates
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-lg shadow-md"
            >
              Create Your First Job
            </motion.button>
          </div>
        )}

        {/* Create/Edit Job Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 backdrop-blur-sm  bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => {
                setIsModalOpen(false);
                setEditingJob(null);
              }}
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <FiBriefcase />
                    {editingJob ? "Edit Job" : "Create New Job"}
                  </h2>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingJob(null);
                    }}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <FiX className="text-xl" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Error/Success Messages */}
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                      {error}
                    </div>
                  )}
                  {success && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                      {success}
                    </div>
                  )}

                  {/* Title Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="title"
                      className="flex items-center gap-2 text-gray-700 font-medium"
                    >
                      <FiBriefcase />
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter job title"
                    />
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="description"
                      className="flex items-center gap-2 text-gray-700 font-medium"
                    >
                      <FiFileText />
                      Job Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows="4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter job description"
                    />
                  </div>

                  {/* Location Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="location"
                      className="flex items-center gap-2 text-gray-700 font-medium"
                    >
                      <FiMapPin />
                      Location
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="Enter job location"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className={`w-full ${
                        isLoading
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600"
                      } text-white py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all`}
                    >
                      {isLoading ? (
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
                          {editingJob ? "Updating..." : "Creating..."}
                        </span>
                      ) : editingJob ? (
                        "Update Job"
                      ) : (
                        "Create Job"
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

export default CreateJob;
