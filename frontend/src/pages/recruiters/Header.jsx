import { Link } from "react-router-dom";
import { FiBriefcase, FiPieChart, FiLogOut } from "react-icons/fi";

const Header = () => {
  const handleLogout = () => {
    // Add your logout logic here
    localStorage.removeItem("rec");
    window.location.href = "/login";
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-xl font-bold text-indigo-600">
              <span className="bg-indigo-100 px-3 py-1 rounded-lg">
                Recruit AI
              </span>
            </h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex space-x-8">
            <Link
              to="/createJob"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
            >
              <FiBriefcase className="mr-2" />
              Post Job
            </Link>

            <Link
              to="/dashboard"
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
            >
              <FiPieChart className="mr-2" />
              Dashboard
            </Link>

            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors"
            >
              <FiLogOut className="mr-2" />
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
