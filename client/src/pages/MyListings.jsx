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

  const { user } = useAuth();

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
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
      // Filter to only this agent's listings
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
    const timer = setTimeout(() => {
      fetchListings();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, user]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await axios.delete(`/api/listings/${id}`);
      await fetchListings();
    } catch (err) {
      console.error('Error deleting listing:', err);
      let errorMessage = 'Failed to delete listing';
      if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this listing.';
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      alert(errorMessage);
    }
  };

  return (
    <div className="listings-page">
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

      {error && (
        <div className="listings-error">{error}</div>
      )}

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
            {listings.map((listing, index) => (
              <motion.div
                key={listing._id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.35,
                  delay: index * 0.03,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
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
                          <div className="listing-image-placeholder" style={{ display: 'none' }}>
                            No image
                          </div>
                        </>
                      ) : (
                        <div className="listing-image-placeholder">
                          No image
                        </div>
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
                      <p className="details">{listing.squareFeet} sqft</p>
                      <p className="details">Status: {listing.status}</p>
                    </div>
                  </Link>
                  <Link
                    to={`/property/${listing._id}`}
                    className="schedule-tour-btn"
                  >
                    View Details
                  </Link>
                  <div className="property-agent">
                    <div className="property-agent-avatar">
                      {listing.createdBy?.name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="property-agent-name">
                        {listing.createdBy?.name || 'Listed by Agent'}
                      </p>
                      <p className="property-agent-phone">
                        {listing.createdBy?.phone || '(555) 123-4567'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="listing-actions">
                  <Link
                    to={`/listings/edit/${listing._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="listing-action listing-action-edit"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={(e) => handleDelete(listing._id, e)}
                    className="listing-action listing-action-delete"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default MyListings;
