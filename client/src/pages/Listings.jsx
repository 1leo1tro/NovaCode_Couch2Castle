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
    minPrice: '',
    maxPrice: '',
    zipCode: '',
  });

  const { isAuthenticated } = useAuth();

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredListings = listings.filter((listing) => {
    const { minPrice, maxPrice, zipCode } = filters;
    let pass = true;
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
      setListings(response.data.data || []);
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>All Listings</h1>
        {isAuthenticated() && (
          <Link
            to="/listings/create"
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '14px'
            }}
          >
            + Create Listing
          </Link>
        )}
      </div>

      <form className="property-filter" style={{marginBottom: '1.5rem'}}>
        <input
          type="number"
          name="minPrice"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={handleFilterChange}
          style={{ width: '110px' }}
        />
        <input
          type="number"
          name="maxPrice"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={handleFilterChange}
          style={{ width: '110px' }}
        />
        <input
          type="text"
          name="zipCode"
          placeholder="ZIP Code"
          value={filters.zipCode}
          onChange={handleFilterChange}
          style={{ width: '110px' }}
        />
      </form>

      {error && (
        <div style={{
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          padding: '12px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
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
            <div key={listing._id} style={{ position: 'relative' }}>
              <Link to={`/property/${listing._id}`} className="listing-card">
                {listing.images && listing.images.length > 0 ? (
                  <img src={listing.images[0]} alt={listing.address} />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                  }}>
                    No image
                  </div>
                )}
                <div className="listing-info">
                  <h3>{listing.address}</h3>
                  <p className="listing-details">{listing.squareFeet} sqft</p>
                  <p className="listing-details">ZIP: {listing.zipCode}</p>
                  <p className="listing-details">Status: {listing.status}</p>
                  <p className="listing-price">${listing.price.toLocaleString()}</p>
                </div>
              </Link>

              {isAuthenticated() && (
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  display: 'flex',
                  gap: '8px'
                }}>
                  <Link
                    to={`/listings/edit/${listing._id}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#059669',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    Edit
                  </Link>
                  <button
                    onClick={(e) => handleDelete(listing._id, e)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
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
