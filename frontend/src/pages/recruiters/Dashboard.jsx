import React, { useEffect, useState } from "react";
import {
  FiBriefcase,
  FiUsers,
  FiMail,
  FiFileText,
  FiAward,
  FiMapPin,
  FiClock,
} from "react-icons/fi";
import Header from "./Header";
import axios from "axios";

const Dashboard = () => {
  const data = JSON.parse(localStorage.getItem("rec"));
  const recruiterId = data?._id;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const getRecruit = async () => {
    try {
      setLoading(true);
      const { data } = await axios.post(
        "http://localhost:5000/api/recruiter/get-recruiter",
        { recruiterId }
      );
      setJobs(data?.recruiter?.jobs || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRecruit();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Recruiter Dashboard
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Manage your job postings and applicants
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
                <FiBriefcase className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-500">
                  Total Jobs
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {jobs.length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FiUsers className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-500">
                  Total Applicants
                </h3>
                <p className="text-2xl font-semibold text-gray-900">
                  {jobs.reduce((acc, job) => acc + job.applicants.length, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <FiAward className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-500">Top Job</h3>
                <p className="text-xl font-semibold text-gray-900 truncate">
                  {jobs[0]?.title || "No jobs posted"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-8">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job._id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Job Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        {job.title}
                      </h2>
                      <div className="mt-2 flex items-center text-indigo-100">
                        <FiMapPin className="mr-2" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    <div className="bg-white text-indigo-600 px-3 py-1 rounded-full text-sm font-medium">
                      {job.applicants.length} Applicants
                    </div>
                  </div>
                </div>

                {/* Job Details */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <p className="text-gray-700 mb-4">{job.description}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <FiClock className="mr-2" />
                    <span>Posted on {formatDate(job.createdAt)}</span>
                  </div>
                </div>

                {/* Applicants Section */}
                <div className="bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FiUsers className="mr-2" /> Applicants
                  </h3>

                  {job.applicants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.applicants.map((applicant) => (
                        <div
                          key={applicant._id}
                          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-600 font-medium">
                                {applicant.name.charAt(0)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <h4 className="font-bold text-gray-900">
                                {applicant.name}
                              </h4>
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <FiMail className="mr-1.5" />
                                <a
                                  href={`mailto:${applicant.email}`}
                                  className="hover:text-indigo-600"
                                >
                                  {applicant.email}
                                </a>
                              </div>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                                {applicant.summary}
                              </p>
                              <div className="mt-3 flex space-x-2">
                                <a
                                  href={applicant.resume}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                  <FiFileText className="mr-1" /> View Resume
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No applicants yet</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden text-center py-12">
              <FiBriefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">
                No jobs posted
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by posting your first job opening.
              </p>
              <div className="mt-6">
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                  Post a Job
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
