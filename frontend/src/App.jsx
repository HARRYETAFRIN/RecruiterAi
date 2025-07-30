import React from 'react'
import {BrowserRouter , Routes , Route} from "react-router-dom"
import Home from './pages/Home'
import Login from './pages/Login';
import Signup from './pages/SignUp';
import CreateJob from './pages/recruiters/CreateJob';
import Upload from './pages/consultant/Upload';
import Jobs from './pages/consultant/Jobs';
import Dashboard from './pages/recruiters/Dashboard';
import CSVReader from './pages/Csv';

const App = () => {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/createJob" element={<CreateJob />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/csv" element={<CSVReader />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App
