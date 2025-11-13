import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  LogOut,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import './AdminPanel.css';
import AdminAnalytics from './AdminAnalytics';

const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [pendingRegistrations, setPendingRegistrations] = useState({ 
    ngos: [], 
    hotels: [], 
    total: 0 
  });
  const [activeTab, setActiveTab] = useState('analytics');
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsLoggedIn(true);
      setActiveTab('analytics');
      fetchPendingRegistrations();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/admin/login', loginData);
      localStorage.setItem('adminToken', response.data.token);
      setIsLoggedIn(true);
      setActiveTab('analytics');
      fetchPendingRegistrations();
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRegistrations = async () => {
    setFetchingData(true);
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('No admin token found');
        setPendingRegistrations({ ngos: [], hotels: [], total: 0 });
        setFetchingData(false);
        return;
      }

      const response = await axios.get('http://localhost:5000/api/admin/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingRegistrations({
        ngos: response.data.pendingNgos || [],
        hotels: response.data.pendingHotels || [],
        total: response.data.total || 0
      });
    } catch (err) {
      console.error('Error fetching pending registrations:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
        localStorage.removeItem('adminToken');
        setIsLoggedIn(false);
      }
      setPendingRegistrations({ ngos: [], hotels: [], total: 0 });
    } finally {
      setFetchingData(false);
    }
  };

  const handleVerification = async (type, id, action) => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.patch(
        `http://localhost:5000/api/admin/verify/${type}/${id}`,
        { action },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccess(response.data.message);
      fetchPendingRegistrations();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setPendingRegistrations({ ngos: [], hotels: [], total: 0 });
  };

  const downloadLicense = (licensePath) => {
    if (licensePath) {
      window.open(`http://localhost:5000/${licensePath}`, '_blank');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <h1>Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>SEWA Admin Panel</h1>
        <div className="header-actions">
          <div className="tab-buttons">
            <button 
              className={`tab-btn ${activeTab === 'registrations' ? 'active' : ''}`}
              onClick={() => setActiveTab('registrations')}
            >
              <Users size={18} />
              Registrations
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={18} />
              Performance Analytics
            </button>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      {activeTab === 'analytics' ? (
        <AdminAnalytics />
      ) : (
      <div className="admin-content">
        <div className="admin-stats">
          <div className="stat-card">
            <Users size={24} />
            <div>
              <h3>{fetchingData ? '...' : (pendingRegistrations.ngos?.length || 0)}</h3>
              <p>Pending NGOs</p>
            </div>
          </div>
          <div className="stat-card">
            <Building size={24} />
            <div>
              <h3>{fetchingData ? '...' : (pendingRegistrations.hotels?.length || 0)}</h3>
              <p>Pending Hotels</p>
            </div>
          </div>
          <div className="stat-card">
            <RefreshCw size={24} />
            <div>
              <h3>{fetchingData ? '...' : ((pendingRegistrations.ngos?.length || 0) + (pendingRegistrations.hotels?.length || 0))}</h3>
              <p>Total Pending</p>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="registrations-section">
          <h2>Pending NGO Registrations</h2>
          {fetchingData ? (
            <p className="no-data">Loading...</p>
          ) : (pendingRegistrations.ngos?.length || 0) === 0 ? (
            <p className="no-data">No pending NGO registrations</p>
          ) : (
            <div className="registrations-grid">
              {(pendingRegistrations.ngos || []).map((ngo) => (
                <div key={ngo._id} className="registration-card">
                  <div className="card-header">
                    <h3>{ngo.organizationName}</h3>
                    <span className="status pending">Pending</span>
                  </div>
                  <div className="card-content">
                    <p><strong>Contact Person:</strong> {ngo.contactPerson}</p>
                    <p><strong>Email:</strong> {ngo.email}</p>
                    <p><strong>Phone:</strong> {ngo.phone}</p>
                    <p><strong>License No:</strong> {ngo.licenseNumber}</p>
                    <p><strong>Address:</strong> {ngo.address}</p>
                  </div>
                  <div className="card-actions">
                    <button onClick={() => downloadLicense(ngo.licenseDocument)} className="license-btn">
                      <Download size={16} />
                      View License
                    </button>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleVerification('ngo', ngo._id, 'verify')}
                        className="verify-btn"
                        disabled={loading}
                      >
                        <CheckCircle size={16} />
                        Verify
                      </button>
                      <button 
                        onClick={() => handleVerification('ngo', ngo._id, 'reject')}
                        className="reject-btn"
                        disabled={loading}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="registrations-section">
          <h2>Pending Hotel Registrations</h2>
          {fetchingData ? (
            <p className="no-data">Loading...</p>
          ) : (pendingRegistrations.hotels?.length || 0) === 0 ? (
            <p className="no-data">No pending hotel registrations</p>
          ) : (
            <div className="registrations-grid">
              {(pendingRegistrations.hotels || []).map((hotel) => (
                <div key={hotel._id} className="registration-card">
                  <div className="card-header">
                    <h3>{hotel.hotelName}</h3>
                    <span className="status pending">Pending</span>
                  </div>
                  <div className="card-content">
                    <p><strong>Manager:</strong> {hotel.managerName}</p>
                    <p><strong>Email:</strong> {hotel.email}</p>
                    <p><strong>Phone:</strong> {hotel.phone}</p>
                    <p><strong>License No:</strong> {hotel.licenseNumber}</p>
                    <p><strong>Address:</strong> {hotel.address}</p>
                  </div>
                  <div className="card-actions">
                    <button 
                      onClick={() => downloadLicense(hotel.licenseDocument)} 
                      className="license-btn"
                    >
                      <Eye size={16} />
                      View License
                    </button>
                    <div className="action-buttons">
                      <button 
                        onClick={() => handleVerification('hotel', hotel._id, 'verify')}
                        className="verify-btn"
                        disabled={loading}
                      >
                        <CheckCircle size={16} />
                        Verify
                      </button>
                      <button 
                        onClick={() => handleVerification('hotel', hotel._id, 'reject')}
                        className="reject-btn"
                        disabled={loading}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default AdminPanel;

