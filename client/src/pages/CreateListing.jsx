import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AddressAutocomplete from '../components/AddressAutocomplete';
import TagPicker from '../components/TagPicker';
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
  const [addressCoordinates, setAddressCoordinates] = useState(null);
  const [addressVerified, setAddressVerified] = useState(false);

  const [tags, setTags] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const fileInputRef = useRef(null);

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/signin');
    return null;
  }

  const handleAddressSelect = ({ address, zipCode, coordinates }) => {
    if (address) {
      setFormData(prev => ({
        ...prev,
        address,
        zipCode: zipCode || prev.zipCode
      }));
      setAddressCoordinates(coordinates);
      setAddressVerified(true);
      setErrors(prev => ({ ...prev, address: '' }));
    } else {
      setAddressVerified(false);
      setAddressCoordinates(null);
    }
  };

  // Individual field validators
  const validateAddress = (value) => {
    if (!value.trim()) {
      return 'Address is required';
    }
    if (!addressVerified) {
      return 'Select a verified address from the dropdown';
    }
    return '';
  };

  const validatePrice = (value) => {
    if (!value) {
      return 'Price is required';
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return 'Price must be a valid number';
    }
    if (numValue <= 0) {
      return 'Price must be greater than 0';
    }
    if (numValue > 100000000) {
      return 'Price seems unreasonably high (max $100M)';
    }
    return '';
  };

  const validateSquareFeet = (value) => {
    if (!value) {
      return 'Square footage is required';
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return 'Square footage must be a valid number';
    }
    if (numValue <= 0) {
      return 'Square footage must be greater than 0';
    }
    if (numValue < 50) {
      return 'Square footage seems too small (min 50 sq ft)';
    }
    if (numValue > 1000000) {
      return 'Square footage seems unreasonably high (max 1M sq ft)';
    }
    return '';
  };

  const validateZipCode = (value) => {
    if (!value.trim()) {
      return 'ZIP code is required';
    }
    if (!/^\d{5}(-\d{4})?$/.test(value.trim())) {
      return 'ZIP code must be in format: 12345 or 12345-6789';
    }
    return '';
  };

  const validateDescription = (value) => {
    if (!value || !value.trim()) {
      return 'Description is required';
    }
    if (value.trim().length < 10) {
      return 'Description must be at least 10 characters';
    }
    if (value.trim().length > 2000) {
      return 'Description must not exceed 2000 characters';
    }
    return '';
  };

  const validateImageUrl = (url) => {
    if (!url.trim()) {
      return 'Image URL cannot be empty';
    }
    try {
      new URL(url);
      const isValidImageUrl = 
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) ||
        url.includes('unsplash.com') ||
        url.includes('cloudinary.com') ||
        url.includes('imgur.com') ||
        url.includes('amazonaws.com');
      
      if (!isValidImageUrl) {
        return 'URL should be a valid image link';
      }
      return '';
    } catch {
      return 'Please enter a valid URL';
    }
  };

  const validateForm = () => {
    const newErrors = {};

    const addressError = validateAddress(formData.address);
    if (addressError) newErrors.address = addressError;

    const priceError = validatePrice(formData.price);
    if (priceError) newErrors.price = priceError;

    const squareFeetError = validateSquareFeet(formData.squareFeet);
    if (squareFeetError) newErrors.squareFeet = squareFeetError;

    const zipCodeError = validateZipCode(formData.zipCode);
    if (zipCodeError) newErrors.zipCode = zipCodeError;

    const descriptionError = validateDescription(formData.description);
    if (descriptionError) newErrors.description = descriptionError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Mark field as touched
    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));

    // Clear submit error when user starts editing
    if (errors.submit) {
      setErrors((prev) => ({ ...prev, submit: '' }));
    }

    // Real-time validation for touched fields
    if (touched[name]) {
      let error = '';
      switch (name) {
        case 'address':
          error = validateAddress(value);
          break;
        case 'price':
          error = validatePrice(value);
          break;
        case 'squareFeet':
          error = validateSquareFeet(value);
          break;
        case 'zipCode':
          error = validateZipCode(value);
          break;
        case 'description':
          error = validateDescription(value);
          break;
        default:
          break;
      }
      
      setErrors((prev) => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));

    // Validate on blur
    let error = '';
    switch (name) {
      case 'address':
        error = validateAddress(formData[name]);
        break;
      case 'price':
        error = validatePrice(formData[name]);
        break;
      case 'squareFeet':
        error = validateSquareFeet(formData[name]);
        break;
      case 'zipCode':
        error = validateZipCode(formData[name]);
        break;
      case 'description':
        error = validateDescription(formData[name]);
        break;
      default:
        break;
    }
    
    if (error) {
      setErrors((prev) => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleAddImage = () => {
    const error = validateImageUrl(imageInput);
    if (error) {
      setErrors((prev) => ({ ...prev, imageInput: error }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, imageInput.trim()]
    }));
    setImageInput('');
    setErrors((prev) => ({ ...prev, imageInput: '' }));
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const uploadFiles = async (files) => {
    const allowed = Array.from(files).filter(f => /^image\/(jpeg|png|gif|webp)$/.test(f.type));
    if (!allowed.length) {
      setUploadError('Only jpg, png, gif, and webp images are allowed.');
      return;
    }
    setUploadError('');
    setUploadingFiles(true);
    try {
      const data = new FormData();
      allowed.forEach(f => data.append('images', f));
      const res = await axios.post('/api/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, images: [...prev.images, ...res.data.urls] }));
    } catch (err) {
      setUploadError(err.response?.data?.error || 'Upload failed. Please try again.');
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleFilePick = (e) => {
    if (e.target.files?.length) uploadFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      address: true,
      price: true,
      squareFeet: true,
      zipCode: true,
      description: true
    });

    if (!validateForm()) {
      setErrors((prev) => ({ 
        ...prev, 
        submit: 'Please fix all validation errors before submitting' 
      }));
      setShowErrorAlert(true);
      return;
    }

    setLoading(true);
    setErrors({});
    setShowErrorAlert(false);
    setShowSuccessAlert(false);

    try {
      const payload = {
        address: formData.address.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        squareFeet: Number(formData.squareFeet),
        zipCode: formData.zipCode.trim(),
        status: formData.status,
        images: formData.images,
        tags,
      };

      if (addressCoordinates) {
        payload.location = {
          type: 'Point',
          coordinates: addressCoordinates
        };
      }

      const response = await axios.post('/api/listings', payload);

      setSuccess('✓ Listing created successfully! Redirecting...');
      setShowSuccessAlert(true);
      setTimeout(() => {
        navigate('/listings/mine');
      }, 1500);
    } catch (err) {
      // Handle authorization errors gracefully
      let errorMessage = 'Failed to create listing';
      
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to create listings. Please ensure you are signed in as an agent.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      
      setErrors({ submit: errorMessage });
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const dismissAlert = (type) => {
    if (type === 'error') {
      setShowErrorAlert(false);
      setErrors({ submit: '' });
    } else if (type === 'success') {
      setShowSuccessAlert(false);
      setSuccess('');
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
    <>
    {lightboxSrc && (
      <div className="img-lightbox" onClick={() => setLightboxSrc(null)}>
        <button className="img-lightbox-close" onClick={() => setLightboxSrc(null)}>✕</button>
        <img src={lightboxSrc} alt="Full preview" referrerPolicy="no-referrer" onClick={e => e.stopPropagation()} />
      </div>
    )}
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

        {showSuccessAlert && success && (
          <motion.div 
            className="alert alert-success" 
            variants={itemVariants}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="alert-content">
              <span className="alert-icon">✓</span>
              <span className="alert-message">{success}</span>
            </div>
            <button 
              className="alert-close"
              onClick={() => dismissAlert('success')}
              aria-label="Close success message"
            >
              ✕
            </button>
          </motion.div>
        )}

        {showErrorAlert && errors.submit && (
          <motion.div 
            className="alert alert-error" 
            variants={itemVariants}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="alert-content">
              <span className="alert-icon">⚠</span>
              <span className="alert-message">{errors.submit}</span>
            </div>
            <button 
              className="alert-close"
              onClick={() => dismissAlert('error')}
              aria-label="Close error message"
            >
              ✕
            </button>
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
          <motion.div className={`form-group ${errors.address && touched.address ? 'has-error' : ''}`} variants={itemVariants}>
            <label htmlFor="address">
              Address <span className="required">*</span>
            </label>
            <AddressAutocomplete
              value={formData.address}
              onChange={handleAddressSelect}
              error={touched.address ? errors.address : ''}
              verified={addressVerified}
            />
          </motion.div>

          {/* Price Field */}
          <motion.div className={`form-group ${errors.price && touched.price ? 'has-error' : ''}`} variants={itemVariants}>
            <label htmlFor="price">
              Price ($) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="250000"
              min="0"
              step="1"
              className={errors.price && touched.price ? 'input-error' : ''}
            />
            {errors.price && touched.price && (
              <span className="error-message">{errors.price}</span>
            )}
          </motion.div>

          {/* Square Feet Field */}
          <motion.div className={`form-group ${errors.squareFeet && touched.squareFeet ? 'has-error' : ''}`} variants={itemVariants}>
            <label htmlFor="squareFeet">
              Square Feet <span className="required">*</span>
            </label>
            <input
              type="number"
              id="squareFeet"
              name="squareFeet"
              value={formData.squareFeet}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="2000"
              min="0"
              step="1"
              className={errors.squareFeet && touched.squareFeet ? 'input-error' : ''}
            />
            {errors.squareFeet && touched.squareFeet && (
              <span className="error-message">{errors.squareFeet}</span>
            )}
          </motion.div>

          {/* ZIP Code Field */}
          <motion.div className={`form-group ${errors.zipCode && touched.zipCode ? 'has-error' : ''}`} variants={itemVariants}>
            <label htmlFor="zipCode">
              ZIP Code <span className="required">*</span>
            </label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="35801 or 35801-1234"
              maxLength="10"
              className={errors.zipCode && touched.zipCode ? 'input-error' : ''}
            />
            {errors.zipCode && touched.zipCode && (
              <span className="error-message">{errors.zipCode}</span>
            )}
          </motion.div>

          {/* Description Field */}
          <motion.div className={`form-group form-group-full ${errors.description && touched.description ? 'has-error' : ''}`} variants={itemVariants}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="Describe the property (min 10 characters)"
              rows="5"
              maxLength="2000"
              className={errors.description && touched.description ? 'input-error' : ''}
            />
            <div className="field-info">
              <span className="char-count">
                {formData.description.length}/2000 characters
              </span>
            </div>
            {errors.description && touched.description && (
              <span className="error-message">{errors.description}</span>
            )}
          </motion.div>

          {/* Tags Field */}
          <motion.div className="form-group form-group-full" variants={itemVariants}>
            <label>Neighborhood &amp; Lifestyle Tags (Optional)</label>
            <TagPicker selected={tags} onChange={setTags} />
          </motion.div>

          {/* Status Field */}
          <motion.div className="form-group" variants={itemVariants}>
            <label htmlFor="status">
              Status <span className="required">*</span>
            </label>
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
            <label>Property Images (Optional)</label>

            {/* Drop zone */}
            <div
              className={`img-drop-zone${dragOver ? ' img-drop-zone--over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                style={{ display: 'none' }}
                onChange={handleFilePick}
              />
              {uploadingFiles ? (
                <span className="img-drop-uploading">Uploading…</span>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span className="img-drop-label">Drop photos here or <u>browse</u></span>
                  <span className="img-drop-hint">JPG, PNG, GIF, WEBP · max 10 MB each</span>
                </>
              )}
            </div>
            {uploadError && <span className="error-message">{uploadError}</span>}

            {/* URL input row */}
            <div className="image-input-group" style={{ marginTop: '0.6rem' }}>
              <input
                type="url"
                id="imageInput"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="Or paste an image URL"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleAddImage(); }
                }}
                className={errors.imageInput ? 'input-error' : ''}
              />
              <button type="button" onClick={handleAddImage} className="btn-add-image">
                Add URL
              </button>
            </div>
            {errors.imageInput && <span className="error-message">{errors.imageInput}</span>}

            {formData.images.length > 0 && (
              <div className="img-preview-grid">
                {formData.images.map((image, index) => (
                  <motion.div
                    key={index}
                    className="img-preview-cell"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <img
                      src={image}
                      alt={`Preview ${index + 1}`}
                      referrerPolicy="no-referrer"
                      className="img-preview-thumb"
                      onClick={() => setLightboxSrc(image)}
                    />
                    <button
                      type="button"
                      className="img-preview-remove"
                      onClick={() => handleRemoveImage(index)}
                      title="Remove"
                    >
                      ✕
                    </button>
                    {index === 0 && <span className="img-preview-badge">Cover</span>}
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
    </>
  );
};

export default CreateListing;
