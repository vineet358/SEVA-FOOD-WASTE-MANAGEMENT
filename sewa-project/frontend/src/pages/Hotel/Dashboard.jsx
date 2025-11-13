import React, { useState, useEffect, useCallback } from 'react';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from "socket.io-client";
import { 
  LayoutDashboard, 
  Plus, 
  History, 
  BarChart3, 
  User, 
  Menu, 
  X,
  TrendingUp,
  Users,
  Building,
  Calendar,
  Star,
  MessageCircle,
  ShieldAlert
} from 'lucide-react';
import axios from 'axios';
import '../../components/CSS/Hotel/Dashboard.css';
import AddDonation from "./AddDonation";
import MyDonations from "./MyDonations";
import Reports from "./Reports";
import RatingsReviews from "./RatingsReviews";
import ChatPanel from "../../components/chat/ChatPanel";


const HotelDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalDonations: 0,
    totalServings: 0,
    ngosServed: 0,
    peopleFed: 0,
    monthlyDonations: Array(12).fill(0),
    recentDonations: []
  });
  const [accountStatus, setAccountStatus] = useState(null);
  const hotelId = JSON.parse(localStorage.getItem('userInfo'))?.hotelId;
  const hotelName = JSON.parse(localStorage.getItem('userInfo'))?.hotelName || "UnknownHotel";
const fetchStatus = useCallback(async () => {
  if (!hotelId) return;
  try {
    const res = await axios.get(`http://localhost:5000/api/hotel/status/${hotelId}`);
    setAccountStatus(res.data.hotel);
  } catch (error) {
    console.error('Error fetching hotel status:', error);
  }
}, [hotelId]);

useEffect(() => {
  if (!hotelId) return;

  const newSocket = io("http://localhost:5000"); 

  newSocket.emit("register", { userId: hotelId });

  newSocket.on(`food-accepted-${hotelId}`, (data) => {
    toast.success(`Donation accepted by ${data.ngoName}!`);
  
    axios.get(`http://localhost:5000/api/hotel/${hotelName}/dashboard`)
      .then(res => setDashboardData(res.data))
      .catch(err => console.error(err));
  });
  newSocket.on(`pickup-confirmed-${hotelId}`, (data) => {
    console.log("Received pickup-confirmed event with data:", data);
    console.log("NGO Name from socket:", data.ngoName);
    toast.info(`Pickup confirmed by ${data.ngoName}!`);

    axios.get(`http://localhost:5000/api/hotel/${hotelName}/dashboard`)
      .then(res => setDashboardData(res.data))
      .catch(err => console.error(err));
  });

  const handleHotelStatusUpdate = (payload = {}) => {
    const { status, toastMessage } = payload;

    if (status === "blacklisted") {
      toast.error(toastMessage || "Your account has been blacklisted after admin review.");
    } else if (status === "under-review") {
      toast.warning(toastMessage || "A complaint was submitted by an NGO. Your account is under admin review.");
    } else if (status === "active") {
      toast.success(toastMessage || "Your account review is complete. You may continue donating.");
    }

    setAccountStatus(prev => ({
      ...(prev || {}),
      underReview: payload.underReview ?? prev?.underReview ?? false,
      underReviewReason: payload.underReviewReason ?? prev?.underReviewReason ?? null,
      isBlacklisted: payload.isBlacklisted ?? prev?.isBlacklisted ?? false,
      blacklistReason: payload.blacklistReason ?? prev?.blacklistReason ?? null,
      averageRating: payload.averageRating ?? prev?.averageRating,
      negativeFeedbackCount: payload.negativeFeedbackCount ?? prev?.negativeFeedbackCount,
    }));

    fetchStatus();
  };

  newSocket.on(`hotel-status-update-${hotelId}`, handleHotelStatusUpdate);

  return () => {
    newSocket.off(`food-accepted-${hotelId}`);
    newSocket.off(`pickup-confirmed-${hotelId}`);
    newSocket.off(`hotel-status-update-${hotelId}`, handleHotelStatusUpdate);
    newSocket.disconnect();
  };
}, [hotelId,hotelName, fetchStatus]);

