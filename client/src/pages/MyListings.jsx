import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ListingSearchBar from '../components/ListingSearchBar';
import ListingCard from '../components/ListingCard';
import ListingPanel from '../components/ListingPanel';
import '../styles/MyListings.css';

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

  const [selectedId, setSelectedId] = useState(null);
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

      const response = await axios.get(`/api/listings?${params.toString()}`);
      const allListings = response.data.listings || [];
      const userId = user?._id || user?.id;
      setListings(allListings.filter((l) => {
        if (!l.createdBy || !userId) return false;
        const createdById = typeof l.createdBy === 'object' ? l.createdBy._id : l.createdBy;
        return String(createdById) === String(userId);
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(fetchListings, 300);
    return () => clearTimeout(t);
  }, [filters, user]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`/api/listings/${id}`);
      await fetchListings();
    } catch (err) {
      let msg = 'Failed to delete listing';
      if (err.response?.status === 403) msg = 'You do not have permission to delete this listing.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      alert(msg);
    }
  };

  const openSoldModal = (id) => { setSoldModalId(id); setSoldForm({ closingDate: '', finalSalePrice: '' }); setSoldError(''); };
  const closeSoldModal = () => { setSoldModalId(null); setSoldError(''); };

  const handleMarkAsSold = async (e) => {
    e.preventDefault();
    if (!soldForm.closingDate || !soldForm.finalSalePrice) { setSoldError('Closing date and final sale price are required.'); return; }
    const parsedPrice = Number(soldForm.finalSalePrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) { setSoldError('Final sale price must be a valid number.'); return; }
    setSoldSubmitting(true); setSoldError('');
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

  const activeCount = listings.filter(l => l.status === 'active').length;
  const soldCount   = listings.filter(l => l.status === 'sold').length;
  const otherCount  = listings.length - activeCount - soldCount;

  return (
    <div className="ml-page">
      {/* Header */}
      <div className="ml-header">
        <div className="ml-header-left">
          <h1 className="ml-title">My Listings</h1>
          {!loading && listings.length > 0 && (
            <div className="ml-stats">
              <span className="ml-stat-chip ml-stat-chip--all">
                {listings.length} total
              </span>
              {activeCount > 0 && (
                <span className="ml-stat-chip ml-stat-chip--active">
                  <span className="ml-stat-dot" />
                  {activeCount} active
                </span>
              )}
              {soldCount > 0 && (
                <span className="ml-stat-chip ml-stat-chip--sold">
                  <span className="ml-stat-dot" />
                  {soldCount} sold
                </span>
              )}
              {otherCount > 0 && (
                <span className="ml-stat-chip ml-stat-chip--other">
                  <span className="ml-stat-dot" />
                  {otherCount} other
                </span>
              )}
            </div>
          )}
        </div>
        <Link to="/listings/create" className="ml-create-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="15" height="15"><path d="M12 5v14M5 12h14"/></svg>
          New Listing
        </Link>
      </div>

      {/* Search */}
      <div className="ml-search-wrap">
        <ListingSearchBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={fetchListings}
          placeholder="Search your listings..."
        />
      </div>

      {error && (
        <div className="ml-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      {/* Loading skeletons */}
      {loading ? (
        <div className="ml-skeleton-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="ml-skeleton-card" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="ml-skeleton-img" />
              <div className="ml-skeleton-body">
                <div className="ml-skeleton-line ml-skeleton-line--w60" />
                <div className="ml-skeleton-line ml-skeleton-line--w80" />
                <div className="ml-skeleton-line ml-skeleton-line--w40" />
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="ml-empty">
          <div className="ml-empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h3>{Object.values(filters).some(Boolean) ? 'No results found' : 'No listings yet'}</h3>
          <p>{Object.values(filters).some(Boolean)
            ? 'Try adjusting your search filters.'
            : 'Create your first listing to get started.'}</p>
          {!Object.values(filters).some(Boolean) && (
            <Link to="/listings/create" className="ml-empty-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
              Create Listing
            </Link>
          )}
        </div>
      ) : (
        <motion.div className="ml-grid" layout initial={false} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <AnimatePresence mode="wait">
            {listings.map((listing, index) => {
              const canSell = ['active', 'pending'].includes(listing.status);
              return (
                <motion.div
                  key={listing._id}
                  layout
                  className="ml-card-unit"
                  initial={{ opacity: 0, y: 20, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.03, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <ListingCard listing={listing} onSelect={setSelectedId} />

                  <div className="ml-actions">
                    {canSell && (
                      <button className="ml-action-btn ml-action-btn--sold" onClick={() => openSoldModal(listing._id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M20 6L9 17l-5-5"/></svg>
                        Sold
                      </button>
                    )}
                    <Link to={`/listings/edit/${listing._id}`} className="ml-action-btn ml-action-btn--edit">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      Edit
                    </Link>
                    <button className="ml-action-btn ml-action-btn--delete" onClick={() => handleDelete(listing._id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      Delete
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Detail panel */}
      <AnimatePresence>
        {selectedId && <ListingPanel listingId={selectedId} onClose={() => setSelectedId(null)} />}
      </AnimatePresence>

      {/* Mark as Sold modal */}
      <AnimatePresence>
        {soldModalId && (
          <motion.div
            className="ml-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSoldModal}
          >
            <motion.div
              className="ml-modal"
              initial={{ opacity: 0, scale: 0.93, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 24 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="ml-modal-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12l3 3 5-5"/>
                </svg>
              </div>
              <h2 className="ml-modal-title">Mark as Sold</h2>
              <p className="ml-modal-sub">Enter the closing details to finalize this listing.</p>
              <form onSubmit={handleMarkAsSold} className="ml-modal-form">
                <div className="ml-modal-field">
                  <label>Closing Date</label>
                  <input
                    type="date"
                    value={soldForm.closingDate}
                    onChange={(e) => setSoldForm((p) => ({ ...p, closingDate: e.target.value }))}
                    required
                  />
                </div>
                <div className="ml-modal-field">
                  <label>Final Sale Price</label>
                  <input
                    type="number"
                    placeholder="e.g. 485000"
                    value={soldForm.finalSalePrice}
                    onChange={(e) => setSoldForm((p) => ({ ...p, finalSalePrice: e.target.value }))}
                    min="0"
                    step="1"
                    required
                  />
                </div>
                {soldError && <p className="ml-modal-error">{soldError}</p>}
                <div className="ml-modal-actions">
                  <button type="button" className="ml-modal-cancel" onClick={closeSoldModal}>Cancel</button>
                  <button type="submit" className="ml-modal-confirm" disabled={soldSubmitting}>
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
