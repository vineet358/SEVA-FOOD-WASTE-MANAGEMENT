import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Upload, 
  MapPin, 
  Clock, 
  Utensils, 
  Camera, 
  X, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import '../../components/CSS/Hotel/AddDonations.css';

const AddDonation = ({ hotelName, licenseNo, onDonationAdded, accountStatus }) => {
  const [formData, setFormData] = useState({
    foodType: '',
    quantity: '',
    prepDate: '',
    prepTime: '',
    expiresInHours: '',
    pickupLocation: '',
    description: '',
    images: []
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [autoExpiry, setAutoExpiry] = useState({ date: '', time: '' });
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockMessage, setBlockMessage] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const [hotelData, setHotelData] = useState({
    hotelId: null,
    hotelName: hotelName || null,
    licenseNo: licenseNo || null
  });
  const getLatLngFromCity = async (city) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: city,
          format: 'json',
          limit: 1
        }
      });
      if (response.data.length === 0) throw new Error('City not found');
      const { lat, lon } = response.data[0];
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
    } catch (error) {
      console.error('Error fetching city coordinates:', error);
      return { latitude: null, longitude: null };
    }
  };
  

  // Default shelf-life hours
  const shelfLife = {
    vegan: 24,
    'veg': 12,
    'non-veg': 6
  };

  useEffect(() => {
    const storedHotel = JSON.parse(localStorage.getItem('userInfo'));
    setHotelData({
      hotelId: storedHotel?.hotelId || null,
      hotelName: hotelName || storedHotel?.hotelName || null,
      licenseNo: licenseNo || storedHotel?.licenseNumber || null
    });
  }, [hotelName, licenseNo]);

  useEffect(() => {
    if (!accountStatus) return;
    if (accountStatus.isBlacklisted) {
      setIsBlocked(true);
      setBlockMessage('Your account is temporarily disabled while the admin reviews a complaint linked to your donations.');
      setBlockReason(accountStatus.blacklistReason || 'An NGO complaint was verified or is pending final decision.');
    } else if (accountStatus.underReview) {
      setIsBlocked(true);
      setBlockMessage('There is an open complaint under review. Donation posting is paused until the admin finishes verification.');
      setBlockReason(accountStatus.underReviewReason || 'Our team will reach out after validating the submitted evidence.');
    } else {
      setIsBlocked(false);
      setBlockMessage('');
      setBlockReason('');
    }
  }, [accountStatus]);

  // Recalculate expiry automatically (autoExpiry)
  useEffect(() => {
    if (formData.foodType && formData.prepDate && formData.prepTime) {
      const prepDateTime = new Date(`${formData.prepDate}T${formData.prepTime}`);
      const hours = shelfLife[formData.foodType] || 8; 
      const expiryDateTime = new Date(prepDateTime.getTime() + hours * 60 * 60 * 1000);

      const expiryDate = expiryDateTime.toISOString().split('T')[0];
      const expiryTime = expiryDateTime.toTimeString().slice(0, 5);
      setAutoExpiry({ date: expiryDate, time: expiryTime });
    }
  }, [formData.foodType, formData.prepDate, formData.prepTime]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const imageUrls = files.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...imageUrls].slice(0, 4)
    }));
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    const { foodType, quantity, prepDate, prepTime, pickupLocation, expiresInHours } = formData;

    if (!foodType) newErrors.foodType = 'Food type is required';
    if (!quantity) newErrors.quantity = 'Quantity is required';
    if (!prepDate) newErrors.prepDate = 'Preparation date is required';
    if (!prepTime) newErrors.prepTime = 'Preparation time is required';
    if (!pickupLocation) newErrors.pickupLocation = 'Pickup location is required';
    if(!formData.city) newErrors.city = 'City is required';
    if (!expiresInHours || isNaN(expiresInHours) || Number(expiresInHours) <= 0) {
      newErrors.expiresInHours = 'Expires in hours must be a positive number';
    }

    if (prepDate && prepTime) {
      const prepDateTime = new Date(`${prepDate}T${prepTime}`);
      const now = new Date();

      if (prepDateTime > now) newErrors.prepDate = 'Preparation time cannot be in the future';
    }

    if (quantity && (isNaN(quantity) || Number(quantity) <= 0)) {
      newErrors.quantity = 'Quantity must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 
const handleSubmit = async (e) => {
  e.preventDefault();

  if (isBlocked) {
    alert(blockMessage || 'Your account is currently under review by the admin team.');
    return;
  }

  if (!validateForm()) {
    console.log('Form validation failed:', errors);
    return;
  }
  const { latitude, longitude } = await getLatLngFromCity(formData.city);

if (!latitude || !longitude) {
  alert('Unable to fetch coordinates for the entered city. Please check the city name.');
  setIsSubmitting(false);
  return;
}

  const hotelId = hotelData.hotelId;
  const hotelNameFinal = hotelData.hotelName;

  if (!hotelId || !hotelNameFinal) {
    alert('Hotel credentials are missing. Please log in again.');
    console.error('Missing hotel credentials:', hotelData);
    return;
  }

  setIsSubmitting(true);

  try {
    const prepDateTime = new Date(`${formData.prepDate}T${formData.prepTime}`);
    if (isNaN(prepDateTime.getTime())) {
      alert('Invalid preparation date/time');
      setIsSubmitting(false);
      return;
    }

    // Calculate hotel expiry date
    const hotelExpiryDateTime = new Date(prepDateTime);
    hotelExpiryDateTime.setHours(hotelExpiryDateTime.getHours() + Number(formData.expiresInHours));
    
    // Validate expiry date
    if (isNaN(hotelExpiryDateTime.getTime())) {
      alert('Invalid expiry calculation');
      setIsSubmitting(false);
      return;
    }

    // Convert to ISO strings
    const preparedAtISO = prepDateTime.toISOString();
    const hotelExpiryAtISO = hotelExpiryDateTime.toISOString();

    const payload = {
      hotelId,
      hotelName: hotelNameFinal,
      foodType: formData.foodType,
      quantity: Number(formData.quantity),
      servesPeople: Number(formData.quantity),
      description: formData.description || '',
      preparedAt: preparedAtISO,
      hotelExpiryAt: hotelExpiryAtISO,
      prepTime: formData.prepTime,
      pickupAddress: formData.pickupLocation,
      city: formData.city ,
      latitude,
      longitude,
      images: formData.images.map(img => img.split("/").pop())
    };

    console.log('Sending payload:', {
      ...payload,
      preparedAt: preparedAtISO,
      hotelExpiryAt: hotelExpiryAtISO,
      prepDateTime: prepDateTime.toString(),
      hotelExpiryDateTime: hotelExpiryDateTime.toString()
    });

    const res = await axios.post("http://localhost:5000/api/food/add", payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Success response:', res.data);
    setSubmitSuccess(true);

    if (onDonationAdded && typeof onDonationAdded === 'function') {
      onDonationAdded();
    }

    setTimeout(() => {
      setFormData({
        foodType: '',
        quantity: '',
        prepDate: '',
        prepTime: '',
        expiresInHours: '',
        pickupLocation: '',
        description: '',
        images: []
      });
      setAutoExpiry({ date: '', time: '' });
      setSubmitSuccess(false);
    }, 3000);

  } catch (error) {
    console.error('Error submitting donation:', error);
    console.error('Error response:', error.response?.data);
    
    if (error.response?.status === 403) {
      setIsBlocked(true);
      setBlockMessage(error.response.data?.message || 'Your account is currently restricted from donating.');
      setBlockReason(error.response.data?.reason || '');
      alert(error.response.data?.message || 'Your account is currently restricted from donating.');
    } else if (error.response?.data) {
      const errorMessage = error.response.data.message || 'Unknown server error';
      const errorDetails = error.response.data.errors 
        ? JSON.stringify(error.response.data.errors) 
        : '';
      alert(`Error: ${errorMessage}${errorDetails ? `\n${errorDetails}` : ''}`);
    } else if (error.request) {
      alert('Network error: Unable to connect to server');
    } else {
      alert('Error submitting donation: ' + error.message);
    }
  } finally {
    setIsSubmitting(false);
  }
};

  if (isBlocked) {
    return (
      <div className="add-donation-container">
        <div className="blocked-notice">
          <AlertCircle size={48} />
          <h2>Donations Temporarily Disabled</h2>
          <p>{blockMessage}</p>
          {blockReason && (
            <p className="blocked-reason">
              <strong>Admin Note:</strong> {blockReason}
            </p>
          )}
          <p className="blocked-support">
            Admins will review your past performance and supporting evidence (photos, OTP logs). You will be notified once the verification is complete.
          </p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="add-donation-container">
        <div className="success-message">
          <CheckCircle size={64} />
          <h2>Donation Added Successfully!</h2>
          <p>Your food donation has been listed and NGOs will be notified. Thank you for helping reduce food waste!</p>
          <div className="success-stats">
            <div className="success-stat">
              <span className="stat-number">1</span>
              <span className="stat-label">Donation Added</span>
            </div>
            <div className="success-stat">
              <span className="stat-number">{formData.quantity}</span>
              <span className="stat-label">People Can Be Fed</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="add-donation-container">
      <div className="donation-header">
        <h1>Add New Donation</h1>
        <p>Help reduce food waste by sharing your excess food with those in need</p>
      </div>

      <form onSubmit={handleSubmit} className="donation-form">
        {/* Food Details Section */}
        <div className="form-section">
          <h3><Utensils size={20}/> Food Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="foodType">Food Type *</label>
              <select
                id="foodType"
                name="foodType"
                value={formData.foodType}
                onChange={handleInputChange}
                className={errors.foodType ? 'error' : ''}
              >
                <option value="">Select food type</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
              </select>
              {errors.foodType && <span className="error-text">{errors.foodType}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity (servings) *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="Number of people it can serve"
                min="1"
                className={errors.quantity ? 'error' : ''}
              />
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the food items..."
              rows="3"
            />
          </div>
        </div>

        {/* Timing Section */}
        <div className="form-section">
          <h3><Clock size={20}/> Timing Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prepDate">Preparation Date *</label>
              <input 
                type="date" 
                id="prepDate" 
                name="prepDate" 
                value={formData.prepDate} 
                onChange={handleInputChange} 
                className={errors.prepDate ? 'error' : ''}
              />
              {errors.prepDate && <span className="error-text">{errors.prepDate}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="prepTime">Preparation Time *</label>
              <input 
                type="time" 
                id="prepTime" 
                name="prepTime" 
                value={formData.prepTime} 
                onChange={handleInputChange} 
                className={errors.prepTime ? 'error' : ''}
              />
              {errors.prepTime && <span className="error-text">{errors.prepTime}</span>}
            </div>

            {/* Hotel Expires In Hours */}
            <div className="form-group">
              <label htmlFor="expiresInHours">Expires In (hours) *</label>
              <input 
                type="number"
                id="expiresInHours"
                name="expiresInHours"
                value={formData.expiresInHours}
                onChange={handleInputChange}
                placeholder="e.g., 3, 4"
                min="1"
                className={errors.expiresInHours ? 'error' : ''}
              />
              {errors.expiresInHours && <span className="error-text">{errors.expiresInHours}</span>}
            </div>
          </div>

          {/* Auto-calculated expiry */}
          {autoExpiry.date && autoExpiry.time && (
            <div className="auto-expiry-box">
              <p><strong>Estimated Safe Consumption Time:</strong></p>
              <p>{autoExpiry.date} at {autoExpiry.time}</p>
              <small>(Calculated automatically based on food type)</small>
            </div>
          )}
        </div>

        {/* Pickup Location Section */}
        <div className="form-section">
          <h3><MapPin size={20}/> Pickup Location</h3>
          <div className="form-group">
            <label htmlFor="pickupLocation">Address *</label>
            <textarea
              id="pickupLocation"
              name="pickupLocation"
              value={formData.pickupLocation}
              onChange={handleInputChange}
              placeholder="Enter pickup address..."
              rows="3"
              className={errors.pickupLocation ? 'error' : ''}
            />
            {errors.pickupLocation && <span className="error-text">{errors.pickupLocation}</span>}
          </div>
          {/* New City Field */}
  <div className="form-group">
    <label htmlFor="city">City *</label>
    <input
      type="text"
      id="city"
      name="city"
      value={formData.city || ''}
      onChange={handleInputChange}
      placeholder="Enter city name"
      className={errors.city ? 'error' : ''}
    />
    {errors.city && <span className="error-text">{errors.city}</span>}
  </div>

        </div>

        {/* Images Section */}
        <div className="form-section">
          <h3><Camera size={20}/> Food Images (Optional)</h3>
          <div className="image-upload-section">
            <div className="image-grid">
              {formData.images.map((image, index) => (
                <div key={index} className="image-preview">
                  <img src={image} alt={`Food ${index + 1}`} />
                  <button type="button" className="remove-image" onClick={() => removeImage(index)}>
                    <X size={16}/>
                  </button>
                </div>
              ))}

              {formData.images.length < 4 && (
                <div className="upload-placeholder">
                  <input 
                    type="file" 
                    id="imageUpload" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }} 
                  />
                  <label htmlFor="imageUpload" className="upload-label">
                    <Upload size={24}/>
                    <span>Add Photos</span>
                    <small>Up to 4 images</small>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
         
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Adding Donation...' : 'Add Donation'}
          </button>
        </div>

        {/* Info Box */}
        <div className="info-box">
          <AlertCircle size={20} />
          <div>
            <h4>Important Information</h4>
            <ul>
              <li>Expiry time is estimated automatically based on food type.</li>
              <li>NGOs will be notified automatically once donation is added.</li>
              <li>Ensure food is safe, hygienic, and properly stored.</li>
              <li>Pickup should be arranged before expiry time.</li>
            </ul>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddDonation;
