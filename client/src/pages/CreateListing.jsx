import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createListing } from '../api/listingService';
import '../styles/CreateListing.css';

const CreateListing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    navigate('/signin');
    return null;
  }

  const [formData, setFormData] = useState({
    address: '',
    price: '',
    squareFeet: '',
    zipCode: '',
    description: '',
    status: 'active',
    images: ['', '', ''] // Three image URL fields
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('images[')) {
      // Handle image array inputs
      const index = parseInt(name.match(/\d+/)[0]);
      const newImages = [...formData.images];
      newImages[index] = value;
      setFormData(prev => ({ ...prev, images: newImages }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    // Validate required fields
    if (!formData.address.trim()) {
      errors.address = 'Address is required';
    }

    if (!formData.price) {
      errors.price = 'Price is required';
    } else if (isNaN(formData.price) || formData.price <= 0) {
      errors.price = 'Price must be a positive number';
    }

    if (!formData.squareFeet) {
      errors.squareFeet = 'Square footage is required';
    } else if (isNaN(formData.squareFeet) || formData.squareFeet <= 0) {
      errors.squareFeet = 'Square footage must be a positive number';
    }

    if (!formData.zipCode.trim()) {
      errors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      errors.zipCode = 'ZIP code must be valid (e.g., 35801 or 35801-1234)';
    }

    // Validate image URLs if provided
    const validImages = formData.images.filter(img => img.trim());
    if (validImages.length > 0) {
      validImages.forEach((img, idx) => {
        try {
          new URL(img);
        } catch {
          errors[`image_${idx}`] = 'Invalid image URL';
        }
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors above');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    // Prepare data for submission
    const submitData = {
      address: formData.address.trim(),
      price: Number(formData.price),
      squareFeet: Number(formData.squareFeet),
      zipCode: formData.zipCode.trim(),
      status: formData.status,
      description: formData.description.trim(),
      // Only include non-empty image URLs
      images: formData.images.filter(img => img.trim())
    };

    const response = await createListing(submitData);

    setLoading(false);

    if (response.success) {
      setSuccess(true);
      setError(null);
      
      // Reset form
      setFormData({
        address: '',
        price: '',
        squareFeet: '',
        zipCode: '',
        description: '',
        status: 'active',
        images: ['', '', '']
      });

      // Redirect to listings page after 1.5 seconds
      setTimeout(() => {
        navigate('/listings');
      }, 1500);
    } else {
      // Handle validation errors from backend
      if (response.details) {
        setFieldErrors(response.details);
      }
      setError(response.message);
    }
  };

  return (
    <div className="create-listing-container">
      <div className="create-listing-form-wrapper">
        <h1>Create New Listing</h1>
        <p className="form-subtitle">Fill in the details about your property</p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            Listing created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="listing-form">
          {/* Address Field */}
          <div className="form-group">
            <label htmlFor="address">Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g., 123 Main St, Huntsville, AL 35801"
              className={fieldErrors.address ? 'input-error' : ''}
              disabled={loading}
            />
            {fieldErrors.address && (
              <span className="field-error">{fieldErrors.address}</span>
            )}
          </div>

          {/* Price Field */}
          <div className="form-group">
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="e.g., 250000"
              className={fieldErrors.price ? 'input-error' : ''}
              disabled={loading}
              step="1000"
              min="0"
            />
            {fieldErrors.price && (
              <span className="field-error">{fieldErrors.price}</span>
            )}
          </div>

          {/* Square Footage Field */}
          <div className="form-group">
            <label htmlFor="squareFeet">Square Footage *</label>
            <input
              type="number"
              id="squareFeet"
              name="squareFeet"
              value={formData.squareFeet}
              onChange={handleChange}
              placeholder="e.g., 1500"
              className={fieldErrors.squareFeet ? 'input-error' : ''}
              disabled={loading}
              min="0"
            />
            {fieldErrors.squareFeet && (
              <span className="field-error">{fieldErrors.squareFeet}</span>
            )}
          </div>

          {/* ZIP Code Field */}
          <div className="form-group">
            <label htmlFor="zipCode">ZIP Code *</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="e.g., 35801"
              className={fieldErrors.zipCode ? 'input-error' : ''}
              disabled={loading}
            />
            <small>Format: 5 digits (35801) or 5+4 (35801-1234)</small>
            {fieldErrors.zipCode && (
              <span className="field-error">{fieldErrors.zipCode}</span>
            )}
          </div>

          {/* Status Field */}
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Description Field */}
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Additional details about the property..."
              rows="4"
              disabled={loading}
            />
          </div>

          {/* Images Fields */}
          <div className="form-group images-group">
            <label>Image URLs (Optional)</label>
            <p className="form-help-text">Enter up to 3 image URLs for your listing</p>
            
            {formData.images.map((image, index) => (
              <div key={index} className="image-input-wrapper">
                <input
                  type="text"
                  name={`images[${index}]`}
                  value={image}
                  onChange={handleChange}
                  placeholder={`Image URL ${index + 1} (optional)`}
                  className={fieldErrors[`image_${index}`] ? 'input-error' : ''}
                  disabled={loading}
                />
                {fieldErrors[`image_${index}`] && (
                  <span className="field-error">{fieldErrors[`image_${index}`]}</span>
                )}
              </div>
            ))}
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Listing...' : 'Create Listing'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/listings')}
              disabled={loading}
            >
              Cancel
            </button>
          </div>

          <p className="form-note">* Required fields</p>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
