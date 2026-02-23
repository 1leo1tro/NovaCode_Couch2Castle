import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/PropertyDetails.css';

const interiorImages = [
  { url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', label: 'Living room' },
  { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80', label: 'Kitchen' },
  { url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=800&q=80', label: 'Bedroom' },
  { url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80', label: 'Bathroom' },
  { url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=800&q=80', label: 'Dining area' },
  { url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80', label: 'Interior view' },
];

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tour form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/listings/${id}`);
        setProperty(response.data.listing);
      } catch (err) {
        console.error('Error fetching property:', err);
        setError(err.response?.data?.message || 'Failed to load property details');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const validateTourForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name must not exceed 100 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Please provide a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone)) {
      errors.phone = 'Please provide a valid phone number';
    }

    // Date validation
    if (!formData.preferredDate) {
      errors.preferredDate = 'Preferred date is required';
    } else {
      const selectedDate = new Date(formData.preferredDate);
      const now = new Date();
      if (selectedDate <= now) {
        errors.preferredDate = 'Preferred date must be in the future';
      }
    }

    // Message validation (optional but max length)
    if (formData.message && formData.message.length > 1000) {
      errors.message = 'Message must not exceed 1000 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTourFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTourFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateTourForm()) {
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      await axios.post('/api/showings', {
        listing: id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        preferredDate: new Date(formData.preferredDate).toISOString(),
        message: formData.message.trim()
      });

      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        preferredDate: '',
        message: ''
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error submitting showing request:', err);
      setSubmitError(err.response?.data?.message || 'Failed to submit showing request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await axios.delete(`/api/listings/${id}`);
      navigate('/listings');
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  if (loading) return <div className="property-details-page"><h2>Loading...</h2></div>;
  if (error) return <div className="property-details-page"><h2>Error: {error}</h2></div>;
  if (!property) return <div className="property-details-page"><h2>Property not found</h2></div>;

  const gallery = property.images && property.images.length > 0
    ? [...property.images, ...interiorImages.map((i) => i.url)].slice(0, 6)
    : interiorImages.map((i) => i.url).slice(0, 6);

  return (
    <div className="property-details-page">
      {isAuthenticated() && user?._id && property.createdBy && String(property.createdBy) === user._id && (
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginBottom: '16px'
        }}>
          <Link
            to={`/listings/edit/${property._id}`}
            style={{
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Edit Listing
          </Link>
          <button
            onClick={handleDelete}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Delete Listing
          </button>
        </div>
      )}

      <div className="property-details-hero">
        <div className="property-details-main-image">
          <img src={gallery[0]} alt={property.address} />
          {property.status && property.status !== 'active' && (
            <span className="property-details-badge">{property.status.toUpperCase()}</span>
          )}
        </div>
        <div className="property-details-gallery-grid">
          {gallery.slice(1, 6).map((img, idx) => (
            <div key={idx} className="property-details-gallery-thumb">
              <img src={img} alt={`${property.address} - ${interiorImages[idx]?.label || 'Photo'}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="property-details-content">
        <div className="property-details-main">
          <h1>{property.address}</h1>
          <p className="property-details-address">ZIP Code: {property.zipCode}</p>

          <div className="property-details-highlights">
            <span>${property.price.toLocaleString()}</span>
            <span>{property.squareFeet.toLocaleString()} sqft</span>
            <span>Status: {property.status}</span>
          </div>

          <section className="property-details-description">
            <h2>About this home</h2>
            <p>
              Welcome to this property located at {property.address}. This beautifully maintained property
              offers {property.squareFeet.toLocaleString()} square feet of living space.
              The property is currently {property.status} and is priced at ${property.price.toLocaleString()}.
            </p>
            <p>
              Located in the {property.zipCode} area, this property offers convenient access to local amenities
              and is perfect for those looking for quality living space. Don&apos;t miss your chance to make
              this exceptional property your new home.
            </p>
          </section>

          <section className="property-details-features">
            <h2>Property Information</h2>
            <ul>
              <li>Square Feet: {property.squareFeet.toLocaleString()}</li>
              <li>ZIP Code: {property.zipCode}</li>
              <li>Status: {property.status}</li>
              <li>Price: ${property.price.toLocaleString()}</li>
              {property.createdBy && (
                <li>Listed by: {property.createdBy.name || property.createdBy.email}</li>
              )}
            </ul>
          </section>
        </div>

        <aside className="property-details-sidebar">
          <div className="property-details-card">
            <h3>Schedule a Tour</h3>

            {submitSuccess && (
              <div className="alert alert-success">
                <div className="alert-content">
                  <span className="alert-icon">✓</span>
                  <span className="alert-message">
                    Tour request submitted successfully! The listing agent will contact you soon.
                  </span>
                </div>
                <button
                  className="alert-close"
                  onClick={() => setSubmitSuccess(false)}
                  aria-label="Close success message"
                >
                  ×
                </button>
              </div>
            )}

            {submitError && (
              <div className="alert alert-error">
                <div className="alert-content">
                  <span className="alert-icon">⚠</span>
                  <span className="alert-message">{submitError}</span>
                </div>
                <button
                  className="alert-close"
                  onClick={() => setSubmitError('')}
                  aria-label="Close error message"
                >
                  ×
                </button>
              </div>
            )}

            <form className="tour-form" onSubmit={handleTourFormSubmit}>
              <label>
                Name
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleTourFormChange}
                  placeholder="Your name"
                  className={formErrors.name ? 'input-error' : ''}
                />
                {formErrors.name && <span className="error-message">{formErrors.name}</span>}
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleTourFormChange}
                  placeholder="you@example.com"
                  className={formErrors.email ? 'input-error' : ''}
                />
                {formErrors.email && <span className="error-message">{formErrors.email}</span>}
              </label>

              <label>
                Phone
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleTourFormChange}
                  placeholder="(555) 123-4567"
                  className={formErrors.phone ? 'input-error' : ''}
                />
                {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
              </label>

              <label>
                Preferred Date
                <input
                  type="datetime-local"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleTourFormChange}
                  className={formErrors.preferredDate ? 'input-error' : ''}
                />
                {formErrors.preferredDate && <span className="error-message">{formErrors.preferredDate}</span>}
              </label>

              <label>
                Message
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleTourFormChange}
                  rows="3"
                  placeholder="Any questions or special requests?"
                  className={formErrors.message ? 'input-error' : ''}
                />
                {formErrors.message && <span className="error-message">{formErrors.message}</span>}
              </label>

              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Request Tour'}
              </button>
            </form>
          </div>

          <div className="property-details-card property-details-agent">
            <div className="property-details-agent-avatar">
              {property.createdBy?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="property-details-agent-name">
                {property.createdBy?.name || 'Listed by Agent'}
              </p>
              <p className="property-details-agent-phone">
                {property.createdBy?.phone || '(555) 123-4567'}
              </p>
              <button type="button" className="property-details-agent-btn">Contact Agent</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PropertyDetails;
