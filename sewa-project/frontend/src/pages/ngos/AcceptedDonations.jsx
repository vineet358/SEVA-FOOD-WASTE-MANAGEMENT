import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Heart,
  MapPin,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar,
  Check,
  Building,
  Upload,
  X,
  ShieldAlert
} from 'lucide-react';
import '../../components/CSS/ngos/acceptedDonations.css';

const AcceptedDonations = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [donations, setDonations] = useState([]);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [complaintForm, setComplaintForm] = useState({
    description: '',
    photoFile: null,
    photoPreview: null,
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  const ngoInfo = JSON.parse(localStorage.getItem('userInfo'));
  const ngoId = ngoInfo?.ngoId;
  const ngoName = ngoInfo?.ngoName || 'Unknown NGO';

  // Fetch donations accepted by this NGO
  const fetchDonations = async () => {
    if (!ngoId) {
      console.error("NGO ID not found in localStorage");
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/food/ngo/history/${ngoId}`);
      const mappedDonations = res.data.map((donation) => {
        const pickupInfo = donation.pickupInfo || {};
        return {
          ...donation,
          id: donation._id,
          otpRequested: false,
          otpInput: '',
          pickedUp: donation.status === 'picked-up' || pickupInfo.pickupStatus === 'picked-up',
          pickupId: pickupInfo.pickupId || donation.pickupId,
          complaintStatus: pickupInfo.complaintStatus || 'none',
          complaintId: pickupInfo.complaintId || null,
        };
      });
      setDonations(mappedDonations);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [ngoId]);

  useEffect(() => {
    if (!ngoId) return;
    const socket = io('http://localhost:5000');
    socket.emit('register', { userId: ngoId });

    const handleComplaintUpdate = ({ complaintId, status, pickupId, note }) => {
      setDonations((prev) =>
        prev.map((donation) => {
          const pickupMatch =
            pickupId &&
            donation.pickupId &&
            donation.pickupId.toString() === pickupId.toString();
          const complaintMatch =
            complaintId &&
            donation.complaintId &&
            donation.complaintId.toString() === complaintId.toString();

          if (!pickupMatch && !complaintMatch) {
            return donation;
          }

          return {
            ...donation,
            complaintStatus: status,
            complaintId: complaintId || donation.complaintId,
            pickupInfo: {
              ...(donation.pickupInfo || {}),
              complaintStatus: status,
              complaintId: complaintId || donation.complaintId,
            },
          };
        })
      );

      if (status === 'verified') {
        alert('Your complaint was verified. The hotel remains temporarily disabled.');
      } else if (status === 'rejected') {
        alert(
          note
            ? `Complaint rejected: ${note}`
            : 'Complaint rejected after admin review.'
        );
      }
    };

    socket.on('ngo-complaint-update', handleComplaintUpdate);

    return () => {
      socket.off('ngo-complaint-update', handleComplaintUpdate);
      socket.disconnect();
    };
  }, [ngoId]);

  // Accept donation
  const handleAccept = async (id) => {
    if (!ngoId) return;

    try {
      const res = await axios.put(`http://localhost:5000/api/food/${id}/accept`, { ngoId, ngoName });
      const updatedDonations = donations.map(d => d.id === id ? res.data.food : d);
      setDonations(updatedDonations);
    } catch (error) {
      console.error('Error accepting donation:', error);
    }
  };

  // Reject donation
  const handleReject = async (id) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/food/${id}/reject`);
      const updatedDonations = donations.map(d => d.id === id ? res.data.food : d);
      setDonations(updatedDonations);
    } catch (error) {
      console.error('Error rejecting donation:', error);
    }
  };

  const resetComplaintForm = () => {
    setComplaintForm({
      description: '',
      photoFile: null,
      photoPreview: null,
    });
  };

  const openComplaintModal = (donation) => {
    setSelectedDonation(donation);
    resetComplaintForm();
    setComplaintModalOpen(true);
  };

  const closeComplaintModal = () => {
    setComplaintModalOpen(false);
    setSelectedDonation(null);
    resetComplaintForm();
  };

  const handleComplaintPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setComplaintForm((prev) => ({
      ...prev,
      photoFile: file,
      photoPreview: URL.createObjectURL(file),
    }));
  };

  const handleComplaintSubmit = async (event) => {
    event.preventDefault();
    if (!selectedDonation?.pickupId) {
      alert('Missing pickup identifier for this donation.');
      return;
    }
    if (!complaintForm.description.trim()) {
      alert('Please describe the issue before submitting.');
      return;
    }
    if (!complaintForm.photoFile) {
      alert('Photo evidence is mandatory to raise a complaint.');
      return;
    }

    try {
      setSubmittingComplaint(true);
      const payload = new FormData();
      payload.append('pickupId', selectedDonation.pickupId);
      payload.append('ngoId', ngoId);
      payload.append('description', complaintForm.description.trim());
      payload.append('photoProof', complaintForm.photoFile);

      const response = await axios.post('http://localhost:5000/api/complaints', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const complaintId = response.data?.complaint?._id;
      setDonations((prev) =>
        prev.map((donation) =>
          donation.id === selectedDonation.id
            ? {
                ...donation,
                complaintStatus: 'pending',
                complaintId: complaintId || donation.complaintId,
                pickupId: donation.pickupId || selectedDonation.pickupId,
                pickupInfo: {
                  ...(donation.pickupInfo || {}),
                  complaintStatus: 'pending',
                  complaintId: complaintId || donation.complaintId,
                  pickupId: donation.pickupId || selectedDonation.pickupId,
                },
              }
            : donation
        )
      );

      alert('Complaint submitted successfully. Admin will review and update you soon.');
      closeComplaintModal();
    } catch (error) {
      console.error('Error submitting complaint:', error);
      const message = error.response?.data?.message || 'Failed to submit complaint. Please try again.';
      alert(message);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const filteredDonations = donations.filter(donation => {
    const matchesSearch = donation.hotelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          donation.foodType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || donation.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken': return <CheckCircle size={16} className="status-icon accepted" />;
      case 'pending': return <Clock size={16} className="status-icon pending" />;
      case 'picked-up': return < Check size={16} className="status-icon picked-up" />;
      case 'expired': return <AlertCircle size={16} className="status-icon expired" />;
      default: return <Clock size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'taken': return '#10b981';
      case 'pending': return '#3b82f6';
      case 'expired': return '#ef4444';
      case 'picked-up': return '#f59e0b';
      default: return '#64748b';
    }
  };
  const totalAccepted = donations.filter(d => d.status === 'taken' && d.acceptedByNgoId === ngoId).length;
  const totalServings = donations.reduce((sum, d) => sum + d.servesPeople, 0);

  return (
    <div className="accepted-donations">
      <div className="donations-header">
        <div className="header-content">
          <h1>Accepted Donations</h1>
          <p>Manage and track all food donations you've accepted</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{totalAccepted}</span>
            <span className="stat-label">Total Accepted</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{totalServings}</span>
            <span className="stat-label">Total Servings</span>
          </div>
        </div>
      </div>

      <div className="donations-controls">
        <div className="search-section">
          <div className="search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search donations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="filter-section">
          <div className="filter-dropdown">
            <Filter size={16} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="taken">Accepted</option>
              <option value="pending">Pending</option>
              <option value="distributed">Distributed</option>
              <option value="picked-up">Picked Up</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div className="donations-grid">
        {filteredDonations.map((donation) => {
          const complaintStatus =
            donation.complaintStatus ||
            donation.pickupInfo?.complaintStatus ||
            'none';
          const complaintDisabled =
            complaintStatus === 'pending' || complaintStatus === 'verified';
          const complaintLabel =
            complaintStatus === 'pending'
              ? 'Complaint Pending'
              : complaintStatus === 'verified'
              ? 'Complaint Verified'
              : 'Raise Complaint';
          const complaintBadge =
            complaintStatus === 'rejected'
              ? 'Last complaint rejected. You can submit again.'
              : complaintStatus === 'verified'
              ? 'Admin verified this complaint. Hotel remains disabled.'
              : complaintStatus === 'pending'
              ? 'Awaiting admin review.'
              : null;

          return (
          <div key={donation.id} className="donation-card">
            <div className="donation-header">
              <div className="hotel-info">
                <Building size={20} />
                <div>
                  <h3>{donation.hotelName}</h3>
                  <p>{donation.foodType}</p>
                </div>
              </div>
              <div className="donation-status">
                {getStatusIcon(donation.status)}
                <span 
                  className="status-text"
                  style={{ color: getStatusColor(donation.status) }}
                >
                  {donation.status.replace('-', ' ').toUpperCase()}
                </span>
              </div>
            </div>

            <div className="donation-details">
              <div className="detail-row">
                <Users size={16} />
                <span>{donation.servesPeople} servings</span>
              </div>
              <div className="detail-row">
                <MapPin size={16} />
                <span>{donation.pickupAddress}</span>
              </div>
              <div className="detail-row">
                <Clock size={16} />
                <span>Prepared At: {new Date(donation.preparedAt).toLocaleString()}</span>
              </div>
              <div className="detail-row">
                <Calendar size={16} />
                <span>Expires: {new Date(donation.expiryAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="donation-description">
              <p>{donation.description}</p>
            </div>

            {/* ===== Donation Actions with OTP ===== */}
            <div className="donation-actions">
              {(donation.status === 'pending' || donation.status === 'available') && !donation.pickedUp ? (
                <>
                  <button className="action-btn primary" onClick={() => handleAccept(donation.id)}>
                    Accept
                  </button>
                  <button className="action-btn secondary" onClick={() => handleReject(donation.id)}>
                    Reject
                  </button>
                </>
              ) : donation.status === 'taken' && !donation.pickedUp ? (
                <>
                 {!donation.otpRequested ? (
  <button
    className="action-btn primary"
    onClick={async () => {
      try {
        const res = await axios.post(`http://localhost:5000/api/food/generate-otp`, {
          hotelId: donation.hotelId,
          ngoId,
          foodId: donation.id
        });

        if (res.data.success) {
          setDonations(prev =>
            prev.map(d =>
              d.id === donation.id
                        ? {
                            ...d,
                            otpRequested: true,
                            pickupId: res.data.pickupId,
                            otpInput: '',
                            pickupInfo: {
                              ...(d.pickupInfo || {}),
                              pickupId: res.data.pickupId,
                              pickupStatus: d.pickupInfo?.pickupStatus || 'pending',
                              complaintStatus: d.pickupInfo?.complaintStatus || d.complaintStatus || 'none',
                            },
                          }
                : d
            )
          );
          alert(res.data.message);
        } else {
          alert('Failed to generate OTP. Try again.');
        }
      } catch (err) {
        console.error('Error requesting OTP:', err);
        alert('Error requesting OTP. Check console.');
      }
    }}
  >
    Request OTP
  </button>
) : (
  <>
    <input
      type="text"
      placeholder="Enter OTP"
      value={donation.otpInput || ''}
      onChange={(e) =>
        setDonations(prev =>
          prev.map(d =>
            d.id === donation.id ? { ...d, otpInput: e.target.value } : d
          )
        )
      }
    />
    <button
      className="action-btn primary"
      onClick={async () => {
        try {
          const res = await axios.post(`http://localhost:5000/api/food/verify-otp`, {
            ngoId,
            enteredOtp: donation.otpInput,
            pickupId: donation.pickupId
          });

          if (res.data.success) {
            const updatedFood = res.data.food;
            setDonations(prev =>
              prev.map(d =>
                d.id === donation.id
                  ? {
                      ...d,
                      pickedUp: true,
                      status: updatedFood?.status || 'picked-up',
                      otpRequested: false,
                      otpInput: '',
                      pickedUpAt: updatedFood?.pickedUpAt || new Date().toISOString(),
                      pickupId: d.pickupId || donation.pickupId,
                      complaintStatus: d.complaintStatus || 'none',
                      pickupInfo: {
                        ...(d.pickupInfo || {}),
                        pickupId: d.pickupId || donation.pickupId,
                        pickupStatus: 'picked-up',
                        complaintStatus: d.pickupInfo?.complaintStatus || d.complaintStatus || 'none',
                      },
                    }
                  : d
              )
            );
            alert(res.data.message);
          } else {
            alert('OTP incorrect. Try again.');
          }
        } catch (err) {
          console.error('Error verifying OTP:', err);
          alert('Error verifying OTP.');
        }
      }}
    >
      Verify OTP
    </button>
  </>
)}

                </>
              ) : (
                <span className="processed-label">
                  {donation.pickedUp ? 'Picked Up' : 'Processed'}
                </span>
              )}
            </div>
            {donation.pickedUp && (
              <div className="complaint-section">
                <div className="complaint-main">
                  <ShieldAlert size={18} />
                  <div>
                    <p className="complaint-title">Faced an issue?</p>
                    <span className={`complaint-status complaint-${complaintStatus}`}>
                      {complaintStatus === 'none'
                        ? 'No complaint raised yet'
                        : complaintStatus.replace('-', ' ')}
                    </span>
                  </div>
                </div>
                <button
                  className="complaint-btn"
                  disabled={complaintDisabled || !donation.pickupId}
                  onClick={() => openComplaintModal(donation)}
                >
                  <Upload size={16} />
                  <span>{complaintLabel}</span>
                </button>
                {complaintBadge && (
                  <p className="complaint-note">{complaintBadge}</p>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      {filteredDonations.length === 0 && (
        <div className="no-donations">
          <Heart size={48} />
          <h3>No donations found</h3>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}

      {complaintModalOpen && selectedDonation && (
        <div className="complaint-modal-overlay" onClick={closeComplaintModal}>
          <div className="complaint-modal" onClick={(e) => e.stopPropagation()}>
            <button className="complaint-modal-close" onClick={closeComplaintModal}>
              <X size={18} />
            </button>
            <div className="complaint-modal-header">
              <ShieldAlert size={24} />
              <div>
                <h2>Raise a Complaint</h2>
                <p>Submitted complaints pause the hotel until admin verification.</p>
              </div>
            </div>
            <div className="complaint-modal-body">
              <div className="complaint-summary">
                <h3>{selectedDonation.hotelName}</h3>
                <p>
                  Donation: <strong>{selectedDonation.foodType}</strong> • Serves{' '}
                  {selectedDonation.servesPeople}
                </p>
                <p>
                  Picked up on{' '}
                  {selectedDonation.pickedUpAt
                    ? new Date(selectedDonation.pickedUpAt).toLocaleString()
                    : new Date().toLocaleString()}
                </p>
              </div>
              <form className="complaint-form" onSubmit={handleComplaintSubmit}>
                <label>
                  Complaint Details <span>*</span>
                  <textarea
                    rows="4"
                    value={complaintForm.description}
                    onChange={(e) =>
                      setComplaintForm((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Explain what went wrong. Mention smell, quality, or packaging issues."
                    required
                  />
                </label>
                <label>
                  Photo Evidence <span>*</span>
                  <div className="complaint-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleComplaintPhoto}
                      required
                    />
                    <Upload size={18} />
                    <span>Upload clear evidence showing the issue and hotel label</span>
                  </div>
                  {complaintForm.photoPreview && (
                    <img
                      className="complaint-preview"
                      src={complaintForm.photoPreview}
                      alt="Complaint preview"
                    />
                  )}
                </label>
                <button
                  type="submit"
                  className="complaint-submit-btn"
                  disabled={submittingComplaint}
                >
                  {submittingComplaint ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptedDonations;
