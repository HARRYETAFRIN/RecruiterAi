import React from "react";
import { motion } from "framer-motion";
import {
  FiArrowRight,
  FiMail,
  FiUpload,
  FiAward,
  FiUsers,
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiShield,
} from "react-icons/fi";
import { FaLinkedin, FaTwitter, FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen overflow-x-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold text-blue-600"
          >
            RecruitAI
          </motion.div>
          <div className="hidden md:flex space-x-8">
            {["Features", "How It Works", "Pricing", "Contact"].map(
              (item, index) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(" ", "-")}`}
                  className="text-gray-700 hover:text-blue-600 transition-colors"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  {item}
                </motion.a>
              )
            )}
          </div>
          <Link to="/login"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2 mb-10 md:mb-0"
          >
            <h1 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight mb-6">
              Revolutionizing Recruitment with{" "}
              <span className="text-blue-600">AI</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Our platform matches the perfect candidates to your job
              descriptions using advanced machine learning, saving you time and
              effort.
            </p>
            <div className="flex space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                Try It Free
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="border border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition-all"
              >
                Learn More
              </motion.button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="md:w-1/2"
          >
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
              <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
              <div className="absolute top-20 left-20 w-64 h-64 bg-pink-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
              <div className="relative bg-white p-8 rounded-2xl shadow-2xl border border-gray-100">
                <div className="flex items-center mb-6">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <FiMail className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      New Matches Found
                    </h3>
                    <p className="text-gray-500 text-sm">
                      3 perfect candidates for your role
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <motion.div
                      key={item}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center p-4 bg-gray-50 rounded-lg cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">
                        {item}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">
                          Candidate #{item}
                        </h4>
                        <p className="text-gray-500 text-sm">
                          Match score: {95 - item * 5}%
                        </p>
                      </div>
                      <FiArrowRight className="text-gray-400" />
                    </motion.div>
                  ))}
                </div>
                <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Send to Recruiter
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform is designed to streamline the recruitment process
              with cutting-edge technology.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <FiUpload className="text-3xl text-blue-600" />,
                title: "Easy JD Submission",
                description:
                  "Recruiters can easily post job descriptions with our intuitive interface.",
              },
              {
                icon: <FiUsers className="text-3xl text-blue-600" />,
                title: "CV Upload",
                description:
                  "Consultants upload student CVs which are processed by our advanced system.",
              },
              {
                icon: <FiBarChart2 className="text-3xl text-blue-600" />,
                title: "AI Matching",
                description:
                  "Our ML algorithm analyzes and ranks candidates for the perfect fit.",
              },
              {
                icon: <FiAward className="text-3xl text-blue-600" />,
                title: "Top 3 Selection",
                description:
                  "Get the best 3 candidates automatically selected for each role.",
              },
              {
                icon: <FiMail className="text-3xl text-blue-600" />,
                title: "Automated Emails",
                description:
                  "Selected candidates are automatically sent to recruiters via Nodemailer.",
              },
              {
                icon: <FiShield className="text-3xl text-blue-600" />,
                title: "Secure Platform",
                description:
                  "All data is encrypted and securely stored following industry standards.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to find the perfect candidates for your open
              positions.
            </p>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-gray-200"></div>

            <div className="space-y-12 md:space-y-0">
              {[
                {
                  icon: <FiUpload className="text-2xl" />,
                  title: "Post Job Description",
                  description:
                    "Recruiters create and post detailed job descriptions for open positions.",
                  side: "left",
                },
                {
                  icon: <FiUsers className="text-2xl" />,
                  title: "Upload Candidate CVs",
                  description:
                    "Consultants upload student CVs that match the job categories.",
                  side: "right",
                },
                {
                  icon: <FiBarChart2 className="text-2xl" />,
                  title: "AI Matching Process",
                  description:
                    "Our ML algorithm analyzes and ranks candidates based on the JD requirements.",
                  side: "left",
                },
                {
                  icon: <FiAward className="text-2xl" />,
                  title: "Receive Top 3 Candidates",
                  description:
                    "The system automatically selects the top 3 most suitable candidates.",
                  side: "right",
                },
                {
                  icon: <FiMail className="text-2xl" />,
                  title: "Automatic Email Delivery",
                  description:
                    "Candidate profiles are sent directly to the recruiter's email via Nodemailer.",
                  side: "left",
                },
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`flex flex-col md:flex-row items-center ${
                    step.side === "left" ? "md:flex-row" : "md:flex-row-reverse"
                  } justify-between`}
                >
                  <div
                    className={`md:w-5/12 mb-6 md:mb-0 ${
                      step.side === "left" ? "md:pr-8" : "md:pl-8"
                    }`}
                  >
                    <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center text-blue-600 mb-4">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.description}</p>
                  </div>
                  <div className="md:w-5/12 bg-white p-6 rounded-xl shadow-md border border-gray-100">
                    <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center text-gray-400">
                      Step {index + 1} Visualization
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose Our Platform
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              The benefits of using our AI-powered recruitment solution
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <FiClock className="text-3xl" />,
                title: "Save Time",
                description:
                  "Reduce hours of manual screening with our automated matching system.",
              },
              {
                icon: <FiCheckCircle className="text-3xl" />,
                title: "Better Matches",
                description:
                  "Our AI finds candidates you might miss with traditional methods.",
              },
              {
                icon: <FiUsers className="text-3xl" />,
                title: "Improved Efficiency",
                description:
                  "Streamline your entire recruitment workflow in one platform.",
              },
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-blue-700 p-8 rounded-xl hover:bg-blue-800 transition-all"
              >
                <div className="bg-blue-800 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                <p className="text-blue-100">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 text-white shadow-xl"
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="md:w-2/3 mb-8 md:mb-0">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  Ready to Transform Your Recruitment Process?
                </h2>
                <p className="text-blue-100 text-lg">
                  Join hundreds of recruiters who are already saving time and
                  finding better candidates with our platform.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Get Started Now
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold mb-4">RecruitAI</h3>
              <p className="text-gray-400 max-w-md">
                The smart way to connect recruiters with the perfect candidates
                using advanced machine learning technology.
              </p>
              <div className="flex space-x-4 mt-6">
                {[FaLinkedin, FaTwitter, FaGithub].map((Icon, index) => (
                  <motion.a
                    key={index}
                    href="#"
                    whileHover={{ y: -3 }}
                    className="bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                  >
                    <Icon className="text-lg" />
                  </motion.a>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold mb-4">Product</h4>
                <ul className="space-y-2">
                  {["Features", "Pricing", "Case Studies", "Updates"].map(
                    (item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {item}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Company</h4>
                <ul className="space-y-2">
                  {["About", "Careers", "Blog", "Press"].map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold mb-4">Support</h4>
                <ul className="space-y-2">
                  {["Help Center", "Contact", "Privacy", "Terms"].map(
                    (item) => (
                      <li key={item}>
                        <a
                          href="#"
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          {item}
                        </a>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} RecruitAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
