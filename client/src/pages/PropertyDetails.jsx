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

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const PropertyDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [property, setProperty] = useState(null);
  const [showingCount, setShowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Open houses and availability
  const [openHouses, setOpenHouses] = useState([]);
  const [agentAvailability, setAgentAvailability] = useState([]);

  // Tour form state
  const [showTourForm, setShowTourForm] = useState(false);
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

  const [showSoldForm, setShowSoldForm] = useState(false);
  const [soldFormData, setSoldFormData] = useState({
    closingDate: '',
    finalSalePrice: ''
  });
  const [soldSubmitting, setSoldSubmitting] = useState(false);
  const [soldError, setSoldError] = useState('');
  const [soldSuccess, setSoldSuccess] = useState('');

  const fetchProperty = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/listings/${id}`);
      setProperty(response.data.listing);
      setShowingCount(response.data.showingCount ?? 0);
    } catch (err) {
      console.error('Error fetching property:', err);
      setError(err.response?.data?.message || 'Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperty();
  }, [id]);

  // Fetch open houses and agent availability once property is loaded
  useEffect(() => {
    if (!property) return;

    const agentId = property.createdBy?._id || property.createdBy?.id || property.createdBy;

    axios.get(`/api/open-houses/public?listingId=${id}`)
      .then(res => setOpenHouses(res.data.openHouses || []))
      .catch(() => setOpenHouses([]));

    if (agentId) {
      axios.get(`/api/agents/${agentId}/availability`)
        .then(res => setAgentAvailability(res.data.availabilitySlots || []))
        .catch(() => setAgentAvailability([]));
    }
  }, [property, id]);

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
      // Handle authorization errors gracefully
      let errorMessage = 'Failed to submit showing request. Please try again.';
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to request a tour of this property. Please ensure you are signed in.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setSubmitError(errorMessage);
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
      // Handle authorization errors gracefully
      let errorMessage = 'Failed to delete listing';
      if (err.response?.status === 403) {
        errorMessage = 'You can only delete listings you created. You do not have permission to delete this listing.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      alert(errorMessage);
    }
  };

  const handleSoldFormChange = (e) => {
    const { name, value } = e.target;
    setSoldFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMarkAsSold = async (e) => {
    e.preventDefault();

    if (!soldFormData.closingDate || !soldFormData.finalSalePrice) {
      setSoldError('Closing date and final sale price are required.');
      return;
    }

    const parsedPrice = Number(soldFormData.finalSalePrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setSoldError('Final sale price must be a valid non-negative number.');
      return;
    }

    setSoldSubmitting(true);
    setSoldError('');
    setSoldSuccess('');

    try {
      await axios.patch(`/api/listings/${id}/sold`, {
        closingDate: new Date(`${soldFormData.closingDate}T00:00:00`).toISOString(),
        finalSalePrice: parsedPrice
      });

      await fetchProperty();
      setSoldSuccess('Listing marked as sold successfully.');
      setShowSoldForm(false);
    } catch (err) {
      console.error('Error marking listing as sold:', err);
      setSoldError(err.response?.data?.message || err.response?.data?.error || 'Failed to mark listing as sold.');
    } finally {
      setSoldSubmitting(false);
    }
  };

  if (loading) return <div className="property-details-page"><h2>Loading...</h2></div>;
  if (error) return <div className="property-details-page"><h2>Error: {error}</h2></div>;
  if (!property) return <div className="property-details-page"><h2>Property not found</h2></div>;

  const ownerId = property.createdBy && typeof property.createdBy === 'object'
    ? (property.createdBy._id || property.createdBy.id)
    : property.createdBy;
  const currentAgentId = user?._id || user?.id;
  const isOwner = Boolean(isAuthenticated() && currentAgentId && ownerId && String(ownerId) === String(currentAgentId));
  const canMarkAsSold = isOwner && ['active', 'pending'].includes(property.status);
  const isSold = property.status === 'sold';

  const gallery = property.images && property.images.length > 0
    ? [...property.images, ...interiorImages.map((i) => i.url)].slice(0, 6)
    : interiorImages.map((i) => i.url).slice(0, 6);

  return (
    <div className="property-details-page">
      {isOwner && (
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '16px'
        }}>
          {canMarkAsSold && (
            <button
              type="button"
              onClick={() => {
                setShowSoldForm((prev) => !prev);
                setSoldError('');
                setSoldSuccess('');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1d4ed8',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {showSoldForm ? 'Cancel' : 'Mark as Sold'}
            </button>
          )}
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

          {soldSuccess && <p className="sold-form-success">{soldSuccess}</p>}
          {soldError && <p className="sold-form-error">{soldError}</p>}

          {canMarkAsSold && showSoldForm && (
            <form className="sold-inline-form" onSubmit={handleMarkAsSold}>
              <label>
                Closing Date
                <input
                  type="date"
                  name="closingDate"
                  value={soldFormData.closingDate}
                  onChange={handleSoldFormChange}
                  required
                />
              </label>

              <label>
                Final Sale Price
                <input
                  type="number"
                  name="finalSalePrice"
                  value={soldFormData.finalSalePrice}
                  onChange={handleSoldFormChange}
                  min="0"
                  step="0.01"
                  required
                />
              </label>

              <button type="submit" disabled={soldSubmitting}>
                {soldSubmitting ? 'Saving...' : 'Confirm Sale'}
              </button>
            </form>
          )}
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
            {isAuthenticated() && isOwner && (
              <span>{(property.viewCount ?? 0).toLocaleString()} views</span>
            )}
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
              {isAuthenticated() && isOwner && (
                <li>Total Showings: {showingCount.toLocaleString()}</li>
              )}
              {isSold && property.finalSalePrice !== undefined && property.finalSalePrice !== null && (
                <li>Final Sale Price: ${Number(property.finalSalePrice).toLocaleString()}</li>
              )}
              {isSold && property.closingDate && (
                <li>Closing Date: {new Date(property.closingDate).toLocaleDateString()}</li>
              )}
              {isSold && property.daysOnMarket !== undefined && property.daysOnMarket !== null && (
                <li>Days on Market: {property.daysOnMarket.toLocaleString()}</li>
              )}
              {property.createdBy && (
                <li>Listed by: {property.createdBy.name || property.createdBy.email}</li>
              )}
            </ul>
          </section>

          {openHouses.length > 0 && (
            <section className="property-details-open-houses">
              <h2>Upcoming Open Houses</h2>
              <ul className="open-house-list">
                {openHouses.map((oh) => (
                  <li key={oh._id} className="open-house-item">
                    <span className="open-house-date">
                      {new Date(oh.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="open-house-time">{oh.startTime} – {oh.endTime}</span>
                    {oh.notes && <span className="open-house-notes">{oh.notes}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {agentAvailability.length > 0 && (
            <section className="property-details-availability">
              <h2>Agent Availability</h2>
              <ul className="availability-list">
                {agentAvailability
                  .slice()
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((slot, idx) => (
                    <li key={idx} className="availability-item">
                      <span className="availability-day">{DAY_NAMES[slot.dayOfWeek]}</span>
                      <span className="availability-time">{slot.startTime} – {slot.endTime}</span>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="property-details-sidebar">
          <div className="property-details-card">
            <h3>Request a Custom Time</h3>

            {isAuthenticated() ? (
              <>
                {!showTourForm && !submitSuccess && (
                  <button
                    type="button"
                    className="tour-request-btn"
                    onClick={() => setShowTourForm(true)}
                  >
                    Request a Showing
                  </button>
                )}

                {submitSuccess && (
                  <div className="alert alert-success">
                    <div className="alert-content">
                      <span className="alert-icon">✓</span>
                      <span className="alert-message">
                        Tour request submitted! The listing agent will contact you soon.
                      </span>
                    </div>
                    <button
                      className="alert-close"
                      onClick={() => { setSubmitSuccess(false); setShowTourForm(false); }}
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

                {showTourForm && !submitSuccess && (
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
                      Preferred Date &amp; Time
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

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Request'}
                      </button>
                      <button
                        type="button"
                        className="tour-cancel-btn"
                        onClick={() => { setShowTourForm(false); setSubmitError(''); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="tour-signin-gate">
                <button
                  type="button"
                  className="tour-request-btn tour-request-btn--disabled"
                  disabled
                  title="Sign in to request a showing"
                >
                  Request a Showing
                </button>
                <p className="tour-signin-hint">
                  <Link to="/signin">Sign in</Link> to request a showing for this property.
                </p>
              </div>
            )}
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