useEffect(() => {
  if (!hotelId) return;
  fetchStatus();
}, [hotelId, fetchStatus]);

  

  useEffect(() => {
    setSidebarOpen(false);

    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/hotel/${hotelName}/dashboard`);
        setDashboardData(res.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, [hotelName]);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'donate', label: 'Donate Food', icon: Plus },
    { id: 'history', label: 'Donation History', icon: History },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'ratings', label: 'Ratings & Reviews', icon: Star },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderDashboardOverview = () => (
    <div className="dashboard-content">
      {accountStatus?.underReview && !accountStatus?.isBlacklisted && (
        <div className="status-banner under-review">
          <ShieldAlert size={24} />
          <div>
            <h3>Account Under Review</h3>
            <p>{accountStatus?.underReviewReason || 'An NGO complaint is being reviewed. Admin will contact you after verification.'}</p>
          </div>
        </div>
      )}
      {accountStatus?.isBlacklisted && (
        <div className="status-banner blacklisted">
          <ShieldAlert size={24} />
          <div>
            <h3>Account Blacklisted</h3>
            <p>{accountStatus?.blacklistReason || 'Admin has restricted donations while a complaint is being investigated.'}</p>
          </div>
        </div>
      )}
      <div className="dashboard-header">
        <h1>Hotel Dashboard</h1>
        <p>Manage your food donations and track your community impact</p>
      </div>

      <div className="guidelines-grid">
        <div className="guidelines-card">
          <h3>Success Rate Explained</h3>
          <ul>
            <li><strong>Pickup reliability</strong> measures how many donations reach pickup confirmation.</li>
            <li><strong>Rating weight</strong> is your average rating divided by 5. Low ratings immediately reduce the score.</li>
            <li><strong>Final success rate</strong> = pickup reliability × rating weight. Example: 90% pickups × 60% rating weight = 54% success.</li>
          </ul>
        </div>
        <div className="guidelines-card">
          <h3>Top Contributor Rules</h3>
          <ul>
            <li>Maintain a success rate of at least 75%.</li>
            <li>Keep an average rating of 4.2★ or higher with verified NGO reviews.</li>
            <li>Complete 8 or more confirmed pickups to qualify and retain the badge.</li>
            <li>Missed pickups or repeated low ratings immediately impact your leaderboard position.</li>
          </ul>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon donations">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <h3>{dashboardData.totalDonations}</h3>
            <p>Total Donations</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon servings">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <h3>{dashboardData.totalServings.toLocaleString()}</h3>
            <p>Total Servings</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon ngos">
            <Building size={24} />
          </div>
          <div className="stat-content">
            <h3>{dashboardData.ngosServed}</h3>
            <p>NGOs Served</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon people">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <h3>{dashboardData.peopleFed.toLocaleString()}</h3>
            <p>People Fed</p>
          </div>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card recent-activity">
          <h3>Recent Donations</h3>
          <div className="activity-list">
            {dashboardData.recentDonations.map((donation) => (
              <div key={donation.id} className="activity-item">
                <div className="activity-info">
                  <p className="activity-title">Donation #{donation.id}</p>
                  <p className="activity-details">{donation.quantity} servings • {donation.ngo}</p>
                </div>
                <div className="activity-meta">
                  <span className={`status ${donation.status.toLowerCase().replace(' ', '-')}`}>
                    {donation.status}
                  </span>
                  <span className="activity-date">{new Date(donation.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {dashboardData.recentDonations.length === 0 && <p>No recent donations</p>}
          </div>
        </div>

        <div className="dashboard-card quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => setActiveTab('donate')}
            >
              <Plus size={20} />
              New Donation
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => setActiveTab('history')}
            >
              <History size={20} />
              View History
            </button>
            <button 
              className="action-btn secondary"
              onClick={() => setActiveTab('reports')}
            >
              <BarChart3 size={20} />
              View Reports
            </button>
           

          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboardOverview();
      case 'donate': return <AddDonation accountStatus={accountStatus} />;
      case 'history': return <MyDonations />;
      case 'chat': return <ChatPanel userType="hotel" />;
      case 'ratings': return <RatingsReviews />;
      case 'reports': return <Reports />;
      default: return renderDashboardOverview();
    }
  };

  return (
    <div className="hotel-dashboard">
      <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Building size={32} />
            <span>SEWA Hotel</span>
          </div>
          <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
          <button className="sidebar-close" onClick={handleSidebarToggle}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
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

      <div className="main-content">
        <div className="topbar">
          <button className="menu-toggle" onClick={handleSidebarToggle}>
            <Menu size={24} />
          </button>
          <div className="topbar-actions">
            <div className="user-profile">
            <div className="user-avatar">{hotelName[0].toUpperCase() }</div>
              <span>{hotelName}</span>

            </div>
          </div>
        </div>

        <div className="content-area">
          {renderContent()}
        </div>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={handleSidebarToggle}></div>
      )}
    </div>
    
  );
};

export default HotelDashboard;