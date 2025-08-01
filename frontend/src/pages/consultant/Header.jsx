import { Link } from "react-router-dom";
import { FiUserPlus, FiUsers, FiLogOut } from "react-icons/fi";

const Header = () => {
  const handleLogout = () => {
    // Logout logic
    localStorage.removeItem("rec");
    window.location.href = "/login";
  };

  return (
    <header className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              Recruit <span className="text-indigo-600">AI</span>
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-6">
            {/* <Link
              to="/upload"
              className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <FiUserPlus className="mr-1.5" />
              <span className="font-medium">Add Student</span>
            </Link> */}

            <Link
              to="/jobs"
              className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <FiUsers className="mr-1.5" />
              <span className="font-medium">Match</span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-indigo-600 transition-colors"
            >
              <FiLogOut className="mr-1.5" />
              <span className="font-medium">Logout</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
