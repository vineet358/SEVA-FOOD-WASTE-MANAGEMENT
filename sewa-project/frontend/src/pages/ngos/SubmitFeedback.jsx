import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Star, Send, CheckCircle, AlertCircle, Clock, Building, Package } from 'lucide-react';
import '../../components/CSS/ngos/submitFeedback.css';

const SubmitFeedback = () => {
  const [pendingReviews, setPendingReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [feedback, setFeedback] = useState({
    rating: 0,
    reviewText: '',
    reason: '',
    foodQuality: 'good',
    packagingQuality: 'good',
    timeliness: 'on-time',
    photoProof: null,
    photoPreview: null
  });
  const [hoverRating, setHoverRating] = useState(0);

  const ngoInfo = JSON.parse(localStorage.getItem('userInfo'));
  const ngoId = ngoInfo?.ngoId;

  useEffect(() => {
    fetchPendingReviews();
  }, [ngoId]);

  const fetchPendingReviews = async () => {
    if (!ngoId) return;
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/reviews/ngo/${ngoId}/pending`);
      setPendingReviews(response.data.pendingReviews || []);
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (rating) => {
    setFeedback(prev => ({
      ...prev,
      rating,
      reason: rating > 3 ? '' : prev.reason,
      photoProof: rating > 2 ? null : prev.photoProof,
      photoPreview: rating > 2 ? null : prev.photoPreview
    }));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (feedback.rating === 0) {
      alert('Please select a rating');
      return;
    }

    if (feedback.reviewText.trim().length < 10) {
      alert('Please provide a detailed review (at least 10 characters)');
      return;
    }

    if (feedback.rating <= 3 && !feedback.reason) {
      alert('Please select a reason for the feedback.');
      return;
    }

    const requiresPhoto = feedback.rating <= 2 || feedback.reason === 'spoiled';

    if (requiresPhoto && !feedback.photoProof) {
      alert('Photo evidence is required for spoiled or low-rated feedback. Please capture a clear image showing the hotel label.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('pickupId', selectedPickup._id);
      formData.append('rating', feedback.rating);
      formData.append('reviewText', feedback.reviewText);
      formData.append('foodQuality', feedback.foodQuality);
      formData.append('packagingQuality', feedback.packagingQuality);
      formData.append('timeliness', feedback.timeliness);
      formData.append('reason', feedback.reason || 'other');
      if (feedback.photoProof) {
        formData.append('photoProof', feedback.photoProof);
      }

      const response = await axios.post('http://localhost:5000/api/reviews/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('✅ ' + response.data.message);
      
      setFeedback({
        rating: 0,
        reviewText: '',
        reason: '',
        foodQuality: 'good',
        packagingQuality: 'good',
        timeliness: 'on-time',
        photoProof: null,
        photoPreview: null
      });
      setSelectedPickup(null);
      
      fetchPendingReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('❌ ' + (error.response?.data?.message || 'Failed to submit review'));
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating, onHover = false) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        size={32}
        className={`star ${star <= (onHover ? hoverRating : rating) ? 'filled' : ''}`}
        onClick={() => handleRatingClick(star)}
        onMouseEnter={() => setHoverRating(star)}
        onMouseLeave={() => setHoverRating(0)}
        style={{ cursor: 'pointer' }}
      />
    ));
  };

  if (loading) {
    return (
      <div className="submit-feedback-container">
        <div className="loading-spinner">
          <Clock size={48} />
          <p>Loading pending reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-feedback-container">
      <div className="feedback-header">
        <h1> Submit Feedback</h1>
        <p>Share your experience about completed donations</p>
      </div>

      <div className="feedback-instructions">
        <h2>Feedback Evidence Policy</h2>
        <ul>
          <li>Feedback unlocks only after  OTP verification and successful pickup.</li>
          <li>Ratings of 3★ or below must include a reason; choose “Food was spoiled” if the food was unsafe.</li>
          <li>For 1★–2★ ratings or spoiled food reports, upload a photo clearly showing the hotel name and the spoiled item.</li>
          <li>Admins review every low-rating case using photos, OTP logs, and pickup timestamps before deciding on blacklisting.</li>
        </ul>
      </div>

      {pendingReviews.length === 0 ? (
        <div className="no-pending-reviews">
          <CheckCircle size={64} color="#10b981" />
          <h2>All Caught Up!</h2>
          <p>You have no pending reviews at the moment.</p>
          <p className="hint">Reviews can be submitted after confirming pickups with OTP.</p>
        </div>
      ) : (
        <>
          <div className="pending-count">
            <AlertCircle size={20} />
            <span>{pendingReviews.length} donation(s) awaiting your feedback</span>
          </div>

          <div className="pending-reviews-grid">
            {pendingReviews.map((pickup) => (
              <div key={pickup._id} className="pending-review-card">
                <div className="card-header">
                  <div className="hotel-info">
                    <Building size={24} />
                    <div>
                      <h3>{pickup.hotelId?.hotelName || 'Unknown Hotel'}</h3>
                      <p className="hotel-email">{pickup.hotelId?.email}</p>
                    </div>
                  </div>
                  <div className="confirmed-badge">
                    <CheckCircle size={16} />
                    <span>Confirmed</span>
                  </div>
                </div>

                <div className="food-details">
                  <div className="detail-item">
                    <Package size={18} />
                    <span>{pickup.foodId?.foodType || 'N/A'}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="label">Serves:</span>
                    <span className="value">{pickup.foodId?.servesPeople || 'N/A'} people</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Address:</span>
                    <span className="value">{pickup.foodId?.pickupAddress || 'N/A'}</span>
                  </div>
                </div>

                <button
                  className="review-btn"
                  onClick={() => setSelectedPickup(pickup)}
                >
                  <Send size={18} />
                  Submit Review
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {selectedPickup && (
        <div className="modal-overlay" onClick={() => setSelectedPickup(null)}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Your Experience</h2>
              <p>Help us maintain quality by sharing your feedback</p>
            </div>

            <form onSubmit={handleSubmitReview} className="review-form">
              <div className="form-section">
                <label className="form-label">Overall Rating *</label>
                <div className="star-rating">
                  {renderStars(feedback.rating, true)}
                </div>
                <p className="rating-description">
                  {feedback.rating === 0 && 'Select your rating'}
                  {feedback.rating === 1 && '⭐ Very Poor'}
                  {feedback.rating === 2 && '⭐⭐ Poor'}
                  {feedback.rating === 3 && '⭐⭐⭐ Average'}
                  {feedback.rating === 4 && '⭐⭐⭐⭐ Good'}
                  {feedback.rating === 5 && '⭐⭐⭐⭐⭐ Excellent'}
                </p>
              </div>

              {feedback.rating <= 3 && (
                <div className="form-section">
                  <label className="form-label">Reason *</label>
                  <select
                    className="reason-select"
                    value={feedback.reason}
                    onChange={(e) => setFeedback({ ...feedback, reason: e.target.value })}
                    required
                  >
                    <option value="">Select a reason</option>
                    <option value="spoiled">Food was spoiled</option>
                    <option value="quality">Poor taste/quality</option>
                    <option value="hygiene">Hygiene issues</option>
                    <option value="timeliness">Late pickup</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}

              <div className="form-section">
                <label className="form-label">Your Review *</label>
                <textarea
                  className="review-textarea"
                  value={feedback.reviewText}
                  onChange={(e) => setFeedback({ ...feedback, reviewText: e.target.value })}
                  placeholder="Share your experience about the food quality, packaging, and overall service..."
                  rows="5"
                  required
                  minLength="10"
                />
                <p className="char-count">{feedback.reviewText.length} characters</p>
              </div>

              {(feedback.rating <= 2 || feedback.reason === 'spoiled') && (
                <div className="form-section photo-evidence">
                  <label className="form-label">
                    Photo Evidence * <span>(capture hotel label + spoiled food)</span>
                  </label>
                  <div className="photo-input-group">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFeedback({
                            ...feedback,
                            photoProof: file,
                            photoPreview: URL.createObjectURL(file)
                          });
                        }
                      }}
                    />
                    {feedback.photoPreview && (
                      <div className="photo-preview">
                        <img src={feedback.photoPreview} alt="Evidence preview" />
                        <button
                          type="button"
                          onClick={() =>
                            setFeedback({
                              ...feedback,
                              photoProof: null,
                              photoPreview: null
                            })
                          }
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                  <ul className="photo-guidelines">
                    <li>Ensure the hotel name / label is clearly visible.</li>
                    <li>Capture the spoiled portion of the food in good lighting.</li>
                    <li>Photo is mandatory for spoiled or 1-2 star ratings.</li>
                  </ul>
                </div>
              )}

              <div className="quality-metrics">
                <div className="metric-group">
                  <label className="form-label">Food Quality</label>
                  <select
                    className="metric-select"
                    value={feedback.foodQuality}
                    onChange={(e) => setFeedback({ ...feedback, foodQuality: e.target.value })}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div className="metric-group">
                  <label className="form-label">Packaging Quality</label>
                  <select
                    className="metric-select"
                    value={feedback.packagingQuality}
                    onChange={(e) => setFeedback({ ...feedback, packagingQuality: e.target.value })}
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="average">Average</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>

                <div className="metric-group">
                  <label className="form-label">Timeliness</label>
                  <select
                    className="metric-select"
                    value={feedback.timeliness}
                    onChange={(e) => setFeedback({ ...feedback, timeliness: e.target.value })}
                  >
                    <option value="on-time">On Time</option>
                    <option value="slightly-delayed">Slightly Delayed</option>
                    <option value="very-delayed">Very Delayed</option>
                  </select>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setSelectedPickup(null)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting || feedback.rating === 0}
                >
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmitFeedback;

