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

  // Fetch listings with filters as query parameters
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string from filter values
      const params = new URLSearchParams();
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.zipCode) params.append('zipCode', filters.zipCode);
      
      const queryString = params.toString();
      const url = `/api/listings${queryString ? `?${queryString}` : ''}`;
      
      const response = await axios.get(url);
      const listingsData = response.data.listings || [];
      setListings(listingsData);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err.response?.data?.message || 'Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  // Fetch listings when filters change
  useEffect(() => {
    fetchListings();
  }, [filters]);

  // Initial fetch on component mount
  useEffect(() => {
    const initialFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get('/api/listings');
        const listingsData = response.data.listings || [];
        setListings(listingsData);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError(err.response?.data?.message || 'Failed to load listings');
      } finally {
        setLoading(false);
      }
    };
    
    initialFetch();
  }, []);

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
      ) : listings.length === 0 ? (
        <div className="listings-empty">
          {filters.keyword || filters.minPrice || filters.maxPrice || filters.zipCode
            ? 'No listings found matching your criteria.'
            : 'No listings found.'}
        </div>
      ) : (
        <div className="listings-list">
          {listings.map((listing) => (
            <div key={listing._id} className="listing-card-wrapper">
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