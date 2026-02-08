import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export const allProperties = [
  {
    id: 1,
    title: 'Modern Loft in Downtown',
    price: 1200000,
    sqft: 1200,
    beds: 2,
    baths: 2,
    propertyType: 'apartment',
    address: '123 Market St',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
    location: 'San Francisco, CA',
    badge: 'New to Listing',
  },
  {
    id: 2,
    title: 'Luxury Villa with Pool',
    price: 2850000,
    sqft: 3500,
    beds: 5,
    baths: 4,
    propertyType: 'house',
    address: '456 Ocean Dr',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80',
    location: 'Miami, FL',
    badge: 'New Construction',
  },
  {
    id: 3,
    title: 'Cozy Suburban Home',
    price: 650000,
    sqft: 1800,
    beds: 3,
    baths: 2,
    propertyType: 'house',
    address: '789 Oak Lane',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
    location: 'Austin, TX',
    badge: 'Open House',
  },
  {
    id: 4,
    title: 'Urban Apartment',
    price: 850000,
    sqft: 950,
    beds: 1,
    baths: 1,
    propertyType: 'apartment',
    address: '321 Park Ave',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    location: 'New York, NY',
    badge: 'New to Listing',
  },
  {
    id: 5,
    title: 'Spacious Country House',
    price: 950000,
    sqft: 2500,
    beds: 4,
    baths: 3,
    propertyType: 'house',
    address: '555 Country Rd',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    location: 'Nashville, TN',
    badge: 'Price Reduced',
  },
  {
    id: 6,
    title: 'Beachside Bungalow',
    price: 1750000,
    sqft: 1600,
    beds: 3,
    baths: 2,
    propertyType: 'house',
    address: '100 Coastal Way',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    location: 'San Diego, CA',
    badge: 'New Construction',
  },
  {
    id: 7,
    title: 'Mountain Retreat',
    price: 2100000,
    sqft: 3000,
    beds: 5,
    baths: 4,
    propertyType: 'house',
    address: '200 Summit Dr',
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=600&q=80',
    location: 'Denver, CO',
    badge: 'Virtual Tour',
  },
  {
    id: 8,
    title: 'Charming Cottage',
    price: 480000,
    sqft: 1100,
    beds: 2,
    baths: 1,
    propertyType: 'cottage',
    address: '88 Maple St',
    image: 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?auto=format&fit=crop&w=600&q=80',
    location: 'Portland, OR',
    badge: 'New to Listing',
  },
  {
    id: 9,
    title: 'Family Home with Yard',
    price: 780000,
    sqft: 2000,
    beds: 4,
    baths: 3,
    propertyType: 'house',
    address: '777 Elm Ave',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    location: 'Charlotte, NC',
    badge: 'Open House',
  },
  {
    id: 10,
    title: 'Downtown Condo',
    price: 990000,
    sqft: 1300,
    beds: 2,
    baths: 2,
    propertyType: 'condo',
    address: '500 Lake Shore Dr',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    location: 'Chicago, IL',
    badge: 'Price Reduced',
  },
  {
    id: 11,
    title: 'Contemporary Estate',
    price: 3200000,
    sqft: 4200,
    beds: 6,
    baths: 5,
    propertyType: 'house',
    address: '1000 Grand Blvd',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    location: 'Los Angeles, CA',
    badge: 'New Construction',
  },
  {
    id: 12,
    title: 'Riverside Townhouse',
    price: 720000,
    sqft: 1900,
    beds: 3,
    baths: 2,
    propertyType: 'townhouse',
    address: '222 River Rd',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
    location: 'Austin, TX',
    badge: 'New to Listing',
  },
  {
    id: 13,
    title: 'Historic Colonial',
    price: 890000,
    sqft: 2200,
    beds: 4,
    baths: 3,
    propertyType: 'house',
    address: '45 Heritage Ln',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80',
    location: 'Boston, MA',
    badge: 'Just Listed',
  },
  {
    id: 14,
    title: 'Lakefront Cabin',
    price: 560000,
    sqft: 1400,
    beds: 3,
    baths: 2,
    propertyType: 'cottage',
    address: '99 Lakeshore Dr',
    image: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?auto=format&fit=crop&w=600&q=80',
    location: 'Denver, CO',
    badge: 'Open House',
  },
  {
    id: 15,
    title: 'Modern Ranch',
    price: 1450000,
    sqft: 2800,
    beds: 4,
    baths: 4,
    propertyType: 'house',
    address: '333 Sunset Blvd',
    image: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=600&q=80',
    location: 'Phoenix, AZ',
    badge: 'New Construction',
  },
  {
    id: 16,
    title: 'South Congress Bungalow',
    price: 580000,
    sqft: 1450,
    beds: 3,
    baths: 2,
    propertyType: 'house',
    address: '420 Congress Ave',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
    location: 'Austin, TX',
    badge: 'New to Listing',
  },
  {
    id: 17,
    title: 'East Austin Modern',
    price: 720000,
    sqft: 1650,
    beds: 3,
    baths: 2,
    propertyType: 'townhouse',
    address: '1500 E 6th St',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80',
    location: 'Austin, TX',
    badge: 'Open House',
  },
  {
    id: 18,
    title: 'Downtown Denver Loft',
    price: 625000,
    sqft: 1100,
    beds: 2,
    baths: 2,
    propertyType: 'condo',
    address: '1600 Broadway',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=600&q=80',
    location: 'Denver, CO',
    badge: 'Price Reduced',
  },
  {
    id: 19,
    title: 'Capitol Hill Charmer',
    price: 890000,
    sqft: 2100,
    beds: 4,
    baths: 3,
    propertyType: 'house',
    address: '800 Grant St',
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80',
    location: 'Denver, CO',
    badge: 'New Construction',
  },
  {
    id: 20,
    title: 'Mission District Condo',
    price: 1100000,
    sqft: 980,
    beds: 2,
    baths: 1,
    propertyType: 'condo',
    address: '2500 Mission St',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    location: 'San Francisco, CA',
    badge: 'Just Listed',
  },
  {
    id: 21,
    title: 'Russian Hill Victorian',
    price: 1950000,
    sqft: 1800,
    beds: 3,
    baths: 2,
    propertyType: 'house',
    address: '1200 Hyde St',
    image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=600&q=80',
    location: 'San Francisco, CA',
    badge: 'New to Listing',
  },
  {
    id: 22,
    title: 'South Beach Penthouse',
    price: 2450000,
    sqft: 2200,
    beds: 3,
    baths: 3,
    propertyType: 'condo',
    address: '1500 Ocean Dr',
    image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=600&q=80',
    location: 'Miami, FL',
    badge: 'Virtual Tour',
  },
  {
    id: 23,
    title: 'Coconut Grove Estate',
    price: 3200000,
    sqft: 3800,
    beds: 5,
    baths: 5,
    propertyType: 'house',
    address: '3500 Main Hwy',
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=600&q=80',
    location: 'Miami, FL',
    badge: 'New Construction',
  },
  {
    id: 24,
    title: 'Brooklyn Brownstone',
    price: 1850000,
    sqft: 2400,
    beds: 4,
    baths: 3,
    propertyType: 'townhouse',
    address: '450 Atlantic Ave',
    image: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80',
    location: 'New York, NY',
    badge: 'Open House',
  },
  {
    id: 25,
    title: 'Upper West Side Apartment',
    price: 1250000,
    sqft: 1400,
    beds: 2,
    baths: 2,
    propertyType: 'apartment',
    address: '250 W 86th St',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
    location: 'New York, NY',
    badge: 'Price Reduced',
  },
];

