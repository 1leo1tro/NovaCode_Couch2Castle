import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import ListingSearchBar from '../components/ListingSearchBar';
import ListingsMap from '../components/ListingsMap';
import ListingPanel from '../components/ListingPanel';
import ListingCard from '../components/ListingCard';
import Footer from '../components/Footer';
import '../styles/App.css';

const Listings = () => {
  const [listings, setListings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);
  const [openHouseListingIds, setOpenHouseListingIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('default');
  const [sortOpen, setSortOpen] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [searchTarget, setSearchTarget] = useState(null);
  const ITEMS_PER_PAGE = 24;
  const cardRefs = useRef({});
  const hoveredIdRef = useRef(null);
  const mapHighlightRef = useRef(null);
  const gridScrollRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => { setCurrentPage(1); }, [viewMode]);
  useEffect(() => { setCurrentPage(1); }, [listings]);
  useEffect(() => { setCurrentPage(1); }, [mapBounds]);

  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e) => { if (!e.target.closest('.listings-sort-wrap')) setSortOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [sortOpen]);

  useEffect(() => {
    if (viewMode !== 'split') return;
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLocation({ lat, lng });
      },
      () => {}
    );
  }, [viewMode]);

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

  const filteredListings = (mapBounds && !filters.keyword)
    ? listings.filter(l => {
        if (!l.location?.coordinates?.length) return true;
        const [lng, lat] = l.location.coordinates;
        return lng >= mapBounds.minLng && lng <= mapBounds.maxLng &&
               lat >= mapBounds.minLat && lat <= mapBounds.maxLat;
      })
    : listings;

  const visibleListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'price-desc': return b.price - a.price;
      case 'price-asc':  return a.price - b.price;
      case 'newest':     return new Date(b.createdAt) - new Date(a.createdAt);
      case 'beds':       return (b.bedrooms ?? 0) - (a.bedrooms ?? 0);
      case 'baths':      return (b.bathrooms ?? 0) - (a.bathrooms ?? 0);
      case 'sqft':       return (b.squareFeet ?? 0) - (a.squareFeet ?? 0);
      default:           return 0;
    }
  });

  const sortLabels = {
    default:    'Homes for You',
    'price-desc': 'Price (High to Low)',
    'price-asc':  'Price (Low to High)',
    newest:     'Newest',
    beds:       'Bedrooms',
    baths:      'Bathrooms',
    sqft:       'Square Feet',
  };

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
      const fetched = response.data.listings || [];
      setListings(fetched);

      setLocationLabel(f.keyword ? f.keyword.trim() : '');

      if (f.keyword) {
        const valid = fetched.filter(l => l.location?.coordinates?.length === 2);
        if (valid.length === 1) {
          const [lng, lat] = valid[0].location.coordinates;
          setSearchTarget({ lng, lat, _key: Date.now() });
        } else if (valid.length > 1) {
          const lngs = valid.map(l => l.location.coordinates[0]);
          const lats = valid.map(l => l.location.coordinates[1]);
          setSearchTarget({
            bounds: {
              minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
              minLat: Math.min(...lats), maxLat: Math.max(...lats),
            },
            _key: Date.now(),
          });
        }
      }
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
    const listingParam = searchParams.get('listing');
    if (listingParam) setSelectedId(listingParam);
    fetchListings();
  }, []);

  useEffect(() => {
    const fetchOH = () => {
      axios.get('/api/open-houses/upcoming')
        .then(res => {
          const ids = new Set((res.data.openHouses || []).map(oh =>
            typeof oh.listing === 'object' ? oh.listing._id : oh.listing
          ));
          setOpenHouseListingIds(ids);
        })
        .catch(() => {});
    };
    fetchOH();
    const onVisible = () => { if (document.visibilityState === 'visible') fetchOH(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
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
          animatedPlaceholders={[
            'Try "New York, NY"',
            'Try "Austin, TX"',
            'Try "Miami, FL"',
            'Try "Denver, CO"',
            'Try "Seattle, WA"',
            'Try "Nashville, TN"',
            'Try "90027"',
            'Try "3 bed 2 bath"',
          ]}
        />
        {error && <div className="listings-error">{error}</div>}
      </div>

      {/* View mode toggle + count */}
      <div className="listings-toolbar">
        <div className="listings-toolbar-left">
          <h2 className="listings-panel-title">{locationLabel ? `Homes in ${locationLabel}` : 'Homes for Sale'}</h2>
          {!loading && visibleListings.length > 0 && (
            <p className="listings-count">{visibleListings.length} listing{visibleListings.length !== 1 ? 's' : ''} found</p>
          )}
        </div>
        <div className="listings-sort-wrap">
          <button
            className="listings-sort-btn"
            onClick={() => setSortOpen(o => !o)}
          >
            <span>Sort: <strong>{sortLabels[sortBy]}</strong></span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14" style={{ marginLeft: '0.4rem', transform: sortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          {sortOpen && (
            <div className="listings-sort-dropdown">
              {Object.entries(sortLabels).map(([key, label]) => (
                <button
                  key={key}
                  className={`listings-sort-option${sortBy === key ? ' listings-sort-option--active' : ''}`}
                  onClick={() => { setSortBy(key); setSortOpen(false); setCurrentPage(1); }}
                >
                  {label}
                </button>
              ))}
            </div>
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
            ) : (() => {
              const panelTotal = Math.ceil(visibleListings.length / ITEMS_PER_PAGE);
              const panelListings = visibleListings.slice(
                (currentPage - 1) * ITEMS_PER_PAGE,
                currentPage * ITEMS_PER_PAGE
              );
              const goTo = (p) => { setCurrentPage(p); };
              return (
                <>
                  <div className="listings-list listings-list--panel">
                    {panelListings.map((listing) => (
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
                  {panelTotal > 1 && (
                    <div className="listings-pagination listings-pagination--panel">
                      <button className="listings-pagination-btn" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>&#8249;</button>
                      {Array.from({ length: panelTotal }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === panelTotal || Math.abs(p - currentPage) <= 1)
                        .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                        .map((item, idx) => item === '...'
                          ? <span key={`e-${idx}`} className="listings-pagination-ellipsis">…</span>
                          : <button key={item} className={`listings-pagination-btn${item === currentPage ? ' listings-pagination-btn--active' : ''}`} onClick={() => goTo(item)}>{item}</button>
                        )}
                      <button className="listings-pagination-btn" onClick={() => goTo(currentPage + 1)} disabled={currentPage === panelTotal}>&#8250;</button>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="listings-map-panel">
            <ListingsMap
              listings={listings}
              cityQuery={filters.keyword}
              userLocation={userLocation}
              searchTarget={searchTarget}
              mapHighlightRef={mapHighlightRef}
              onMarkerHover={setHovered}
              onMarkerClick={handleMarkerClick}
              onBoundsChange={setMapBounds}
            />
          </div>
        </div>
      ) : (() => {
        const totalPages = Math.ceil(visibleListings.length / ITEMS_PER_PAGE);
        const pageListings = visibleListings.slice(
          (currentPage - 1) * ITEMS_PER_PAGE,
          currentPage * ITEMS_PER_PAGE
        );
        const goTo = (p) => {
          setCurrentPage(p);
          gridScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const showPagination = !loading && !noResults && !lowResults && totalPages > 1;

        return (
          <div className="listings-list-view">
            <div className="listings-grid-scroll" ref={gridScrollRef}>
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
                  {pageListings.map((listing) => (
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
              {!loading && <Footer />}
            </div>

            {showPagination && (
              <div className="listings-pagination listings-pagination--bar">
                <button className="listings-pagination-btn" onClick={() => goTo(currentPage - 1)} disabled={currentPage === 1}>&#8249;</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .reduce((acc, p, idx, arr) => { if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...'); acc.push(p); return acc; }, [])
                  .map((item, idx) => item === '...'
                    ? <span key={`ellipsis-${idx}`} className="listings-pagination-ellipsis">…</span>
                    : <button key={item} className={`listings-pagination-btn${item === currentPage ? ' listings-pagination-btn--active' : ''}`} onClick={() => goTo(item)}>{item}</button>
                  )}
                <button className="listings-pagination-btn" onClick={() => goTo(currentPage + 1)} disabled={currentPage === totalPages}>&#8250;</button>
                <span className="listings-pagination-info">Page {currentPage} of {totalPages}</span>
              </div>
            )}
          </div>
        );
      })()}

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
