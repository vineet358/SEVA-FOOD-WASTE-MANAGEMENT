import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, TrendingUp, Award, AlertTriangle, MessageSquare, Calendar, Building2, User } from 'lucide-react';
import '../../components/CSS/Hotel/RatingsReviews.css';

const RatingsReviews = () => {
  const [hotelData, setHotelData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');

  const hotelInfo = JSON.parse(localStorage.getItem('userInfo'));
  const hotelId = hotelInfo?.hotelId;
  const hotelName = hotelInfo?.hotelName || 'Unknown Hotel';

  useEffect(() => {
    fetchRatingsAndReviews();
  }, [hotelId]);

  const fetchRatingsAndReviews = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/reviews/hotel/${hotelId}`);
      setHotelData(response.data.hotel);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching ratings and reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Star key={i} size={20} fill="#fbbf24" color="#fbbf24" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Star key={i} size={20} fill="#fbbf24" color="#fbbf24" style={{ clipPath: 'inset(0 50% 0 0)' }} />);
      } else {
        stars.push(<Star key={i} size={20} color="#cbd5e1" />);
      }
    }
    return stars;
  };

  const getQualityBadgeColor = (quality) => {
    const colors = {
      excellent: '#10b981',
      good: '#3b82f6',
      average: '#f59e0b',
      poor: '#ef4444'
    };
    return colors[quality] || '#64748b';
  };

  const getTimelinessColor = (timeliness) => {
    const colors = {
      'on-time': '#10b981',
      'slightly-delayed': '#f59e0b',
      'very-delayed': '#ef4444'
    };
    return colors[timeliness] || '#64748b';
  };

  const filteredReviews = reviews.filter(review => {
    if (filterRating === 'all') return true;
    return review.rating === parseInt(filterRating);
  });

  if (loading) {
    return (
      <div className="ratings-reviews-container">
        <div className="loading">Loading ratings...</div>
      </div>
    );
  }

  const isTopContributor = hotelData?.averageRating >= 4.5 && hotelData?.totalReviews > 0;
  const needsImprovement = hotelData?.averageRating <= 2.0 && hotelData?.totalReviews > 0;
  const isBlacklisted = hotelData?.isBlacklisted;

  return (
    <div className="ratings-reviews-container">
      <div className="ratings-header">
        <div className="header-content">
          <h1>⭐ Ratings & Reviews</h1>
          <p>Your performance feedback from NGOs</p>
        </div>

        {isTopContributor && (
          <div className="status-badge top-contributor">
            <Award size={24} />
            <span>Top Contributor</span>
          </div>
        )}

        {needsImprovement && !isBlacklisted && (
          <div className="status-badge needs-improvement">
            <AlertTriangle size={24} />
            <span>Needs Improvement</span>
          </div>
        )}

        {isBlacklisted && (
          <div className="status-badge blacklisted">
            <AlertTriangle size={24} />
            <span>Blacklisted</span>
          </div>
        )}
      </div>

      <div className="stats-overview">
        <div className="stat-card-large">
          <div className="stat-icon">
            <Star size={48} fill="#fbbf24" color="#fbbf24" />
          </div>
          <div className="stat-content">
            <h2>{hotelData?.averageRating?.toFixed(1) || '0.0'}</h2>
            <div className="star-display">
              {renderStars(hotelData?.averageRating || 0)}
            </div>
            <p>{hotelData?.totalReviews || 0} Total Reviews</p>
          </div>
        </div>

        <div className="stats-grid">
  <div className="mini-stat total-reviews">
    <TrendingUp size={24} color="#3b82f6" />
    <h3>{hotelData?.totalReviews || 0}</h3>
    <p>Total Reviews</p>
  </div>

          <div className="mini-stat">
            <MessageSquare size={24} color="#10b981" />
            <h3>{reviews.filter(r => r.rating >= 4).length}</h3>
            <p>Positive Reviews</p>
          </div>
          <div className="mini-stat">
            <AlertTriangle size={24} color="#ef4444" />
            <h3>{hotelData?.negativeFeedbackCount || 0}</h3>
            <p>Low Ratings</p>
          </div>
        </div>
      </div>

      {needsImprovement && !isBlacklisted && (
        <div className="warning-banner">
          <AlertTriangle size={24} />
          <div>
            <h3>Action Required</h3>
            <p>Your rating is below 2.0. Please focus on improving food quality and service to avoid blacklisting.</p>
          </div>
        </div>
      )}

      {isBlacklisted && (
        <div className="blacklist-banner">
          <AlertTriangle size={24} />
          <div>
            <h3>Account Blacklisted</h3>
            <p>Due to multiple low ratings, your account has been flagged. Contact admin for review.</p>
          </div>
        </div>
      )}

      <div className="reviews-controls">
        <h2>All Reviews ({filteredReviews.length})</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filterRating === 'all' ? 'active' : ''}`}
            onClick={() => setFilterRating('all')}
          >
            All
          </button>
          {[5, 4, 3, 2, 1].map(rating => (
            <button
              key={rating}
              className={`filter-btn ${filterRating === rating.toString() ? 'active' : ''}`}
              onClick={() => setFilterRating(rating.toString())}
            >
              {rating} ⭐
            </button>
          ))}
        </div>
      </div>

      <div className="reviews-list">
        {filteredReviews.length === 0 ? (
          <div className="no-reviews">
            <MessageSquare size={64} color="#cbd5e1" />
            <h3>No reviews yet</h3>
            <p>Start receiving reviews after NGOs confirm pickups</p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review._id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <div className="reviewer-avatar">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h4>{review.ngoId?.organizationName || 'Anonymous NGO'}</h4>
                    <p className="review-date">
                      <Calendar size={14} />
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                  <span className="rating-number">{review.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="review-body">
                <p className="review-text">{review.reviewText}</p>
              </div>

              {(review.foodQuality || review.packagingQuality || review.timeliness) && (
                <div className="quality-metrics">
                  {review.foodQuality && (
                    <div className="metric-badge" style={{ borderColor: getQualityBadgeColor(review.foodQuality) }}>
                      <span className="metric-label">Food:</span>
                      <span className="metric-value" style={{ color: getQualityBadgeColor(review.foodQuality) }}>
                        {review.foodQuality}
                      </span>
                    </div>
                  )}
                  {review.packagingQuality && (
                    <div className="metric-badge" style={{ borderColor: getQualityBadgeColor(review.packagingQuality) }}>
                      <span className="metric-label">Packaging:</span>
                      <span className="metric-value" style={{ color: getQualityBadgeColor(review.packagingQuality) }}>
                        {review.packagingQuality}
                      </span>
                    </div>
                  )}
                  {review.timeliness && (
                    <div className="metric-badge" style={{ borderColor: getTimelinessColor(review.timeliness) }}>
                      <span className="metric-label">Timeliness:</span>
                      <span className="metric-value" style={{ color: getTimelinessColor(review.timeliness) }}>
                        {review.timeliness.replace('-', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {review.donationId && (
                <div className="donation-info">
                  <span className="donation-label">Donation:</span>
                  <span>{review.donationId.foodType || 'N/A'}</span>
                  <span>•</span>
                  <span>{review.donationId.quantity || 'N/A'} kg</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RatingsReviews;




