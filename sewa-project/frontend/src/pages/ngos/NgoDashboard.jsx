import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Heart, 
  Users, 
  BarChart3, 
  User, 
  Menu, 
  X,
  CheckCircle,
  Building,
  MessageCircle,
  Star
} from 'lucide-react';
import '../../components/CSS/ngos/NgoDashboard.css';
import AcceptedDonations from "./AcceptedDonations";
import FoodRequests from "./FoodRequests";
import Reports from "./Reports";
import SubmitFeedback from "./SubmitFeedback";
import ChatPanel from "../../components/chat/ChatPanel";
import axios from 'axios';

const NgoDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalDonations: 0,
    totalRequests: 0,
    totalDistributions: 0,
    peopleServed: 0,
  });

  // Fetch from localStorage
  const ngoInfo = JSON.parse(localStorage.getItem('userInfo'));
  const ngoId = JSON.parse(localStorage.getItem('userInfo'))?.ngoId;
  const ngoName = ngoInfo?.ngoName || 'Unknown NGO';

  useEffect(() => {
    setSidebarOpen(false); 
    if (ngoId) fetchDashboardData();
  }, [ngoId]);

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/food/ngo/history/${ngoId}`);
      const donations = res.data;

      const totalDonations = donations.length;
      const totalDistributions = donations.filter(d => d.status === 'taken' || d.status === 'distributed').length;
      const peopleServed = donations.reduce((sum, d) => sum + (d.servesPeople || 0), 0);

      setDashboardData({
        totalDonations,
        totalRequests: 0, 
        totalDistributions,
        peopleServed,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'donations', label: 'Accepted Donations', icon: Heart },
    { id: 'requests', label: 'Food Requests', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'feedback', label: 'Submit Feedback', icon: Star },
    { id: 'analytics', label: 'Reports', icon: BarChart3 }
  ];

  const handleSidebarToggle = () => setSidebarOpen(!sidebarOpen);


  const renderDashboardOverview = () => (
    <div className="ngo-dashboard-content">
      <div className="ngo-dashboard-header">
        <h1>NGO Dashboard</h1>
        <p>Manage food donations, requests, and track your community impact</p>
      </div>

      <div className="ngo-guidelines-card">
        <h3>How NGO rankings work</h3>
        <ul>
          <li><strong>Activity score</strong> = (accepted donations × 2) + (confirmed pickups × 3) + reviews submitted.</li>
          <li>Confirm pickups promptly with  OTP to earn the higher pickup multiplier.</li>
          <li>Submit feedback with clear photos for 1★–2★ ratings; missing evidence reduces partner trust.</li>
          <li>Regular reviews keep hotels transparent and improve your visibility in the top NGO list.</li>
        </ul>
      </div>

      <div className="ngo-stats-grid">
        <div className="ngo-stat-card">
          <div className="ngo-stat-icon donations">
            <Heart size={24} />
          </div>
          <div className="ngo-stat-content">
            <h3>{dashboardData.totalDonations}</h3>
            <p>Accepted Donations</p>
          </div>
        </div>
        
        <div className="ngo-stat-card">
          <div className="ngo-stat-icon requests">
            <Users size={24} />
          </div>
          <div className="ngo-stat-content">
            <h3>{dashboardData.totalRequests}</h3>
            <p>Food Requests</p>
          </div>
        </div>
        
        <div className="ngo-stat-card">
          <div className="ngo-stat-icon distributions">
            <CheckCircle size={24} />
          </div>
          <div className="ngo-stat-content">
            <h3>{dashboardData.totalDistributions}</h3>
            <p>Distributions</p>
          </div>
        </div>
        
        <div className="ngo-stat-card">
          <div className="ngo-stat-icon people">
            <Building size={24} />
          </div>
          <div className="ngo-stat-content">
            <h3>{dashboardData.peopleServed.toLocaleString()}</h3>
            <p>People Served</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardOverview();
      case 'donations': return <AcceptedDonations />;
      case 'requests': return <FoodRequests />;
      case 'chat': return <ChatPanel userType="ngo" />;
      case 'feedback': return <SubmitFeedback />;
      case 'analytics': return <Reports />;
      default: return renderDashboardOverview();
    }
  };

  return (
    <div className="ngo-dashboard">
      <div className={`ngo-sidebar ${sidebarOpen ? 'ngo-sidebar-open' : ''}`}>
        <div className="ngo-sidebar-header">
          <div className="ngo-logo">
            <Heart size={32} />
            <span>SEWA NGO</span>
          </div>
          <button className="ngo-sidebar-close" onClick={handleSidebarToggle}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="ngo-sidebar-nav">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                className={`ngo-nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
              >
                <IconComponent size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="ngo-main-content">
        <div className="ngo-topbar">
          <button className="ngo-menu-toggle" onClick={handleSidebarToggle}>
            <Menu size={24} />
          </button>
          <div className="ngo-topbar-actions">
            <div className="ngo-user-profile">
              <div className="ngo-user-avatar">{ngoName[0].toUpperCase() }</div>
              <span>{ngoName}</span>
            </div>
          </div>
        </div>

        <div className="ngo-content-area">
          {renderContent()}
        </div>
      </div>

      {sidebarOpen && (
        <div className="ngo-sidebar-overlay" onClick={handleSidebarToggle}></div>
      )}
    </div>
  );
};

export default NgoDashboard;
