import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  TrendingUp, 
  Award, 
  Ban, 
  Star, 
  Building, 
  Users, 
  MessageSquare,
  Activity,
  AlertTriangle,
  ShieldAlert,
  CheckCircle,
  BarChart3,
  RefreshCw,
  X
} from 'lucide-react';
import { io } from 'socket.io-client';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [topHotels, setTopHotels] = useState([]);
  const [topNgos, setTopNgos] = useState([]);
  const [blacklistedHotels, setBlacklistedHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [hotelDetail, setHotelDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [complaintError, setComplaintError] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  const adminToken = localStorage.getItem('adminToken');

  const refreshComplaintData = useCallback(async () => {
    try {
      setComplaintsLoading(true);
      const headers = { Authorization: `Bearer ${adminToken}` };
      const [complaintsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/complaints', { headers }),
        axios.get('http://localhost:5000/api/admin/dashboard-stats', { headers }),
      ]);
      setComplaints(complaintsRes.data.complaints || []);
      setDashboardStats(statsRes.data.stats);
      setComplaintError('');
    } catch (error) {
      console.error('Error refreshing complaints:', error);
      setComplaintError(error.response?.data?.message || 'Unable to refresh complaints.');
    } finally {
      setComplaintsLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    fetchAllAnalytics();
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:5000');
    socket.on('connect', () => {
      socket.emit('register', { userId: 'admin' });
    });
    socket.on('admin-complaint-created', refreshComplaintData);
    socket.on('admin-complaint-updated', refreshComplaintData);
    return () => {
      socket.off('admin-complaint-created', refreshComplaintData);
      socket.off('admin-complaint-updated', refreshComplaintData);
      socket.disconnect();
    };
  }, [refreshComplaintData]);

  const fetchAllAnalytics = async () => {
    setLoading(true);
    setComplaintsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };

      const [statsRes, hotelsRes, ngosRes, blacklistRes, complaintsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/dashboard-stats', { headers }),
        axios.get('http://localhost:5000/api/admin/top-hotels?limit=10', { headers }),
        axios.get('http://localhost:5000/api/admin/top-ngos?limit=10', { headers }),
        axios.get('http://localhost:5000/api/admin/blacklisted-hotels', { headers }),
        axios.get('http://localhost:5000/api/complaints', { headers }),
      ]);

      setDashboardStats(statsRes.data.stats);
      setTopHotels(hotelsRes.data.topHotels);
      setTopNgos(ngosRes.data.topNgos);
      setBlacklistedHotels(blacklistRes.data.blacklistedHotels);
      setComplaints(complaintsRes.data.complaints || []);
      setComplaintError('');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      alert('Failed to load analytics. Please try again.');
      setComplaintError(error.response?.data?.message || 'Unable to load complaints.');
    } finally {
      setLoading(false);
      setComplaintsLoading(false);
    }
  };

  const openComplaintModal = (complaint) => {
    setSelectedComplaint(complaint);
    setAdminNote('');
    setComplaintModalOpen(true);
  };

  const closeComplaintModal = () => {
    setComplaintModalOpen(false);
    setSelectedComplaint(null);
    setAdminNote('');
  };

  const decideComplaint = async (complaint, action, note = '') => {
    if (!complaint) return;
    if (!['verified', 'rejected'].includes(action)) return;
    try {
      setDecisionLoading(true);
      const headers = { Authorization: `Bearer ${adminToken}` };
      await axios.patch(
        `http://localhost:5000/api/complaints/${complaint._id}/decision`,
        { action, note },
        { headers }
      );
      alert(`Complaint ${action === 'verified' ? 'marked genuine' : 'rejected'} successfully.`);
      if (selectedComplaint?._id === complaint._id) {
        closeComplaintModal();
      }
      await refreshComplaintData();
    } catch (error) {
      console.error('Error updating complaint:', error);
      alert(error.response?.data?.message || 'Failed to update complaint status.');
    } finally {
      setDecisionLoading(false);
    }
  };

  const handleComplaintDecision = async (action) => {
    await decideComplaint(selectedComplaint, action, adminNote);
  };

  const handleQuickDecision = async (complaint, action) => {
    const note = window.prompt('Optional admin note for this decision?', '');
    await decideComplaint(complaint, action, note || '');
  };

  const handleReviewAction = async (hotelId, action, options = {}) => {
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const payload = { action };
      let reason = options.reason || '';

      if (options.prompt) {
        const input = window.prompt(options.prompt, options.defaultValue || '');
        if (input === null) return; // cancelled
        reason = input.trim();
      }

      if (reason) {
        payload.reason = reason;
      }

      await axios.patch(`http://localhost:5000/api/admin/blacklist/${hotelId}`, payload, { headers });
      fetchAllAnalytics();
      if (hotelDetail?.hotel?._id === hotelId) {
        fetchHotelDetail(hotelId);
      }
      alert(options.successMessage || 'Status updated successfully.');
    } catch (error) {
      console.error('Error updating hotel status:', error);
      alert(error.response?.data?.message || 'Failed to update hotel status.');
    }
  };

  const fetchHotelDetail = async (hotelIdRaw) => {
    const hotelId = hotelIdRaw;
    if (!hotelId) {
      setDetailError('Hotel identifier missing.');
      return;
    }
    setDetailLoading(true);
    setDetailError('');
    try {
      const headers = { Authorization: `Bearer ${adminToken}` };
      const res = await axios.get(`http://localhost:5000/api/admin/hotel/${hotelId}/detail`, { headers });
      setHotelDetail(res.data);
    } catch (error) {
      console.error('Error fetching hotel detail:', error);
      setDetailError(error.response?.data?.message || 'Unable to load hotel history. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleUnblacklistHotel = async (hotelId, hotelName) => {
    if (!confirm(`Are you sure you want to remove ${hotelName} from blacklist?`)) return;
    await handleReviewAction(hotelId, 'unblacklist', { successMessage: `${hotelName} has been removed from the blacklist.` });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < Math.round(rating) ? '#fbbf24' : 'none'}
        color={i < Math.round(rating) ? '#fbbf24' : '#cbd5e1'}
      />
    ));
  };

  const safePercent = (value, digits = 0) => {
    const num = Number(value);
    if (Number.isFinite(num)) {
      return num.toFixed(digits);
    }
    return (0).toFixed(digits);
  };

  const complaintSummary = dashboardStats?.complaintsSummary || {};

  if (loading) {
    return (
      <div className="admin-analytics">
        <div className="loading-container">
          <RefreshCw size={48} className="spin" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-analytics">
      <div className="analytics-header">
        <h1> Performance Dashboard</h1>
        <p>Real-time insights and analytics</p>
        <button className="refresh-btn" onClick={fetchAllAnalytics}>
          <RefreshCw size={18} />
          Refresh
        </button>
      </div>

      <div className="section-nav">
        <button
          className={`nav-btn ${activeSection === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveSection('overview')}
        >
          <BarChart3 size={20} />
          Overview
        </button>
        <button
          className={`nav-btn ${activeSection === 'hotels' ? 'active' : ''}`}
          onClick={() => setActiveSection('hotels')}
        >
          <Award size={20} />
          Top Hotels
        </button>
        <button
          className={`nav-btn ${activeSection === 'ngos' ? 'active' : ''}`}
          onClick={() => setActiveSection('ngos')}
        >
          <Users size={20} />
          Top NGOs
        </button>
        <button
          className={`nav-btn ${activeSection === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveSection('complaints')}
        >
          <ShieldAlert size={20} />
          Complaints
        </button>
        <button
          className={`nav-btn ${activeSection === 'blacklist' ? 'active' : ''}`}
          onClick={() => setActiveSection('blacklist')}
        >
          <Ban size={20} />
          Blacklisted ({blacklistedHotels.length})
        </button>
      </div>

      {activeSection === 'overview' && dashboardStats && (
        <div className="overview-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe' }}>
                <Building size={28} color="#3b82f6" />
              </div>
              <div className="stat-content">
                <h3>{dashboardStats.totalHotels}</h3>
                <p>Total Hotels</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                <Users size={28} color="#10b981" />
              </div>
              <div className="stat-content">
                <h3>{dashboardStats.totalNgos}</h3>
                <p>Total NGOs</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7' }}>
                <Activity size={28} color="#f59e0b" />
              </div>
              <div className="stat-content">
                <h3>{dashboardStats.totalDonations}</h3>
                <p>Total Donations</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0e7ff' }}>
                <MessageSquare size={28} color="#6366f1" />
              </div>
              <div className="stat-content">
                <h3>{dashboardStats.totalReviews}</h3>
                <p>Total Reviews</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fce7f3' }}>
                <TrendingUp size={28} color="#ec4899" />
              </div>
              <div className="stat-content">
                <h3>{safePercent(dashboardStats.successRate, 1)}%</h3>
                <p>Success Rate</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fff7ed' }}>
                <Star size={28} color="#f97316" />
              </div>
              <div className="stat-content">
                <h3>{dashboardStats.averageHotelRating.toFixed(2)}</h3>
                <p>Avg Hotel Rating</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dcfce7' }}>
                <CheckCircle size={28} color="#059669" />
              </div>
              <div className="stat-content">
                <h3>{dashboardStats.successfulDonations}</h3>
                <p>Successful Donations</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fee2e2' }}>
                <Ban size={28} color="#ef4444" />
              </div>
              <div className="stat-content">
                <h3>{dashboardStats.blacklistedHotels}</h3>
                <p>Blacklisted Hotels</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fce7c3' }}>
                <ShieldAlert size={28} color="#f97316" />
              </div>
              <div className="stat-content">
                <h3>{complaintSummary.pending || 0}</h3>
                <p>Pending Complaints</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'hotels' && (
        <div className="hotels-section">
          <h2>Top Performing Hotels</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Hotel Name</th>
                  <th>City</th>
                  <th>Rating</th>
                  <th>Reviews</th>
                  <th>Donations</th>
                  <th>Success Rate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {topHotels.map((hotel, index) => {
                  const pickupValue =
                    hotel.pickupReliability ??
                    (hotel.totalDonations > 0
                      ? (hotel.successfulDonations / hotel.totalDonations) * 100
                      : 0);
                  const ratingValue =
                    hotel.ratingWeight ?? (hotel.averageRating > 0 ? (hotel.averageRating / 5) * 100 : 0);
                  const successValue =
                    hotel.successRate ??
                    Math.round((pickupValue * ratingValue) / 100);

                  return (
                    <tr key={hotel._id}>
                    <td>
                      <div className="rank-badge">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                    </td>
                    <td className="hotel-name">{hotel.hotelName}</td>
                    <td>{hotel.city || 'N/A'}</td>
                    <td>
                      <div className="rating-cell">
                        {renderStars(hotel.averageRating)}
                        <span>{hotel.averageRating.toFixed(2)}</span>
                      </div>
                    </td>
                    <td>{hotel.totalReviews}</td>
                    <td>{hotel.totalDonations}</td>
                    <td>
                        <div className="success-rate-wrapper">
                          <span
                            className="success-rate"
                            title={`Pickup reliability: ${safePercent(pickupValue, 0)}% • Rating weight: ${safePercent(ratingValue, 0)}%`}
                          >
                            {safePercent(successValue, 0)}%
                          </span>
                          <span className="success-meta">
                            Pickups {safePercent(pickupValue, 0)}% · Rating {safePercent(ratingValue, 0)}%
                          </span>
                        </div>
                    </td>
                    <td>
                      {hotel.isTopContributor ? (
                        <span className="badge top-contributor">Top Contributor</span>
                      ) : (
                        <span className="badge active">Active</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="inspect-btn"
                        onClick={() => fetchHotelDetail(hotel.hotelId || hotel._id)}
                      >
                        Inspect
                      </button>
                      {hotel.underReview && !hotel.isBlacklisted && (
                        <button
                          className="inspect-btn"
                          onClick={() => handleReviewAction(hotel.hotelId || hotel._id, 'clear-review', {
                            prompt: 'Optional note for hotel? (Preview email message)',
                            successMessage: `${hotel.hotelName} review has been cleared.`,
                          })}
                        >
                          Clear Review
                        </button>
                      )}
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'ngos' && (
        <div className="ngos-section">
          <h2>Top Performing NGOs</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>NGO Name</th>
                  <th>City</th>
                  <th>Donations Accepted</th>
                  <th>Confirmed Pickups</th>
                  <th>Reviews Given</th>
                  <th>Activity Score</th>
                </tr>
              </thead>
              <tbody>
                {topNgos.map((ngo, index) => (
                  <tr key={ngo._id}>
                    <td>
                      <div className="rank-badge">
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                        {index > 2 && `#${index + 1}`}
                      </div>
                    </td>
                    <td className="ngo-name">{ngo.organizationName}</td>
                    <td>{ngo.city || 'N/A'}</td>
                    <td>{ngo.totalAccepted}</td>
                    <td>{ngo.confirmedPickups}</td>
                    <td>{ngo.reviewsGiven}</td>
                    <td>
                      <div className="activity-score">
                        <Activity size={16} />
                        <strong>{ngo.activityScore}</strong>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSection === 'complaints' && (
        <div className="complaints-section">
          <div className="complaints-header">
            <h2>Complaint Review Center</h2>
            <div className="complaints-summary-cards">
              <div className="summary-card">
                <p>Pending</p>
                <strong>{complaintSummary.pending || 0}</strong>
              </div>
              <div className="summary-card">
                <p>Resolved (7d)</p>
                <strong>{complaintSummary.verifiedThisWeek || 0}</strong>
              </div>
              <div className="summary-card">
                <p>Total</p>
                <strong>{complaintSummary.total || 0}</strong>
              </div>
            </div>
          </div>

          {complaintError && (
            <div className="complaint-error-banner">
              <AlertTriangle size={18} />
              <span>{complaintError}</span>
            </div>
          )}

          <div className="table-container">
            {complaintsLoading ? (
              <div className="complaints-loading">
                <RefreshCw size={32} className="spin" />
                <p>Loading complaints...</p>
              </div>
            ) : complaints.length === 0 ? (
              <div className="no-complaints">
                <ShieldAlert size={48} />
                <h3>No complaints filed</h3>
                <p>Great job! There are currently no pending complaints.</p>
              </div>
            ) : (
              <table className="data-table complaints-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Hotel</th>
                    <th>NGO</th>
                    <th>Donation</th>
                    <th>Submitted On</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((complaint) => (
                    <tr key={complaint._id}>
                      <td>#{complaint._id.slice(-6).toUpperCase()}</td>
                      <td>{complaint.againstHotel?.hotelName || 'N/A'}</td>
                      <td>{complaint.complaintByNgo?.organizationName || 'N/A'}</td>
                      <td>
                        {complaint.donationId?.foodType || 'Donation'} (
                        {complaint.donationId?._id?.slice(-6).toUpperCase()})
                      </td>
                      <td>{new Date(complaint.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`complaint-pill status-${complaint.status}`}>
                          {complaint.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="complaint-actions">
                        <button className="inspect-btn" onClick={() => openComplaintModal(complaint)}>
                          View
                        </button>
                        <button
                          className="inspect-btn approve"
                          onClick={() => handleQuickDecision(complaint, 'verified')}
                          disabled={complaint.status === 'verified'}
                        >
                          Approve
                        </button>
                        <button
                          className="inspect-btn danger"
                          onClick={() => handleQuickDecision(complaint, 'rejected')}
                          disabled={complaint.status === 'rejected'}
                        >
                         Reinstate Hotel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {complaintModalOpen && selectedComplaint && (
            <div className="complaint-detail-modal">
              <div className="modal-content">
                <button className="modal-close" onClick={closeComplaintModal}>
                  <X size={18} />
                </button>
                <header className="modal-header">
                  <ShieldAlert size={24} />
                  <div>
                    <h3>Complaint #{selectedComplaint._id.slice(-6).toUpperCase()}</h3>
                    <span className={`complaint-pill status-${selectedComplaint.status}`}>
                      {selectedComplaint.status.toUpperCase()}
                    </span>
                  </div>
                </header>
                <section className="modal-section">
                  <h4>NGO Details</h4>
                  <p>{selectedComplaint.complaintByNgo?.organizationName}</p>
                  <p>{selectedComplaint.complaintByNgo?.email}</p>
                </section>
                <section className="modal-section">
                  <h4>Hotel Details</h4>
                  <p>{selectedComplaint.againstHotel?.hotelName}</p>
                  <p>{selectedComplaint.againstHotel?.email}</p>
                </section>
                <section className="modal-section">
                  <h4>Donation Snapshot</h4>
                  <p>
                    {selectedComplaint.donationId?.foodType || 'Donation'} • Serves{' '}
                    {selectedComplaint.donationId?.servesPeople || 0}
                  </p>
                  {selectedComplaint.donationId?.pickupAddress && (
                    <p>{selectedComplaint.donationId.pickupAddress}</p>
                  )}
                </section>
                <section className="modal-section">
                  <h4>Description</h4>
                  <p>{selectedComplaint.description}</p>
                </section>
                {selectedComplaint.photoProof && (
                  <section className="modal-section">
                    <h4>Evidence</h4>
                    <a
                      href={`http://localhost:5000${selectedComplaint.photoProof}`}
                      target="_blank"
                      rel="noreferrer"
                      className="photo-link"
                    >
                      View photo proof
                    </a>
                  </section>
                )}
                <section className="modal-section">
                  <h4>Admin Notes</h4>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Add context for your decision (optional but recommended)"
                    rows={3}
                  />
                </section>
                <div className="modal-actions">
                  <button
                    className="decision-btn success"
                    onClick={() => handleComplaintDecision('verified')}
                    disabled={decisionLoading || selectedComplaint.status === 'verified'}
                  >
                    {decisionLoading ? 'Updating...' : '✅ Mark as Genuine'}
                  </button>
                  <button
                    className="decision-btn danger"
                    onClick={() => handleComplaintDecision('rejected')}
                    disabled={decisionLoading || selectedComplaint.status === 'rejected'}
                  >
                    {decisionLoading ? 'Updating...' : '❌ Reject Complaint'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSection === 'blacklist' && (
        <div className="blacklist-section">
          <h2>🚫 Blacklisted Hotels</h2>
          {blacklistedHotels.length === 0 ? (
            <div className="no-data">
              <CheckCircle size={64} color="#10b981" />
              <h3>No Blacklisted Hotels</h3>
              <p>All hotels are in good standing</p>
            </div>
          ) : (
            <div className="blacklist-grid">
              {blacklistedHotels.map((hotel) => (
                <div key={hotel._id} className="blacklist-card">
                  <div className="card-header">
                    <div className="hotel-info">
                      <Building size={24} />
                      <div>
                        <h3>{hotel.hotelName}</h3>
                        <p>{hotel.email}</p>
                      </div>
                    </div>
                    <div className="blacklist-badge">
                      <Ban size={18} />
                      <span>Blacklisted</span>
                    </div>
                  </div>

                  <div className="card-stats">
                    <div className="stat">
                      <span className="label">Rating:</span>
                      <span className="value bad">{hotel.averageRating.toFixed(2)} ⭐</span>
                    </div>
                    <div className="stat">
                      <span className="label">Low Ratings:</span>
                      <span className="value">{hotel.negativeFeedbackCount}</span>
                    </div>
                    <div className="stat">
                      <span className="label">Total Reviews:</span>
                      <span className="value">{hotel.totalReviews}</span>
                    </div>
                  </div>

                  <div className="blacklist-reason">
                    <AlertTriangle size={16} />
                    <p>{hotel.blacklistReason}</p>
                  </div>

                  <div className="blacklist-date">
                    Blacklisted on: {new Date(hotel.blacklistedAt).toLocaleDateString()}
                  </div>

                  <button
                    className="unblacklist-btn"
                    onClick={() => handleUnblacklistHotel(hotel._id, hotel.hotelName)}
                  >
                    Remove Blacklist
                  </button>
                  <button
                    className="inspect-btn secondary"
                    onClick={() => fetchHotelDetail(hotel.hotelId || hotel._id)}
                  >
                    View History
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(detailLoading || hotelDetail || detailError) && (
        <div className="hotel-detail-panel">
          <div className="panel-header">
            <h2>Hotel Performance History</h2>
            {detailLoading && <span className="panel-status">Loading…</span>}
            {detailError && <span className="panel-status error">{detailError}</span>}
            {hotelDetail && (
              <button className="panel-close" onClick={() => setHotelDetail(null)}>
                Close
              </button>
            )}
          </div>

          {hotelDetail && (
            <div className="panel-content">
              <section className="panel-section">
                <h3>Profile Snapshot</h3>
                <div className="profile-grid">
                  <div>
                    <strong className='hotelName'>{hotelDetail.hotel.hotelName}</strong>
                    <p>{hotelDetail.hotel.address}</p>
                    <p>{hotelDetail.hotel.city}</p>
                  </div>
                  <div>
                    <p>Average Rating: <strong>{hotelDetail.hotel.averageRating?.toFixed(2) || 'N/A'}</strong></p>
                    <p>Total Reviews: {hotelDetail.hotel.totalReviews}</p>
                    <p>Low Ratings: {hotelDetail.hotel.negativeFeedbackCount}</p>
                  </div>
                  <div>
                    <p>Status: {hotelDetail.hotel.isBlacklisted ? 'Blacklisted' : hotelDetail.hotel.underReview ? 'Under Review' : 'Active'}</p>
                    {hotelDetail.hotel.underReviewReason && (
                      <p className="reason-note">Under Review: {hotelDetail.hotel.underReviewReason}</p>
                    )}
                    {hotelDetail.hotel.blacklistReason && (
                      <p className="reason-note">Blacklist: {hotelDetail.hotel.blacklistReason}</p>
                    )}
                  </div>
                </div>
                {hotelDetail.hotel.underReview && !hotelDetail.hotel.isBlacklisted && (
                  <div className="decision-buttons">
                    <button
                      className="decision-btn danger"
                      onClick={() => handleReviewAction(hotelDetail.hotel._id, 'blacklist', {
                        prompt: 'Reason for blacklisting this hotel?',
                        defaultValue: hotelDetail.hotel.underReviewReason || 'Evidence confirmed by admin.',
                        successMessage: `${hotelDetail.hotel.hotelName} has been blacklisted.`,
                      })}
                    >
                      Blacklist Hotel
                    </button>
                    <button
                      className="decision-btn success"
                      onClick={() => handleReviewAction(hotelDetail.hotel._id, 'clear-review', {
                        prompt: 'Optional note for hotel?',
                        successMessage: `${hotelDetail.hotel.hotelName} review cleared and donations allowed.`,
                      })}
                    >
                      Allow Donations
                    </button>
                  </div>
                )}
                {hotelDetail.hotel.isBlacklisted && (
                  <div className="decision-buttons">
                    <button
                      className="decision-btn success"
                      onClick={() => handleReviewAction(hotelDetail.hotel._id, 'unblacklist', {
                        prompt: 'Optional note for hotel?',
                        successMessage: `${hotelDetail.hotel.hotelName} has been removed from blacklist.`,
                      })}
                    >
                      Remove Blacklist
                    </button>
                  </div>
                )}
              </section>

              <section className="panel-section">
                <h3>Recent Donations</h3>
                {hotelDetail.recentDonations.length === 0 ? (
                  <p className="empty-text">No donation history available.</p>
                ) : (
                  <ul className="history-list">
                    {hotelDetail.recentDonations.map((donation) => (
                      <li key={donation._id}>
                        <div>
                          <strong>{donation.foodType}</strong> — {donation.quantity} qty ({donation.servesPeople} servings)
                        </div>
                        <div className="history-meta">
                          <span>Status: {donation.status}</span>
                          <span>Prepared: {new Date(donation.preparedAt).toLocaleString()}</span>
                          {donation.pickedUpAt && <span>Picked Up: {new Date(donation.pickedUpAt).toLocaleString()}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel-section">
                <h3>Recent Reviews & Evidence</h3>
                {hotelDetail.recentReviews.length === 0 ? (
                  <p className="empty-text">No reviews recorded.</p>
                ) : (
                  <ul className="history-list">
                    {hotelDetail.recentReviews.map((review) => (
                      <li key={review._id}>
                        <div className="review-summary">
                          <span className="rating-pill">{review.rating}★</span>
                          <strong>{review.ngoId?.organizationName || 'NGO'}</strong>
                          <span className="reason-tag">{review.reason || 'feedback'}</span>
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="history-comment">“{review.reviewText}”</p>
                        {review.photoEvidenceUrl && (
                          <a
                            className="photo-link"
                            href={`http://localhost:5000${review.photoEvidenceUrl}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Photo Evidence
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;

