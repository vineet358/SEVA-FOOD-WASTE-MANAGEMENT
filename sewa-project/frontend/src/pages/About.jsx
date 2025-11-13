// About.jsx
import React from 'react';
import { Users, Building, Heart } from 'lucide-react';
import './About.css';
import food4 from '../assets/food4.jpeg';
import food5 from '../assets/food5.png';
import food6 from '../assets/food6.png';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();
  
  const handleJoinClick = () => {
    navigate('/auth/ngo');
  };

  const handleSupportCause = () => {
    window.location.href =
      "mailto:vineetpande200@gmail.com?subject=I%20want%20to%20support%20SEWA&body=Hi%20SEWA%20team,%20I%20would%20love%20to%20support%20your%20mission.%20Please%20let%20me%20know%20how%20I%20can%20help.";
  };

  return (
    <div className="about-page">
      <div className="about-container">
        {/* Header Section */}
        <div className="about-header">
          <h1 className="about-title">About Us</h1>
          <h2 className="about-subtitle">
            Safe, comprehensive and fast platform
          </h2>
          
          <div className="about-content-grid">
            {/* Text Content */}
            <div className="about-text-content">
              <p className="about-description">
                The world's food industry is changing from an opaque, traditional and centralized 
                state to a transparent, technology-based and decentralized one. We at SEWA believe 
                that with the advent of modern technology, the fourth industrial revolution is taking 
                place and we should seek to create a fundamental and key role in this transformation.
              </p>
              <p className="about-description">
                SEWA bridges the gap between abundance and need by connecting hotels and restaurants 
                with local NGOs to reduce food waste while feeding those who need it most. Our mission 
                is to create sustainable food distribution networks that transform surplus meals into 
                hope for communities across the region.
              </p>
            </div>

            {/* Hero Image */}
            <div className="about-hero-image-wrapper">
              <div className="about-hero-image">
                <img 
                  src={food5}
                  alt="SEWA team distributing meals to community"
                  className="hero-img"
                />
              </div>
              
              {/* Decorative Floating Elements */}
              <div className="float-element float-1"></div>
              <div className="float-element float-2"></div>
            </div>
          </div>
        </div>

        {/* Photos Section */}
        <div className="about-photos-grid">
          <div className="photo-card">
            <img 
              src={food4}
              alt="Volunteers serving meals to children in the community"
              className="about-photo"
            />
          </div>
          <div className="photo-card">
            <img 
              src={food6}
              alt="Food distribution van serving meals to women"
              className="about-photo"
            />
          </div>
        </div>

        {/* Stats Section */}
        <div className="about-stats">
          {/* Meals Served */}
          <div className="stat-card">
            <p className="stat-label">Meals Served</p>
            <div className="stat-content">
              <Heart className="stat-icon" />
              <p className="stat-number">12,000+</p>
            </div>
          </div>

          {/* Partnered Hotels */}
          <div className="stat-card stat-border">
            <p className="stat-label">Partnered Hotels</p>
            <div className="stat-content">
              <Building className="stat-icon" />
              <p className="stat-number">50+</p>
            </div>
          </div>

          {/* Communities Helped */}
          <div className="stat-card">
            <p className="stat-label">Communities Helped</p>
            <div className="stat-content">
              <Users className="stat-icon" />
              <p className="stat-number">20+</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="about-cta">
          <button 
            onClick={handleJoinClick}
            className="cta-btn cta-primary"
          >
            Join Our Mission
          </button>
          <button 
            onClick={handleSupportCause}
            className="cta-btn cta-secondary"
          >
            Support Our Cause
          </button>
        </div>

        {/* Background Decorative Elements */}
        <div className="bg-decoration bg-decoration-1"></div>
        <div className="bg-decoration bg-decoration-2"></div>
      </div>
    </div>
  );
};

export default About;