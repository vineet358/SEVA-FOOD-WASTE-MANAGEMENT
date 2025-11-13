import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Eye,
  Download,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  Package,
  Truck
} from 'lucide-react';
import '../../components/CSS/Hotel/MyDonations.css';
import AddDonation from './AddDonation';
import axios from 'axios';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchDonations = async () => {
    try {
      const hotelData = JSON.parse(localStorage.getItem('userInfo'));
      const hotelId = hotelData?.hotelId;
      if (!hotelId) return;
  
      const res = await axios.get(`http://localhost:5000/api/food/history/${hotelId}`);
      const donationsData = res.data.donations || [];
  
      console.log('Raw donations data:', donationsData);
  
      const mappedDonations = donationsData.map(d => {
        const isNgoPopulated = d.acceptedByNgoId && typeof d.acceptedByNgoId === 'object';
        
        console.log('Donation:', d._id, 'NGO populated?', isNgoPopulated, 'NGO data:', d.acceptedByNgoId);
  
        return {
          id: d._id,
          foodType: d.foodType,
          quantity: d.quantity,
          servesPeople: d.servesPeople,
          description: d.description,
          status: d.status,
          date: d.createdAt,
          prepDate: d.preparedAt,
          expiry: d.expiryAt,
          pickup: d.pickupAddress,
          images: d.images || [],
  
          ngo: isNgoPopulated 
            ? d.acceptedByNgoId.organizationName 
            : (d.acceptedByNgo || 'N/A'),
          ngoEmail: isNgoPopulated 
            ? (d.acceptedByNgoId.email || 'N/A') 
            : 'N/A',
          ngoPhone: isNgoPopulated 
            ? (d.acceptedByNgoId.phone || 'N/A') 
            : 'N/A'
        };
      });
  
      setDonations(mappedDonations);
      setFilteredDonations(mappedDonations);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleDonationAdded = () => {
  
    fetchDonations();
  };

  // Apply filters
  useEffect(() => {
    let filtered = donations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.ngo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.foodType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(d => {
        const donationDate = new Date(d.date);
        const daysDiff = Math.floor((now - donationDate) / (1000 * 60 * 60 * 24));
        switch (dateFilter) {
          case 'today':
            return daysDiff === 0;
          case 'week':
            return daysDiff <= 7;
          case 'month':
            return daysDiff <= 30;
          default:
            return true;
        }
      });
    }

    setFilteredDonations(filtered);
  }, [donations, searchTerm, statusFilter, dateFilter]);

  // Status icons and text
  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return <CheckCircle size={16} className="status-icon delivered" />;
      case 'picked-up': return <Truck size={16} className="status-icon picked-up" />;
      case 'pending': return <Package size={16} className="status-icon pending" />;
      case 'expired': return <AlertTriangle size={16} className="status-icon expired" />;
      default: return <Package size={16} className="status-icon" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered': return 'Delivered to NGO';
      case 'picked-up': return 'Picked Up';
      case 'pending': return 'Pending Pickup';
      case 'expired': return 'Expired';
      default: return status;
    }
  };

  // Modal handlers
  const handleViewDetails = (donation) => {
    setSelectedDonation(donation);
    setShowModal(true);
  };
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedDonation(null);
  };

  const handleExport = () => {
    console.log('Exporting donations...');
  };


  return (
    <div className="my-donations-container">
      <div className="donations-header">
        <div className="header-content">
          <h1>Donation History</h1>
          <p>Track and manage all your food donations</p>
        </div>
        
      </div>

      {/* Filters */}
      <div >
      <div className="filters-section">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by ID, NGO, or food type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Pickup</option>
              <option value="picked-up">Picked Up</option>
              <option value="delivered">Delivered</option>
              <option value="expired">Expired</option>
            </select>
            <ChevronDown size={16} className="select-arrow" />
          </div>

          <div className="filter-group">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <ChevronDown size={16} className="select-arrow" />
          </div>
        </div>
      </div>
      </div>
       
      <div className="summary-stats">
  <div className="stat-item">
    <span className="stat-value">{donations.length}</span>
    <span className="stat-label">Total Donations</span>
  </div>

  
  <div className="stat-item">
    <span className="stat-value">
      {donations
        .filter(d => d.status === 'taken' || d.status === 'delivered')
        .reduce((sum, d) => sum + d.servesPeople, 0)}
    </span>
    <span className="stat-label">Total Servings</span>
  </div>

  <div className="stat-item">
    <span className="stat-value">
      {new Set(
        donations
          .filter(d => d.status === 'taken' || d.status === 'delivered')
          .map(d => d.ngo)
          .filter(ngo => ngo !== 'N/A')
      ).size}
    </span>
    <span className="stat-label">NGOs Helped</span>
  </div>
</div>

   
      {/* Donations Table */}
      <div className="donations-table-container">
        {filteredDonations.length === 0 ? (
          <div className="no-data">
            <Package size={48} />
            <h3>No donations found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="donations-table">
            <div className="table-header">
              <div className="th donation-id">ID</div>
              <div className="th date-time">Date & Time</div>
              <div className="th food-details">Food Details</div>
              <div className="th quantity">Quantity</div>
              <div className="th ngo">NGO</div>
              <div className="th status">Status</div>
              <div className="th actions">Actions</div>
            </div>

            <div className="table-body">
              {filteredDonations.map((donation) => (
                <div key={donation.id} className="table-row">
                  <div className="td donation-id">
                    <span className="donation-id-text">{donation.id}</span>
                  </div>
                  
                  <div className="td date-time">
                    <div className="date-time-content">
                      <Calendar size={14} />
                      <div>
                        <span className="date">{new Date(donation.date).toLocaleDateString()}</span>
                        <span className="time">{donation.time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="td food-details">
                    <div className="food-type">{donation.foodType}</div>
                    <div className="food-description">{donation.description}</div>
                  </div>

                  <div className="td quantity">
                    <div className="quantity-content">
                      <Users size={14} />
                      <span>{donation.quantity} servings</span>
                    </div>
                  </div>

                  <div className="td ngo">
                    <span className="ngo-name">{donation.ngo}</span>
                  </div>

                  <div className="td status">
                    <div className={`status-badge ${donation.status}`}>
                      {getStatusIcon(donation.status)}
                      <span>{getStatusText(donation.status)}</span>
                    </div>
                  </div>

                  <div className="td actions">
                    <button 
                      className="view-btn"
                      onClick={() => handleViewDetails(donation)}
                    >
                      <Eye size={16} />
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal for donation details */}
      {showModal && selectedDonation && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Donation Details - {selectedDonation.id}</h3>
              <button className="close-modal" onClick={handleCloseModal}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>Food Type:</label>
                  <span>{selectedDonation.foodType}</span>
                </div>
                <div className="detail-item">
                  <label>Quantity:</label>
                  <span>{selectedDonation.quantity} servings</span>
                </div>
                <div className="detail-item">
  <label>Preparation Date:</label>
  <span>
    {selectedDonation.prepDate 
      ? new Date(selectedDonation.prepDate).toLocaleDateString() 
      : "Not Provided"}
  </span>
</div>
<div className="detail-item">
  <label>Best Before:</label>
  <span>
    {selectedDonation.expiry 
      ? new Date(selectedDonation.expiry).toLocaleDateString() 
      : "Not Provided"}
  </span>
</div>

<div className="detail-item">
  <label>NGO Partner:</label>
  <span>{selectedDonation.ngo}</span>
</div> 
<div className="detail-item">
  <label>NGO Email:</label>
  <span>{selectedDonation.ngoEmail || "Not Provided"}</span>
</div>
<div className="detail-item">
  <label>NGO Phone:</label>
  <span>{selectedDonation.ngoPhone || "Not Provided"}</span>
</div>
                <div className="detail-item">
                  <label>Status:</label>
                  <div className={`status-badge ${selectedDonation.status}`}>
                    {getStatusIcon(selectedDonation.status)}
                    <span>{getStatusText(selectedDonation.status)}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section alignnment-set">
                <label>Description:</label>
                <p>{selectedDonation.description}</p>
              </div>

              <div className="detail-section alignnment-set">
  <label>Pickup Location:</label>
  <div className="location-info">
    <MapPin size={16} />
    <span>{selectedDonation.pickup || "Not Provided"}</span>
  </div>
</div>

              {selectedDonation.images.length > 0 && (
                <div className="detail-section">
                  <label>Food Images:</label>
                  <div className="modal-images">
                    {selectedDonation.images.map((image, index) => (
                      <img 
                        key={index} 
                        src={image} 
                        alt={`Food ${index + 1}`}
                        className="modal-image"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyDonations;