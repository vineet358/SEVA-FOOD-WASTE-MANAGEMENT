import React from 'react';
import Header from '../Header';
import '../components/CSS/Home.css';

const Home = () => {
  return (
    <div>
      <Header />
      <div className="sewa-container">
        <h1 className="sewa-title">SEWA FOOD PORTAL</h1>
        <h2 className="sewa-subtitle">India&apos;s Platform for Food Sharing & Waste Reduction</h2>
        <hr className="divider-sewa" />
        <p className="sewa-description">
          Managed by SEWA, this portal connects hotels, restaurants, and individuals with NGOs and people in need to ensure surplus food is shared safely and efficiently.
        </p>
        <p className="sewa-description">
          From food pickup to delivery, we ensure rapid distribution and proper food safety measures to reduce waste and hunger.
        </p>
        <p className="sewa-highlight">
          Together with you, we fight food waste and strengthen community well-being—helping those in need.
        </p>
      </div>
      <section className="why-sewa-section">
        <div className="content">
          <h2>Why Food Donation Matters?</h2>
          <hr className="divider-sewa" style={{ backgroundColor: "white", marginBottom:"30px" }}/>
          <p>
            Millions of meals go to waste every day in India, while countless people face hunger. By donating surplus food, we can save resources, reduce environmental impact, and feed those in need.
          </p>
          <p>
            Our platform enables hotels, restaurants, and individuals to easily donate safe food, verified by NGOs, ensuring it reaches beneficiaries quickly and efficiently.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;