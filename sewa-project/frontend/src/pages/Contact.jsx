
// Contact.jsx
import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import '../components/CSS/Contact.css'
import sewa from '../assets/sewa.png';
const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
  
    const mailtoLink = `mailto:vp1246194@gmail.com?subject=Contact from ${formData.name}&body=Name: ${formData.name}%0D%0AEmail: ${formData.email}%0D%0A%0D%0AMessage:%0D%0A${formData.message}`;
    
    window.location.href = mailtoLink;
    
    setStatus('Redirecting to your email client...');
    
    // Reset form after a delay
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        message: ''
      });
      setStatus('');
    }, 2000);
  };

  return (
    <div className="contact-page">
    <div className="contact-container">
      {/* SEWA Logo */}
      {/* SEWA Logo */}
      <div className="top-left-logo">
        <img src={sewa} alt="SEWA Logo" className="logo-img" style={{background: 'transparent'}} />
      </div>
  
    
      
  

        {/* Header */}
        <div className="contact-header">
          <h1 className="contact-title">Get in touch</h1>
          <p className="contact-subtitle">
            We are here for you! How can we help?
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="contact-content-grid">
          {/* Left Side - Contact Form */}
          <div className="contact-form-section">
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name" className="form-label">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message" className="form-label">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Tell us how we can help you..."
                  rows="6"
                  required
                ></textarea>
              </div>

              <button type="submit" className="submit-btn">
                <Send className="submit-icon" />
                Submit
              </button>

              {status && <p className="form-status">{status}</p>}
            </form>
          </div>

          {/* Right Side - Contact Info & Illustration */}
          <div className="contact-info-section">
            <div className="contact-illustration">
              <div className="illustration-bg">
                <div className="phone-mockup">
                  <div className="phone-screen">
                    <div className="phone-header">CONTACT US</div>
                    <div className="phone-avatar">
                      <div className="avatar-circle"></div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Icons */}
                <div className="float-icon float-icon-1">
                  <Phone />
                </div>
                <div className="float-icon float-icon-2">
                  <Mail />
                </div>
                <div className="float-icon float-icon-3">
                  <MapPin />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="contact-details">
              <div className="contact-detail-item">
                <div className="detail-icon">
                  <MapPin />
                </div>
                <div className="detail-text">
                  <h3>Address</h3>
                  <p>Haldwani,Uttarakhand, India</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="detail-icon">
                  <Phone />
                </div>
                <div className="detail-text">
                  <h3>Phone</h3>
                  <p>+91 XXX XXX XXXX</p>
                </div>
              </div>

              <div className="contact-detail-item">
                <div className="detail-icon">
                  <Mail />
                </div>
                <div className="detail-text">
                  <h3>Email</h3>
                  <p>vineetpande200@gmail.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Background Decorations */}
        <div className="contact-bg-decoration contact-bg-decoration-1"></div>
        <div className="contact-bg-decoration contact-bg-decoration-2"></div>
      </div>
    </div>
  );
};

export default Contact;