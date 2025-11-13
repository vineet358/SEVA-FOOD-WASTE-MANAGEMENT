import './components/CSS/Header.css';

import background2 from './assets/food.jpg';
import background3 from './assets/food4.jpeg';
import background1 from './assets/home-background-2.jpeg';
import { useState, useEffect } from 'react';
import { Link } from "react-router-dom"; 


const Header = ({ section }) => {
  const curTab = section ?? "Home";
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleErrorClose = () => {
    if (error) setError(null);
  };

  const toggleDropdown = () => {
    setDropdownOpen(prev => !prev);
  };


  const images = [background1, background2, background3];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {error && (
        <>
          <div className="toast-overlay" onClick={handleErrorClose} />
          <div className="toast-message error" onClick={handleErrorClose}>{error}</div>
        </>
      )}

      <div className="hero-section">
        {/* Slideshow Image */}
        <img
          className="home-background"
          src={images[currentIndex]}
          alt="SEWA Background"
          style={{ transition: "opacity 1s ease-in-out" }}
        />

        <div className="header">
          <div className="right-section">
            <nav className="navbar">
              {["Home", "About","Contact Us"].map(tab => (
                <a
                  key={tab}
                  className={curTab === tab ? "active" : ""}
                  href={`/${tab.toLowerCase()}`}
                >
                  {tab}
                </a>
              ))}

              <div className="login-dropdown">
                <button onClick={toggleDropdown} className="dropdown-btn">
                  Login
                </button>
                {dropdownOpen && (
                 <div className="dropdown-content">
          
                 <Link to="/auth/hotel">Login as Hotel</Link>
                 <Link to="/auth/ngo">Login as NGO</Link>
               </div>
               
                )}
              </div>
            </nav>
          </div>
        </div>

        {curTab === "Home" && (
          <>
            <p className="Slogan" style={{ fontSize: "90px" }}>Together We Can Help</p>
            <p className="Slogan" style={{ color: "#ED0707", fontSize: "90px", lineHeight: "1", marginBottom: "15px" }}>Those in Need</p>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;
