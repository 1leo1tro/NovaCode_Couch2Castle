import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ListingSearchBar from '../components/ListingSearchBar';
import ListingsMap from '../components/ListingsMap';
import BookmarkStar from '../components/BookmarkStar';
import '../styles/App.css';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const cardRefs = useRef({});

  const handleMarkerClick = (id) => {
    setHoveredId(id);
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const [filters, setFilters] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
    zipCode: '',
    status: 'active',
    minSquareFeet: '',
    maxSquareFeet: '',
  });

  const { isAuthenticated, user } = useAuth();

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', '50');
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
      setListings(response.data.listings || []);
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
  }, [filters]);

  return (
    <div className="listings-page">
      <div className="listings-top-bar">
        <ListingSearchBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={fetchListings}
          alwaysOpen
        />
        {error && <div className="listings-error">{error}</div>}
      </div>

      <div className="listings-split-view">
        {/* Left panel — scrollable cards */}
        <div className="listings-panel">
          {loading ? (
            <div className="listings-skeleton-list">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="listings-skeleton-card">
                  <div className="listings-skeleton-image" />
                  <div className="listings-skeleton-body">
                    <div className="listings-skeleton-line listings-skeleton-line--short" />
                    <div className="listings-skeleton-line listings-skeleton-line--long" />
                    <div className="listings-skeleton-line listings-skeleton-line--medium" />
                    <div className="listings-skeleton-line listings-skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="listings-empty">
              {Object.values(filters).some(Boolean)
                ? 'No listings found matching your criteria.'
                : 'No listings found.'}
            </div>
          ) : (
            <motion.div
              className="listings-list listings-list--panel"
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
                    ref={(el) => { if (el) cardRefs.current[listing._id] = el; }}
                    onMouseEnter={() => setHoveredId(listing._id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className={`property-card listing-card${hoveredId === listing._id ? ' listing-card--highlighted' : ''}`}>
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
                          {listing.status && (
                            <span className="property-badge">{listing.status}</span>
                          )}
                          <BookmarkStar listingId={listing._id} />
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
                        Schedule a Tour
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Right panel — sticky map */}
        <div className="listings-map-panel">
          <ListingsMap
            listings={listings}
            hoveredId={hoveredId}
            onMarkerHover={setHoveredId}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Listings;
