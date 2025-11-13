import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import AuthSystem from './components/Auth/AuthSystem';
import HotelDashboard from './pages/Hotel/Dashboard';
import NgoDashboard from './pages/ngos/NgoDashboard';
import AdminPanel from './pages/AdminPanel';
import Header from './Header';
import About from './pages/About.jsx';

import Contact from './pages/Contact.jsx';


function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />

          {/* Role-based login using AuthSystem */}
          <Route path="/auth/individual" element={<AuthSystem initialUserType="individual" />} />
          <Route path="/auth/ngo" element={<AuthSystem initialUserType="ngo" />} />
          <Route path="/auth/hotel" element={<AuthSystem initialUserType="hotel" />} />

          
          <Route path="/about" element={<About />} />
          <Route path="/contact Us" element ={<Contact />} />
          <Route path="/hotel" element={<HotelDashboard />} />
          <Route path="/ngo" element={<NgoDashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;