const propertyTypes = [
  { value: '', label: 'All Types' },
  { value: 'house', label: 'House' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'cottage', label: 'Cottage' },
];

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80';

const Home = () => {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target)) {
        setFiltersOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [filters, setFilters] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
    beds: '',
    baths: '',
    propertyType: '',
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e?.preventDefault?.();
    setAppliedFilters({ ...filters });
  };

  const filteredProperties = allProperties.filter((p) => {
    const keyword = (appliedFilters.keyword || '').trim().toLowerCase();
    const matchesKeyword =
      !keyword ||
      p.title.toLowerCase().includes(keyword) ||
      p.location.toLowerCase().includes(keyword) ||
      (p.address && p.address.toLowerCase().includes(keyword));

    const minPrice = appliedFilters.minPrice ? Number(appliedFilters.minPrice) : null;
    const maxPrice = appliedFilters.maxPrice ? Number(appliedFilters.maxPrice) : null;
    const filterBeds = appliedFilters.beds ? Number(appliedFilters.beds) : null;
    const filterBaths = appliedFilters.baths ? Number(appliedFilters.baths) : null;

    return (
      matchesKeyword &&
      (!minPrice || p.price >= minPrice) &&
      (!maxPrice || p.price <= maxPrice) &&
      (!filterBeds || p.beds === filterBeds) &&
      (!filterBaths || p.baths === filterBaths) &&
      (!appliedFilters.propertyType || p.propertyType === appliedFilters.propertyType)
    );
  });

  const handleImageError = (e) => {
    e.target.src = FALLBACK_IMAGE;
    e.target.onerror = null;
  };

  const activeFilterCount = [
    filters.minPrice,
    filters.maxPrice,
    filters.beds,
    filters.baths,
    filters.propertyType,
  ].filter(Boolean).length;

  return (
    <div className="realestate-home">
      <header className="hero">
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
            alt="Beautiful real estate landscape"
          />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <h1>Find Your Dream Home</h1>
          <p>Search by location, address, or keyword.</p>
          <div className={`hero-search ${filtersOpen ? 'filters-open' : ''}`} ref={filtersRef}>
            <form className="hero-search-bar" onSubmit={handleSearch}>
              <svg className="hero-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                name="keyword"
                placeholder="City, address, or keyword"
                value={filters.keyword}
                onChange={handleChange}
                className="hero-search-input"
              />
              <button type="submit" className="hero-search-btn">
                Search
              </button>
              <button
                type="button"
                className={`hero-filters-btn ${filtersOpen ? 'active' : ''}`}
                onClick={() => setFiltersOpen((v) => !v)}
                aria-expanded={filtersOpen}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="hero-filters-badge">{activeFilterCount}</span>
                )}
              </button>
            </form>
            <AnimatePresence>
              {filtersOpen && (
                <motion.div
                  className="hero-filters-panel"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <input
                    type="number"
                    name="minPrice"
                    placeholder="Min $"
                    value={filters.minPrice}
                    onChange={handleChange}
                    min="0"
                    className="hero-filter-input"
                  />
                  <input
                    type="number"
                    name="maxPrice"
                    placeholder="Max $"
                    value={filters.maxPrice}
                    onChange={handleChange}
                    min="0"
                    className="hero-filter-input"
                  />
                  <select name="propertyType" value={filters.propertyType} onChange={handleChange} className="hero-filter-select">
                    {propertyTypes.map((opt) => (
                      <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    name="beds"
                    placeholder="Beds"
                    value={filters.beds}
                    onChange={handleChange}
                    min="0"
                    className="hero-filter-input"
                  />
                  <input
                    type="number"
                    name="baths"
                    placeholder="Baths"
                    value={filters.baths}
                    onChange={handleChange}
                    min="0"
                    className="hero-filter-input"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <section className="featured-section">
        <h2>Featured Properties</h2>
        <motion.div
          className="property-list"
          layout
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {filteredProperties.length === 0 ? (
              <motion.p
                key="no-results"
                className="no-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                No properties match your filters. Try adjusting your search.
              </motion.p>
            ) : (
              filteredProperties.map((property, index) => (
                <motion.div
                  key={property.id}
                  layout
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.03,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <div className="property-card">
                    <Link
                      to={`/property/${property.id}`}
                      className="property-card-link"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="property-card-image">
                        <img
                          src={property.image}
                          alt={property.title}
                          onError={handleImageError}
                        />
                        {property.badge && (
                          <span className="property-badge">{property.badge}</span>
                        )}
                      </div>
                      <div className="property-info">
                        <span className="property-type">{property.propertyType}</span>
                        <h3>{property.title}</h3>
                        <p className="location">{property.location}</p>
                        <p className="price">${property.price.toLocaleString()}</p>
                        <p className="details">
                          {property.sqft} sqft &bull; {property.beds} bed
                          {property.beds !== 1 ? 's' : ''} &bull; {property.baths} bath
                          {property.baths !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </Link>
                    <Link
                      to={`/property/${property.id}`}
                      className="schedule-tour-btn"
                    >
                      Schedule a Tour
                    </Link>
                    <div className="property-agent">
                      <div className="property-agent-avatar">A</div>
                      <div>
                        <p className="property-agent-name">Listed by Agent</p>
                        <p className="property-agent-phone">(555) 123-4567</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
