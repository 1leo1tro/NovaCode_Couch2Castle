import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ListingSearchBar from '../components/ListingSearchBar';
import ListingsMap from '../components/ListingsMap';
import ListingPanel from '../components/ListingPanel';
import BookmarkStar from '../components/BookmarkStar';
import '../styles/App.css';

const ListingCard = ({ listing, hasOpenHouse, onSelect }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const images = listing.images || [];

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(-1);
    setImgIndex(i => (i - 1 + images.length) % images.length);
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDirection(1);
    setImgIndex(i => (i + 1) % images.length);
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0 }),
  };

  return (
    <div className="property-card listing-card">
      <div className="property-card-link" style={{ textDecoration: 'none', cursor: 'pointer' }} onClick={() => onSelect?.(listing._id)}>
        <div className="property-card-image">
          {images.length > 0 ? (
            <>
              <div className="card-carousel-track">
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.img
                    key={imgIndex}
                    src={images[imgIndex]}
                    alt={listing.address}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </AnimatePresence>
              </div>
              {images.length > 1 && (
                <>
                  <button className="card-carousel-btn card-carousel-btn--prev" onClick={prev}>&#8249;</button>
                  <button className="card-carousel-btn card-carousel-btn--next" onClick={next}>&#8250;</button>
                  <div className="card-carousel-dots">
                    {images.map((_, i) => (
                      <span key={i} className={`card-carousel-dot${i === imgIndex ? ' card-carousel-dot--active' : ''}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="listing-image-placeholder">No image</div>
          )}
          {listing.status && <span className="property-badge">{listing.status}</span>}
          {hasOpenHouse && <span className="property-badge property-badge--open-house">Open House</span>}
          <BookmarkStar listingId={listing._id} />
        </div>
        <div className="property-info listing-info">
          <p className="price">${listing.price.toLocaleString()}</p>
          <h3>{listing.address}</h3>
          <p className="location">ZIP: {listing.zipCode}</p>
          <p className="details">
            {listing.bedrooms != null && `${listing.bedrooms} bd`}
            {listing.bedrooms != null && listing.bathrooms != null && ' · '}
            {listing.bathrooms != null && `${listing.bathrooms} ba`}
            {(listing.bedrooms != null || listing.bathrooms != null) && ' · '}
            {listing.squareFeet} sqft
          </p>
          <p className="details">Status: {listing.status}</p>
        </div>
      </div>
    </div>
  );
};

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [openHouseListingIds, setOpenHouseListingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'list'
  const cardRefs = useRef({});
  const hoveredIdRef = useRef(null);
  const mapHighlightRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [filters, setFilters] = useState({
    keyword: '',
    minPrice: '',
    maxPrice: '',
    zipCode: '',
    status: 'active',
    minSquareFeet: '',
    maxSquareFeet: '',
    minBedrooms: '',
    minBathrooms: '',
    exactBedrooms: false,
    exactBathrooms: false,
  });

  // Always-current ref so fetchListings never reads stale closure values
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const [searchParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();

  const visibleListings = mapBounds
    ? listings.filter(l => {
        if (!l.location?.coordinates?.length) return true;
        const [lng, lat] = l.location.coordinates;
        return lng >= mapBounds.minLng && lng <= mapBounds.maxLng &&
               lat >= mapBounds.minLat && lat <= mapBounds.maxLat;
      })
    : listings;

  // Direct DOM hover — no React re-render
  const setHovered = useCallback((id) => {
    if (hoveredIdRef.current === id) return;
    if (hoveredIdRef.current) {
      cardRefs.current[hoveredIdRef.current]
        ?.querySelector('.listing-card')
        ?.classList.remove('listing-card--highlighted');
    }
    hoveredIdRef.current = id;
    if (id) {
      cardRefs.current[id]
        ?.querySelector('.listing-card')
        ?.classList.add('listing-card--highlighted');
    }
    mapHighlightRef.current?.(id);
  }, []);

  const handleMarkerClick = useCallback((id) => {
    setHovered(id);
    setSelectedId(id);
  }, [setHovered]);

  const handleFilterChange = (name, value) => {
    filtersRef.current = { ...filtersRef.current, [name]: value };
    setFilters(filtersRef.current);
  };

  const fetchListings = async () => {
    const f = filtersRef.current;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', '1000');
      if (f.keyword) params.append('keyword', f.keyword);
      if (f.minPrice) params.append('minPrice', f.minPrice);
      if (f.maxPrice) params.append('maxPrice', f.maxPrice);
      if (f.zipCode) params.append('zipCode', f.zipCode);
      if (f.status) params.append('status', f.status);
      if (f.minSquareFeet) params.append('minSquareFeet', f.minSquareFeet);
      if (f.maxSquareFeet) params.append('maxSquareFeet', f.maxSquareFeet);
      if (f.minBedrooms) {
        params.append('minBedrooms', f.minBedrooms);
        if (f.exactBedrooms) params.append('exactBedrooms', 'true');
      }
      if (f.minBathrooms) {
        params.append('minBathrooms', f.minBathrooms);
        if (f.exactBathrooms) params.append('exactBathrooms', 'true');
      }

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
    const updates = {};
    const map = {
      keyword: 'keyword', minPrice: 'minPrice', maxPrice: 'maxPrice',
      zipCode: 'zipCode', status: 'status', minSquareFeet: 'minSquareFeet',
      maxSquareFeet: 'maxSquareFeet', minBedrooms: 'minBedrooms', minBathrooms: 'minBathrooms',
    };
    Object.entries(map).forEach(([param, key]) => {
      const val = searchParams.get(param);
      if (val) updates[key] = val;
    });
    if (Object.keys(updates).length) {
      filtersRef.current = { ...filtersRef.current, ...updates };
      setFilters(filtersRef.current);
    }
    fetchListings();
  }, []);

  useEffect(() => {
    axios.get('/api/open-houses/upcoming')
      .then(res => {
        const ids = new Set((res.data.openHouses || []).map(oh =>
          typeof oh.listing === 'object' ? oh.listing._id : oh.listing
        ));
        setOpenHouseListingIds(ids);
      })
      .catch(() => {});
  }, []);

  const lowResults = !loading && visibleListings.length > 0 && visibleListings.length < 4;
  const noResults = !loading && visibleListings.length === 0;

  const emptyOrLowContent = (isLow) => (
    <div className={isLow ? 'listings-low-results' : 'listings-empty-state'}>
      {isLow && (
        <div className="listings-low-results-cards">
          {visibleListings.map((listing) => (
            <div
              key={listing._id}
              className="listing-card-wrapper"
              ref={(el) => { if (el) cardRefs.current[listing._id] = el; }}
              onMouseEnter={() => setHovered(listing._id)}
              onMouseLeave={() => setHovered(null)}
            >
              <ListingCard
                listing={listing}
                hasOpenHouse={openHouseListingIds.has(listing._id)}
                onSelect={setSelectedId}
              />
            </div>
          ))}
        </div>
      )}
      <div className="listings-no-results-box">
        <div className="listings-no-results-icon">🔍</div>
        <h3 className="listings-no-results-title">
          {isLow ? 'Not many results match your search' : 'No listings found'}
        </h3>
        <p className="listings-no-results-sub">Try searching with natural language:</p>
        <ul className="listings-no-results-examples">
          <li>"3 bedroom townhouses with fireplace in Seattle, WA"</li>
          <li>"Open houses near me"</li>
          <li>"2 bath homes under $400,000"</li>
        </ul>
        <div className="listings-no-results-tips">
          <div className="listings-no-results-tip">
            <strong>Decrease the number of filters</strong>
            <span>Adjust your criteria to be less restrictive, or remove very specific ones.</span>
          </div>
          <div className="listings-no-results-tip">
            <strong>Increase the scope of your search</strong>
            <span>Search in a wider area (e.g., ZIP code to city), or zoom out on the map.</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="listings-page">
      <div className="listings-top-bar">
        <ListingSearchBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onSearch={fetchListings}
          onSelectListing={setSelectedId}
          alwaysOpen
        />
        {error && <div className="listings-error">{error}</div>}
      </div>

      {/* View mode toggle + count */}
      <div className="listings-toolbar">
        <div className="listings-toolbar-left">
          <h2 className="listings-panel-title">Homes for Sale</h2>
          {!loading && visibleListings.length > 0 && (
            <p className="listings-count">{visibleListings.length} listing{visibleListings.length !== 1 ? 's' : ''} found</p>
          )}
        </div>
        <div className="listings-view-toggle">
          <button
            type="button"
            className={`listings-view-btn${viewMode === 'split' ? ' listings-view-btn--active' : ''}`}
            onClick={() => setViewMode('split')}
            title="Map + List"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="3" y="3" width="8" height="18" rx="1"/>
              <rect x="13" y="3" width="8" height="18" rx="1"/>
            </svg>
            Map
          </button>
          <button
            type="button"
            className={`listings-view-btn${viewMode === 'list' ? ' listings-view-btn--active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List only"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
            List
          </button>
        </div>
      </div>

      {viewMode === 'split' ? (
        <div className="listings-split-view">
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
            ) : noResults ? (
              emptyOrLowContent(false)
            ) : lowResults ? (
              emptyOrLowContent(true)
            ) : (
              <div className="listings-list listings-list--panel">
                {visibleListings.map((listing) => (
                  <div
                    key={listing._id}
                    className="listing-card-wrapper"
                    ref={(el) => { if (el) cardRefs.current[listing._id] = el; }}
                    onMouseEnter={() => setHovered(listing._id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <ListingCard
                      listing={listing}
                      hasOpenHouse={openHouseListingIds.has(listing._id)}
                      onSelect={setSelectedId}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="listings-map-panel">
            <ListingsMap
              listings={listings}
              cityQuery={filters.keyword}
              mapHighlightRef={mapHighlightRef}
              onMarkerHover={setHovered}
              onMarkerClick={handleMarkerClick}
              onBoundsChange={setMapBounds}
            />
          </div>
        </div>
      ) : (
        <div className="listings-list-view">
          {loading ? (
            <div className="listings-skeleton-list listings-skeleton-list--grid">
              {Array.from({ length: 12 }).map((_, i) => (
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
          ) : noResults || lowResults ? (
            emptyOrLowContent(lowResults)
          ) : (
            <div className="listings-list listings-list--grid">
              {visibleListings.map((listing) => (
                <div
                  key={listing._id}
                  className="listing-card-wrapper"
                  ref={(el) => { if (el) cardRefs.current[listing._id] = el; }}
                  onMouseEnter={() => setHovered(listing._id)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <ListingCard
                    listing={listing}
                    hasOpenHouse={openHouseListingIds.has(listing._id)}
                    onSelect={setSelectedId}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedId && (
          <ListingPanel
            listingId={selectedId}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Listings;
