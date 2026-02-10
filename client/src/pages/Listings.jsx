import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/App.css';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
    zipCode: '',
  });

  const { isAuthenticated, user } = useAuth();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredListings = listings.filter((listing) => {
    const { keyword, minPrice, maxPrice, zipCode } = filters;
    let pass = true;
    const searchTerm = keyword.trim().toLowerCase();
    if (searchTerm) {
      const addressMatch = listing.address?.toLowerCase().includes(searchTerm);
      const zipMatch = listing.zipCode?.toLowerCase().includes(searchTerm);
      const statusMatch = listing.status?.toLowerCase().includes(searchTerm);
      pass = addressMatch || zipMatch || statusMatch;
    }
    if (minPrice && listing.price < Number(minPrice)) pass = false;
    if (maxPrice && listing.price > Number(maxPrice)) pass = false;
    if (zipCode && !listing.zipCode.includes(zipCode)) pass = false;
    return pass;
  });

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/listings');
      const listingsData = response.data.listings || response.data.data || [];
      setListings(listingsData);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await axios.delete(`/api/listings/${id}`);
      // Refresh listings after deletion
      await fetchListings();
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert(err.response?.data?.message || 'Failed to delete listing');
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  return (
    <div className="listings-page">
      <div className="listings-header">
        <h1>All Listings</h1>
        {isAuthenticated() && (
          <Link
            to="/listings/create"
            className="listings-create-btn"
          >
            + Create Listing
          </Link>
        )}
      </div>

      <div className="listings-search">
        <form className="listings-search-bar" onSubmit={(e) => e.preventDefault()}>
          <svg className="listings-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            name="keyword"
            placeholder="Address, ZIP code, status"
            value={filters.keyword}
            onChange={handleFilterChange}
            className="listings-search-input"
          />
          <button type="submit" className="listings-search-btn">
            Search
          </button>
        </form>
        <div className="listings-filter-row">
          <input
            type="number"
            name="minPrice"
            placeholder="Min $"
            value={filters.minPrice}
            onChange={handleFilterChange}
            className="listings-filter-input"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Max $"
            value={filters.maxPrice}
            onChange={handleFilterChange}
            className="listings-filter-input"
          />
          <input
            type="text"
            name="zipCode"
            placeholder="ZIP Code"
            value={filters.zipCode}
            onChange={handleFilterChange}
            className="listings-filter-input"
          />
        </div>
      </div>

      {error && (
        <div className="listings-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="listings-loading">Loading listings...</div>
      ) : filteredListings.length === 0 ? (
        <div className="listings-empty">No listings found.</div>
      ) : (
        <div className="listings-list">
          {filteredListings.map((listing) => (
            <div key={listing._id} className="listing-card-wrapper">
              <div className="property-card listing-card">
                <Link
                  to={`/property/${listing._id}`}
                  className="property-card-link"
                  style={{ textDecoration: 'none' }}
                >
                  <div className="property-card-image">
                    {listing.images && listing.images.length > 0 ? (
                      <img src={listing.images[0]} alt={listing.address} />
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

              {isAuthenticated() && user?._id && listing.createdBy && String(listing.createdBy) === user._id && (
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Listings;
