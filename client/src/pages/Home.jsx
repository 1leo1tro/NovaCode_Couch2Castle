

import { useState } from 'react';
import { Link } from 'react-router-dom';

export const allProperties = [
  {
    id: 1,
    title: 'Modern Loft in Downtown',
    price: 1200000,
    sqft: 1200,
    beds: 2,
    baths: 2,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
    location: 'San Francisco, CA',
  },
  {
    id: 2,
    title: 'Luxury Villa with Pool',
    price: 2850000,
    sqft: 3500,
    beds: 5,
    baths: 4,
    image: 'https://images.unsplash.com/photo-1460518451285-97b6aa326961?auto=format&fit=crop&w=600&q=80',
    location: 'Miami, FL',
  },
  {
    id: 3,
    title: 'Cozy Suburban Home',
    price: 650000,
    sqft: 1800,
    beds: 3,
    baths: 2,
    image: 'https://images.unsplash.com/photo-1430285561322-7808604715df?auto=format&fit=crop&w=600&q=80',
    location: 'Austin, TX',
  },
  {
    id: 4,
    title: 'Urban Apartment',
    price: 850000,
    sqft: 950,
    beds: 1,
    baths: 1,
    image: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80',
    location: 'New York, NY',
  },
  {
    id: 5,
    title: 'Spacious Country House',
    price: 950000,
    sqft: 2500,
    beds: 4,
    baths: 3,
    image: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=600&q=80',
    location: 'Nashville, TN',
  },
  {
    id: 6,
    title: 'Beachside Bungalow',
    price: 1750000,
    sqft: 1600,
    beds: 3,
    baths: 2,
    image: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
    location: 'San Diego, CA',
  },
  {
    id: 7,
    title: 'Mountain Retreat',
    price: 2100000,
    sqft: 3000,
    beds: 5,
    baths: 4,
    image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80',
    location: 'Denver, CO',
  },
  {
    id: 8,
    title: 'Charming Cottage',
    price: 480000,
    sqft: 1100,
    beds: 2,
    baths: 1,
    image: 'https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80',
    location: 'Portland, OR',
  },
  {
    id: 9,
    title: 'Family Home with Yard',
    price: 780000,
    sqft: 2000,
    beds: 4,
    baths: 3,
    image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=600&q=80',
    location: 'Charlotte, NC',
  },
  {
    id: 10,
    title: 'Downtown Condo',
    price: 990000,
    sqft: 1300,
    beds: 2,
    baths: 2,
    image: 'https://images.unsplash.com/photo-1468436139062-f60a71c5c892?auto=format&fit=crop&w=600&q=80',
    location: 'Chicago, IL',
  },
];


const uniqueLocations = Array.from(new Set(allProperties.map(p => p.location)));

const Home = () => {
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minSqft: '',
    maxSqft: '',
    beds: '',
    baths: '',
    location: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filteredProperties = allProperties.filter((p) => {
    const price = p.price;
    const sqft = p.sqft;
    const beds = p.beds;
    const baths = p.baths;
    const location = p.location;
    return (
      (!filters.minPrice || price >= Number(filters.minPrice)) &&
      (!filters.maxPrice || price <= Number(filters.maxPrice)) &&
      (!filters.minSqft || sqft >= Number(filters.minSqft)) &&
      (!filters.maxSqft || sqft <= Number(filters.maxSqft)) &&
      (!filters.beds || beds === Number(filters.beds)) &&
      (!filters.baths || baths === Number(filters.baths)) &&
      (!filters.location || location === filters.location)
    );
  });

  return (
    <div className="realestate-home">
      <header className="hero">
        <h1>Find Your Dream Home</h1>
        <p>Modern real estate listings</p>
      </header>
      <section className="filter-section">
        <form className="property-filter">
          <input
            type="number"
            name="minPrice"
            placeholder="Min Price ($)"
            value={filters.minPrice}
            onChange={handleChange}
            min="0"
          />
          <input
            type="number"
            name="maxPrice"
            placeholder="Max Price ($)"
            value={filters.maxPrice}
            onChange={handleChange}
            min="0"
          />
          <input
            type="number"
            name="minSqft"
            placeholder="Min Sqft"
            value={filters.minSqft}
            onChange={handleChange}
            min="0"
          />
          <input
            type="number"
            name="maxSqft"
            placeholder="Max Sqft"
            value={filters.maxSqft}
            onChange={handleChange}
            min="0"
          />
          <input
            type="number"
            name="beds"
            placeholder="# Beds"
            value={filters.beds}
            onChange={handleChange}
            min="1"
          />
          <input
            type="number"
            name="baths"
            placeholder="# Baths"
            value={filters.baths}
            onChange={handleChange}
            min="1"
          />
          <select name="location" value={filters.location} onChange={handleChange}>
            <option value="">All Locations</option>
            {uniqueLocations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </form>
      </section>
      <section className="featured-section">
        <h2>Featured Properties</h2>
        <div className="property-list">
          {filteredProperties.length === 0 ? (
            <p style={{ color: '#b2dfdb', fontSize: '1.2rem' }}>No properties match your filters.</p>
          ) : (
            filteredProperties.map((property) => (
              <Link to={`/property/${property.id}`} className="property-card" key={property.id} style={{ textDecoration: 'none' }}>
                <img src={property.image} alt={property.title} />
                <div className="property-info">
                  <h3>{property.title}</h3>
                  <p className="location">{property.location}</p>
                  <p className="price">${property.price.toLocaleString()}</p>
                  <p className="details">
                    {property.sqft} sqft &bull; {property.beds} bed{property.beds > 1 ? 's' : ''} &bull; {property.baths} bath{property.baths > 1 ? 's' : ''}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
