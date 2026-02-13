import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/CreateListing.css';

const CreateListing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
  const [success, setSuccess] = useState('');
  const [imageInput, setImageInput] = useState('');

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/signin');
    return null;
  }

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
    // Clear error for this field when user starts typing
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
      const response = await axios.post('/api/listings', {
        address: formData.address.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        squareFeet: Number(formData.squareFeet),
        zipCode: formData.zipCode.trim(),
        status: formData.status,
        images: formData.images
      });

      setSuccess('Listing created successfully! Redirecting...');
      setTimeout(() => {
        navigate('/listings');
      }, 1500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to create listing';
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

  return (
    <motion.div
      className="create-listing-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="create-listing-content">
        <motion.div className="create-listing-header" variants={itemVariants}>
          <h1>Create New Listing</h1>
          <p>Add a new property to your portfolio</p>
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
              {loading ? 'Creating...' : 'Create Listing'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/listings')}
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

export default CreateListing;
