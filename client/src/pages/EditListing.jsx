import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/CreateListing.css';

const EditListing = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    address: '',
    description: '',
    price: '',
    squareFeet: '',
    zipCode: '',
    status: 'active',
    images: []
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [success, setSuccess] = useState('');
  const [imageInput, setImageInput] = useState('');

  // Redirect unauthenticated users to sign in
  if (!isAuthenticated()) {
    navigate('/signin');
    return null;
  }

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await axios.get(`/api/listings/${id}`);
        const listing = response.data.listing;

        // Check ownership: only the owning agent may edit
        // createdBy is an unpopulated ObjectId, so compare via String()
        if (user?._id && listing.createdBy && String(listing.createdBy) !== user._id) {
          setFetchError('You do not have permission to edit this listing.');
          return;
        }

        setFormData({
          address: listing.address || '',
          description: listing.description || '',
          price: listing.price !== undefined ? String(listing.price) : '',
          squareFeet: listing.squareFeet !== undefined ? String(listing.squareFeet) : '',
          zipCode: listing.zipCode || '',
          status: listing.status || 'active',
          images: listing.images || []
        });
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load listing');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (Number(formData.price) < 0) {
      newErrors.price = 'Price must be a positive number';
    }

    if (!formData.squareFeet) {
      newErrors.squareFeet = 'Square footage is required';
    } else if (Number(formData.squareFeet) < 0) {
      newErrors.squareFeet = 'Square footage must be a positive number';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
      newErrors.zipCode = 'ZIP code must be valid (e.g., 35801 or 35801-1234)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddImage = () => {
    if (imageInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageInput.trim()]
      }));
      setImageInput('');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await axios.put(`/api/listings/${id}`, {
        address: formData.address.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        squareFeet: Number(formData.squareFeet),
        zipCode: formData.zipCode.trim(),
        status: formData.status,
        images: formData.images
      });

      setSuccess('Listing updated successfully! Redirecting...');
      setTimeout(() => {
        navigate(`/property/${id}`);
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update listing';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  if (fetchLoading) {
    return (
      <div className="create-listing-container">
        <div className="create-listing-content">
          <p className="listings-loading">Loading listing...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="create-listing-container">
        <div className="create-listing-content">
          <div className="alert alert-error">{fetchError}</div>
          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(`/property/${id}`)}
              className="btn btn-secondary"
            >
              Back to Listing
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="create-listing-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="create-listing-content">
        <motion.div className="create-listing-header" variants={itemVariants}>
          <h1>Edit Listing</h1>
          <p>Update the details for this property</p>
        </motion.div>

        {success && (
          <motion.div className="alert alert-success" variants={itemVariants}>
            {success}
          </motion.div>
        )}

        {errors.submit && (
          <motion.div className="alert alert-error" variants={itemVariants}>
            {errors.submit}
          </motion.div>
        )}

        <motion.form
          onSubmit={handleSubmit}
          className="create-listing-form"
          variants={formVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Address Field */}
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="address">Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter property address"
              className={errors.address ? 'input-error' : ''}
            />
            {errors.address && <span className="error-message">{errors.address}</span>}
          </motion.div>

          {/* Price Field */}
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="price">Price ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="Enter price"
              min="0"
              className={errors.price ? 'input-error' : ''}
            />
            {errors.price && <span className="error-message">{errors.price}</span>}
          </motion.div>

          {/* Square Feet Field */}
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="squareFeet">Square Footage *</label>
            <input
              type="number"
              id="squareFeet"
              name="squareFeet"
              value={formData.squareFeet}
              onChange={handleInputChange}
              placeholder="Enter square footage"
              min="0"
              className={errors.squareFeet ? 'input-error' : ''}
            />
            {errors.squareFeet && <span className="error-message">{errors.squareFeet}</span>}
          </motion.div>

          {/* ZIP Code Field */}
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="zipCode">ZIP Code *</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              placeholder="Enter ZIP code (e.g., 35801)"
              className={errors.zipCode ? 'input-error' : ''}
            />
            {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
          </motion.div>

          {/* Description Field */}
          <motion.div className="form-group form-group-full" variants={itemVariants}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter property description"
              rows="5"
            />
          </motion.div>

          {/* Status Field */}
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="sold">Sold</option>
              <option value="inactive">Inactive</option>
            </select>
          </motion.div>

          {/* Images Section */}
          <motion.div className="form-group form-group-full" variants={itemVariants}>
            <label htmlFor="imageInput">Images</label>
            <div className="image-input-group">
              <input
                type="url"
                id="imageInput"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="Paste image URL and click Add"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="btn-add-image"
              >
                Add Image
              </button>
            </div>
            {formData.images.length > 0 && (
              <div className="images-list">
                <p className="images-count">
                  {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} added
                </p>
                {formData.images.map((image, index) => (
                  <motion.div
                    key={index}
                    className="image-item"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="image-url">{image}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="btn-remove-image"
                    >
                      ✕
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Form Actions */}
          <motion.div className="form-actions" variants={itemVariants}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => navigate(`/property/${id}`)}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
          </motion.div>
        </motion.form>
      </div>
    </motion.div>
  );
};

export default EditListing;
