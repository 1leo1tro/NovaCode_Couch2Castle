import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ListingSearchBar from '../components/ListingSearchBar';
import '../styles/App.css';

const MyListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
    zipCode: '',
    status: '',
    minSquareFeet: '',
    maxSquareFeet: '',
  });

  // Sold modal state
  const [soldModalId, setSoldModalId] = useState(null);
  const [soldForm, setSoldForm] = useState({ closingDate: '', finalSalePrice: '' });
  const [soldSubmitting, setSoldSubmitting] = useState(false);
  const [soldError, setSoldError] = useState('');

  const { user } = useAuth();

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', '100');
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.zipCode) params.append('zipCode', filters.zipCode);
      if (filters.status) params.append('status', filters.status);
      if (filters.minSquareFeet) params.append('minSquareFeet', filters.minSquareFeet);
      if (filters.maxSquareFeet) params.append('maxSquareFeet', filters.maxSquareFeet);

      const queryString = params.toString();
      const url = `/api/listings${queryString ? `?${queryString}` : ''}`;

      const response = await axios.get(url);
      const allListings = response.data.listings || [];
      const userId = user?._id || user?.id;
      const mine = allListings.filter((l) => {
        if (!l.createdBy || !userId) return false;
        const createdById = typeof l.createdBy === 'object' ? l.createdBy._id : l.createdBy;
        return String(createdById) === String(userId);
      });
      setListings(mine);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { fetchListings(); }, 300);
    return () => clearTimeout(timer);
  }, [filters, user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`/api/listings/${id}`);
      await fetchListings();
    } catch (err) {
      console.error('Error deleting listing:', err);
      let msg = 'Failed to delete listing';
      if (err.response?.status === 403) msg = 'You do not have permission to delete this listing.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      alert(msg);
    }
  };

  const openSoldModal = (id) => {
    setSoldModalId(id);
    setSoldForm({ closingDate: '', finalSalePrice: '' });
    setSoldError('');
  };

  const closeSoldModal = () => {
    setSoldModalId(null);
    setSoldError('');
  };

  const handleMarkAsSold = async (e) => {
    e.preventDefault();
    if (!soldForm.closingDate || !soldForm.finalSalePrice) {
      setSoldError('Closing date and final sale price are required.');
      return;
    }
    const parsedPrice = Number(soldForm.finalSalePrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setSoldError('Final sale price must be a valid number.');
      return;
    }
    setSoldSubmitting(true);
    setSoldError('');
    try {
      await axios.patch(`/api/listings/${soldModalId}/sold`, {
        closingDate: new Date(`${soldForm.closingDate}T00:00:00`).toISOString(),
        finalSalePrice: parsedPrice,
      });
      closeSoldModal();
      await fetchListings();
    } catch (err) {
      setSoldError(err.response?.data?.message || err.response?.data?.error || 'Failed to mark as sold.');
      setSoldSubmitting(false);
    }
  };

  return (
    <div className="my-listings-page">
      <div className="listings-header">
        <h1>My Listings</h1>
        <Link to="/listings/create" className="listings-create-btn">
          + Create Listing
        </Link>
      </div>

      <ListingSearchBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={fetchListings}
        placeholder="Search your listings..."
      />

      {error && <div className="listings-error">{error}</div>}

      {loading ? (
        <div className="listings-loading">Loading your listings...</div>
      ) : listings.length === 0 ? (
        <div className="listings-empty">
          {Object.values(filters).some(Boolean)
            ? 'No listings found matching your criteria.'
            : 'You have no listings yet. Create your first one!'}
        </div>
      ) : (
        <motion.div
          className="listings-list"
          layout
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {listings.map((listing, index) => {
              const canSell = ['active', 'pending'].includes(listing.status);
              return (
                <motion.div
                  key={listing._id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: index * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="listing-card-wrapper"
                >
                  <div className="property-card listing-card">
                    <Link
                      to={`/property/${listing._id}`}
                      className="property-card-link"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="property-card-image">
                        {listing.images && listing.images.length > 0 ? (
                          <>
                            <img
                              src={listing.images[0]}
                              alt={listing.address}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="listing-image-placeholder" style={{ display: 'none' }}>No image</div>
                          </>
                        ) : (
                          <div className="listing-image-placeholder">No image</div>
                        )}
                        {listing.status && listing.status !== 'active' && (
                          <span className="property-badge">{listing.status}</span>
                        )}
                      </div>
                      <div className="property-info listing-info">
                        <span className="property-type">Listing</span>
                        <h3>{listing.address}</h3>
                        <p className="location">ZIP: {listing.zipCode}</p>
                        <p className="price">${listing.price.toLocaleString()}</p>
                        <p className="details">{listing.squareFeet} sqft · {listing.status}</p>
                      </div>
                    </Link>

                    {/* Action bar */}
                    <div className="my-listing-actions">
                      {canSell && (
                        <button
                          className="my-listing-btn my-listing-btn--sold"
                          onClick={() => openSoldModal(listing._id)}
                        >
                          Mark as Sold
                        </button>
                      )}
                      <Link
                        to={`/listings/edit/${listing._id}`}
                        className="my-listing-btn my-listing-btn--edit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </Link>
                      <button
                        className="my-listing-btn my-listing-btn--delete"
                        onClick={() => handleDelete(listing._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Mark as Sold modal */}
      <AnimatePresence>
        {soldModalId && (
          <motion.div
            className="sold-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSoldModal}
          >
            <motion.div
              className="sold-modal"
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="sold-modal-title">Mark as Sold</h2>
              <p className="sold-modal-subtitle">Enter the closing details to finalize this listing.</p>
              <form onSubmit={handleMarkAsSold} className="sold-modal-form">
                <label>
                  Closing Date
                  <input
                    type="date"
                    value={soldForm.closingDate}
                    onChange={(e) => setSoldForm((p) => ({ ...p, closingDate: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Final Sale Price
                  <input
                    type="number"
                    placeholder="e.g. 485000"
                    value={soldForm.finalSalePrice}
                    onChange={(e) => setSoldForm((p) => ({ ...p, finalSalePrice: e.target.value }))}
                    min="0"
                    step="1"
                    required
                  />
                </label>
                {soldError && <p className="sold-modal-error">{soldError}</p>}
                <div className="sold-modal-actions">
                  <button type="button" className="sold-modal-cancel" onClick={closeSoldModal}>
                    Cancel
                  </button>
                  <button type="submit" className="sold-modal-confirm" disabled={soldSubmitting}>
                    {soldSubmitting ? 'Saving…' : 'Confirm Sale'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyListings;
