import { useState } from "react";
import { motion } from "framer-motion";
import {
  FaUserTie,
  FaChalkboardTeacher,
  FaLock,
  FaEnvelope,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("recruiter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (role == "consultant"){
      navigate("/upload")
      return
    }
      try {
        const response = await axios.post(
          `http://localhost:5000/api/recruiter/login`,
          {
            email,
            password,
          }
        );

        if (response.data.success) {
          localStorage.setItem("rec", JSON.stringify(response.data.recruiter));
          navigate("/createJob")
        } else {
          setError(response.data.message || "Login failed");
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "An error occurred during login"
        );
      } finally {
        setLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
      >
        <div className="bg-indigo-600 py-6 px-8 text-center">
          <h1 className="text-3xl font-bold text-white">RecruitAI</h1>
          <p className="text-indigo-100 mt-2">Login to your account</p>
        </div>

        <div className="p-8">
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <div className="flex justify-center space-x-4 mb-6">
                <button
                  type="button"
                  onClick={() => setRole("recruiter")}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                    role === "recruiter"
                      ? "bg-indigo-100 text-indigo-700 shadow-md"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <FaUserTie className="mr-2" />
                  Recruiter
                </button>
                <button
                  type="button"
                  onClick={() => setRole("consultant")}
                  className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                    role === "consultant"
                      ? "bg-indigo-100 text-indigo-700 shadow-md"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  <FaChalkboardTeacher className="mr-2" />
                  Consultant
                </button>
              </div>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="Email address"
                  required
                />
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="Password"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition duration-300 flex items-center justify-center"
            >
              {loading ? (
                <>
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
                </>
              ) : (
                "Login"
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="text-indigo-600 hover:text-indigo-800 font-medium transition"
              >
                Sign up
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
