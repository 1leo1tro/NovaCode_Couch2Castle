import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/App.css';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    beds: '',
    baths: '',
    location: '',
  });
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredListings = listings.filter((listing) => {
    const { minPrice, maxPrice, beds, baths, location } = filters;
    let pass = true;
    if (minPrice && listing.price < Number(minPrice)) pass = false;
    if (maxPrice && listing.price > Number(maxPrice)) pass = false;
    if (beds && listing.beds < Number(beds)) pass = false;
    if (baths && listing.baths < Number(baths)) pass = false;
    if (location && !listing.location.toLowerCase().includes(location.toLowerCase())) pass = false;
    return pass;
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      import('./properties').then(module => {
        setListings(module.allProperties);
        setLoading(false);
      });
    }, 1200);
  }, []);

  return (
    <div className="listings-page">
      <h1>All Listings</h1>
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
          type="number"
          name="beds"
          placeholder="Beds"
          value={filters.beds}
          onChange={handleFilterChange}
          style={{ width: '80px' }}
        />
        <input
          type="number"
          name="baths"
          placeholder="Baths"
          value={filters.baths}
          onChange={handleFilterChange}
          style={{ width: '80px' }}
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={filters.location}
          onChange={handleFilterChange}
          style={{ width: '140px' }}
        />
      </form>
      {loading ? (
        <div className="listings-loading">Loading listings...</div>
      ) : filteredListings.length === 0 ? (
        <div className="listings-empty">No listings found.</div>
      ) : (
        <div className="listings-list">
          {filteredListings.map((listing) => (
            <Link to={`/property/${listing.id}`} className="listing-card" key={listing.id}>
              <img src={listing.image} alt={listing.title} />
              <div className="listing-info">
                <h3>{listing.title}</h3>
                <p className="listing-address">{listing.address}</p>
                <p className="listing-details">{listing.sqft} sqft</p>
                <p className="listing-price">${listing.price.toLocaleString()}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Listings;
