import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import BookmarkStar from './BookmarkStar';
import PropertyMap from './PropertyMap';
import Footer from './Footer';
import { useAuth } from '../context/AuthContext';
import '../styles/ListingPanel.css';

const formatTime12 = (time) => {
  if (!time) return time;
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
};

const ListingPanel = ({ listingId, onClose }) => {
  const { isAuthenticated, user, mockUser } = useAuth();
  const canRequest = isAuthenticated() || !!mockUser;

  const [listing, setListing] = useState(null);
  const [showingCount, setShowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mapCoordinates, setMapCoordinates] = useState(null);
  const [openHouses, setOpenHouses] = useState([]);
  const [agentAvailability, setAgentAvailability] = useState([]);

  const [formData, setFormData] = useState({
    name: mockUser?.name || '', email: mockUser?.email || '',
    phone: '', preferredDate: '', message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [showSoldForm, setShowSoldForm] = useState(false);
  const [soldFormData, setSoldFormData] = useState({ closingDate: '', finalSalePrice: '' });
  const [soldSubmitting, setSoldSubmitting] = useState(false);
  const [soldError, setSoldError] = useState('');
  const [soldSuccess, setSoldSuccess] = useState('');

  const fetchListing = () => {
    if (!listingId) return;
    setLoading(true);
    setListing(null);
    setMapCoordinates(null);
    setOpenHouses([]);
    setAgentAvailability([]);
    setSubmitSuccess(false);
    setSubmitError('');
    setSoldSuccess('');
    setSoldError('');
    setShowSoldForm(false);

    axios.get(`/api/listings/${listingId}`)
      .then(r => {
        const l = r.data.listing;
        setListing(l);
        setShowingCount(r.data.showingCount ?? 0);

        if (l.location?.coordinates?.length === 2) {
          setMapCoordinates(l.location.coordinates);
        } else {
          const token = import.meta.env.VITE_MAPBOX_TOKEN;
          if (token && l.address) {
            fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(l.address)}.json?access_token=${token}&country=us&types=address&limit=1`)
              .then(r => r.json())
              .then(data => {
                const coords = data.features?.[0]?.geometry?.coordinates;
                if (coords) setMapCoordinates(coords);
              })
              .catch(() => {});
          }
        }

        const agentId = l.createdBy?._id || l.createdBy?.id || l.createdBy;
        axios.get(`/api/open-houses/public?listingId=${listingId}`)
          .then(res => setOpenHouses(res.data.openHouses || []))
          .catch(() => {});
        if (agentId) {
          axios.get(`/api/agents/${agentId}/availability`)
            .then(res => setAgentAvailability(res.data.availabilitySlots || []))
            .catch(() => {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchListing(); }, [listingId]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const validateTour = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    else if (formData.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = 'Invalid email address';
    if (!formData.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[\d\s\-\(\)\+]+$/.test(formData.phone)) errors.phone = 'Invalid phone number';
    if (!formData.preferredDate) {
      errors.preferredDate = 'Date is required';
    } else {
      const sel = new Date(formData.preferredDate);
      const min = new Date();
      min.setDate(min.getDate() + 7);
      if (sel < min) errors.preferredDate = 'Must be at least 1 week in advance';
    }
    if (formData.message && formData.message.length > 1000) errors.message = 'Max 1000 characters';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleTourSubmit = async (e) => {
    e.preventDefault();
    if (!validateTour()) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await axios.post('/api/showings', {
        listing: listingId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        preferredDate: new Date(formData.preferredDate).toISOString(),
        message: formData.message.trim(),
      });
      if (res.data.showing?._id) {
        const stored = JSON.parse(localStorage.getItem('c2c_my_showings') || '[]');
        if (!stored.includes(res.data.showing._id)) {
          localStorage.setItem('c2c_my_showings', JSON.stringify([...stored, res.data.showing._id]));
        }
      }
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', phone: '', preferredDate: '', message: '' });
    } catch (err) {
      let msg = 'Failed to submit request. Please try again.';
      if (err.response?.status === 403) msg = 'You must be signed in to request a showing.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
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
    try {
      await axios.patch(`/api/listings/${listingId}/sold`, {
        closingDate: new Date(`${soldFormData.closingDate}T00:00:00`).toISOString(),
        finalSalePrice: parsedPrice,
      });
      setSoldSuccess('Listing marked as sold successfully.');
      setShowSoldForm(false);
      fetchListing();
    } catch (err) {
      setSoldError(err.response?.data?.message || err.response?.data?.error || 'Failed to mark as sold.');
    } finally {
      setSoldSubmitting(false);
    }
  };

  if (!listing && !loading) return null;

  const gallery = listing?.images?.slice(0, 6) || [];
  const ownerId = listing?.createdBy && typeof listing.createdBy === 'object'
    ? (listing.createdBy._id || listing.createdBy.id)
    : listing?.createdBy;
  const currentAgentId = user?._id || user?.id;
  const isOwner = Boolean(isAuthenticated() && currentAgentId && ownerId && String(ownerId) === String(currentAgentId));
  const canMarkAsSold = isOwner && ['active', 'pending'].includes(listing?.status);
  const isSold = listing?.status === 'sold';
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingSlots = agentAvailability.filter(s => s.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  return (
    <>
      <motion.div
        className="listing-panel-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.div
        className="listing-panel"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 32 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="listing-panel-close" onClick={onClose} aria-label="Close">✕</button>

        {loading ? (
          <div className="listing-panel-loading">
            <div className="listing-panel-skeleton-img" />
            <div className="listing-panel-skeleton-body">
              <div className="listing-panel-skeleton-line" style={{ width: '50%' }} />
              <div className="listing-panel-skeleton-line" style={{ width: '80%' }} />
              <div className="listing-panel-skeleton-line" style={{ width: '40%' }} />
            </div>
          </div>
        ) : listing ? (
          <div className="listing-panel-scroll">

            {/* Hero image gallery */}
            <div className="listing-panel-hero">
              <div className="listing-panel-main-img-wrap">
                {gallery[0]
                  ? <img src={gallery[0]} alt={listing.address} className="listing-panel-main-img" />
                  : <div className="listing-panel-no-img">No image</div>
                }
                {listing.status && listing.status !== 'active' && (
                  <span className="listing-panel-badge-hero">{listing.status.toUpperCase()}</span>
                )}
                <div className="listing-panel-hero-bookmark"><BookmarkStar listingId={listing._id} /></div>
              </div>
              <div className="listing-panel-thumb-grid">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="listing-panel-thumb">
                    {gallery[i + 1]
                      ? <img src={gallery[i + 1]} alt={`${listing.address} - Photo ${i + 2}`} />
                      : <div className="listing-panel-no-img" />
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Open house banner */}
            {openHouses.length > 0 && (
              <div className="listing-panel-oh-banner">
                <div className="listing-panel-oh-banner-inner">
                  <span className="listing-panel-oh-label">Open House</span>
                  <div className="listing-panel-oh-events">
                    {openHouses.map((oh) => (
                      <span key={oh._id} className="listing-panel-oh-event">
                        {new Date(oh.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}
                        &nbsp;·&nbsp;{formatTime12(oh.startTime)} – {formatTime12(oh.endTime)}
                        {oh.notes && <em> · {oh.notes}</em>}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="listing-panel-body">
              {/* Header */}
              <h1 className="listing-panel-address-title">{listing.address}</h1>
              <p className="listing-panel-zip">ZIP Code: {listing.zipCode}</p>

              <div className="listing-panel-highlights">
                <span>${listing.price?.toLocaleString()}</span>
                <span>{listing.squareFeet?.toLocaleString()} sqft</span>
                {listing.bedrooms != null && <span>{listing.bedrooms} bd</span>}
                {listing.bathrooms != null && <span>{listing.bathrooms} ba</span>}
                <span>Status: {listing.status}</span>
                {(listing.viewCount ?? 0) > 0 && <span>👁 {listing.viewCount.toLocaleString()} views</span>}
              </div>

              <div className="listing-panel-columns">
                {/* Left: main details */}
                <div className="listing-panel-details">

                  <section className="listing-panel-section">
                    <h2>About this home</h2>
                    {listing.description ? (
                      <p>{listing.description}</p>
                    ) : (
                      <>
                        <p>Welcome to this property located at {listing.address}. This beautifully maintained property offers {listing.squareFeet?.toLocaleString()} square feet of living space. The property is currently {listing.status} and is priced at ${listing.price?.toLocaleString()}.</p>
                        <p>Located in the {listing.zipCode} area, this property offers convenient access to local amenities and is perfect for those looking for quality living space. Don&apos;t miss your chance to make this exceptional property your new home.</p>
                      </>
                    )}
                  </section>

                  <section className="listing-panel-section">
                    <h2>Property Information</h2>
                    <ul className="listing-panel-info-list">
                      <li><span>Square Feet</span><span>{listing.squareFeet?.toLocaleString()}</span></li>
                      {listing.bedrooms != null && <li><span>Bedrooms</span><span>{listing.bedrooms}</span></li>}
                      {listing.bathrooms != null && <li><span>Bathrooms</span><span>{listing.bathrooms}</span></li>}
                      <li><span>ZIP Code</span><span>{listing.zipCode}</span></li>
                      <li><span>Status</span><span>{listing.status}</span></li>
                      <li><span>Price</span><span>${listing.price?.toLocaleString()}</span></li>
                      {isOwner && <li><span>Total Showings</span><span>{showingCount.toLocaleString()}</span></li>}
                      {isSold && listing.finalSalePrice != null && (
                        <li><span>Final Sale Price</span><span>${Number(listing.finalSalePrice).toLocaleString()}</span></li>
                      )}
                      {isSold && listing.closingDate && (
                        <li><span>Closing Date</span><span>{new Date(listing.closingDate).toLocaleDateString()}</span></li>
                      )}
                      {isSold && listing.daysOnMarket != null && (
                        <li><span>Days on Market</span><span>{listing.daysOnMarket.toLocaleString()}</span></li>
                      )}
                      {listing.createdBy && (
                        <li><span>Listed by</span><span>{listing.createdBy.name || listing.createdBy.email}</span></li>
                      )}
                    </ul>
                  </section>

                  {listing.tags?.length > 0 && (
                    <section className="listing-panel-section">
                      <h2>Neighborhood &amp; Lifestyle</h2>
                      <div className="listing-panel-tags">
                        {listing.tags.map(tag => <span key={tag} className="listing-panel-tag">{tag}</span>)}
                      </div>
                    </section>
                  )}

                  <PropertyMap coordinates={mapCoordinates} address={listing.address} />
                </div>

                {/* Right sidebar */}
                <aside className="listing-panel-sidebar">
                  {/* Agent card */}
                  <div className="listing-panel-agent-card">
                    <p className="listing-panel-agent-label">
                      Agent: {listing.createdBy?.name || 'Listed by Agent'}
                    </p>
                  </div>

                  {/* Owner controls */}
                  {isOwner && (
                    <div className="listing-panel-owner-card">
                      {soldSuccess && <div className="listing-panel-success">{soldSuccess}</div>}
                      {canMarkAsSold && !showSoldForm && (
                        <button className="listing-panel-sold-btn" onClick={() => setShowSoldForm(true)}>
                          Mark as Sold
                        </button>
                      )}
                      {showSoldForm && (
                        <form className="listing-panel-form" onSubmit={handleMarkAsSold}>
                          <h4>Mark as Sold</h4>
                          {soldError && <div className="listing-panel-form-error">{soldError}</div>}
                          <label>Closing Date
                            <input type="date" name="closingDate" value={soldFormData.closingDate}
                              onChange={e => setSoldFormData(p => ({ ...p, closingDate: e.target.value }))} />
                          </label>
                          <label>Final Sale Price ($)
                            <input type="number" name="finalSalePrice" value={soldFormData.finalSalePrice} min="0"
                              onChange={e => setSoldFormData(p => ({ ...p, finalSalePrice: e.target.value }))} />
                          </label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button type="submit" disabled={soldSubmitting}>
                              {soldSubmitting ? 'Saving...' : 'Confirm Sale'}
                            </button>
                            <button type="button" className="listing-panel-cancel-btn" onClick={() => setShowSoldForm(false)}>
                              Cancel
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                  )}

                  {/* Tour request */}
                  <div className="listing-panel-tour-card">
                    <h3>Request a Showing</h3>

                    {canRequest ? (
                      <>
                        {upcomingSlots.length > 0 && (
                          <div className="listing-panel-availability">
                            <p>Agent available:</p>
                            <ul>
                              {upcomingSlots.map((slot, i) => (
                                <li key={i}>
                                  <span>{new Date(slot.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                  <span>{formatTime12(slot.startTime)} – {formatTime12(slot.endTime)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {submitSuccess ? (
                          <div className="listing-panel-success">
                            ✓ Tour request submitted! The listing agent will contact you soon.
                          </div>
                        ) : (
                          <form className="listing-panel-form" onSubmit={handleTourSubmit}>
                            {submitError && <div className="listing-panel-form-error">{submitError}</div>}
                            <label>Name
                              <input type="text" name="name" value={formData.name} onChange={handleFormChange} placeholder="Your name" className={formErrors.name ? 'input-error' : ''} />
                              {formErrors.name && <span className="error-message">{formErrors.name}</span>}
                            </label>
                            <label>Email
                              <input type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="you@example.com" className={formErrors.email ? 'input-error' : ''} />
                              {formErrors.email && <span className="error-message">{formErrors.email}</span>}
                            </label>
                            <label>Phone
                              <input type="tel" name="phone" value={formData.phone} onChange={handleFormChange} placeholder="(555) 123-4567" className={formErrors.phone ? 'input-error' : ''} />
                              {formErrors.phone && <span className="error-message">{formErrors.phone}</span>}
                            </label>
                            <label>Preferred Date &amp; Time
                              <input
                                type="datetime-local"
                                name="preferredDate"
                                value={formData.preferredDate}
                                onChange={handleFormChange}
                                min={(() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 16); })()}
                                className={formErrors.preferredDate ? 'input-error' : ''}
                              />
                              {formErrors.preferredDate && <span className="error-message">{formErrors.preferredDate}</span>}
                            </label>
                            <label>Message
                              <textarea name="message" value={formData.message} onChange={handleFormChange} rows="3" placeholder="Any questions or special requests?" className={formErrors.message ? 'input-error' : ''} />
                              {formErrors.message && <span className="error-message">{formErrors.message}</span>}
                            </label>
                            <button type="submit" disabled={submitting}>
                              {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                          </form>
                        )}
                      </>
                    ) : (
                      <div className="tour-signin-gate">
                        <button type="button" className="tour-request-btn tour-request-btn--disabled" disabled title="Sign in to request a showing">
                          Request a Showing
                        </button>
                        <p className="tour-signin-hint">
                          <Link to="/signin" onClick={onClose}>Sign in</Link> to request a showing for this property.
                        </p>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </div>
            <div className="listing-panel-footer">
              <Footer />
            </div>
          </div>
        ) : (
          <p className="listing-panel-error">Failed to load listing.</p>
        )}
      </motion.div>
    </>
  );
};

export default ListingPanel;
