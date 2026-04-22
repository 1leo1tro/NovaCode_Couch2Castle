import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import BookmarkStar from '../components/BookmarkStar';
import ListingPanel from '../components/ListingPanel';
import ListingSearchBar from '../components/ListingSearchBar';
import Footer from '../components/Footer';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80';

const extractCity = (address) => {
  if (!address) return null;
  const parts = address.split(',');
  if (parts.length >= 3) {
    const city = parts[1].trim();
    const stateZip = parts[2].trim();
    const state = stateZip.replace(/\s*\d{5}(-\d{4})?$/, '').trim();
    return `${city}, ${state}`;
  }
  return null;
};

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Smart Search',
    desc: 'Filter by price, beds, baths, square footage, and ZIP code. Search with natural language or browse the interactive map.',
    cta: 'Browse Listings',
    to: '/listings',
    forWho: 'For Buyers',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
      </svg>
    ),
    title: 'List Your Property',
    desc: 'Agents can create and manage listings, schedule open houses, track view counts, and mark properties as sold — all in one place.',
    cta: 'Agent Sign Up',
    to: '/signup',
    forWho: 'For Agents',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
      </svg>
    ),
    title: 'Schedule Tours',
    desc: 'Request private showings directly from any listing page. Agents manage availability and confirm appointments seamlessly.',
    cta: 'Find a Home',
    to: '/listings',
    forWho: 'For Buyers',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
    title: 'Save Favorites',
    desc: 'Bookmark any listing and build your personal shortlist. Never lose track of a home you love.',
    cta: 'Sign Up Free',
    to: '/signup',
    forWho: 'For Buyers',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    title: 'Open Houses',
    desc: 'Discover upcoming open houses in your area. Listings with open house events are automatically highlighted.',
    cta: 'See Open Houses',
    to: '/listings',
    forWho: 'For Buyers',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="32" height="32">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Market Reports',
    desc: 'Agents get access to sales analytics, days-on-market tracking, and view count data to stay ahead of the market.',
    cta: 'Agent Sign Up',
    to: '/signup',
    forWho: 'For Agents',
  },
];

const cityStateFromAddress = (address) => {
  if (!address) return '';
  const parts = address.split(',');
  if (parts.length >= 3) return `${parts[1].trim()}, ${parts[2].trim()}`;
  return address;
};

const streetFromAddress = (address) => {
  if (!address) return address;
  return address.split(',')[0].trim();
};

const ListingCard = ({ listing, onSelect }) => {
  const [imgErr, setImgErr] = useState(false);
  const img = (!imgErr && listing.images?.[0]) || FALLBACK_IMAGE;

  return (
    <div className="property-card home-listing-card" onClick={() => onSelect(listing._id)} style={{ cursor: 'pointer' }}>
      <div className="property-card-image">
        <img src={img} alt={listing.address} onError={() => setImgErr(true)} />
        {listing.status && <span className="property-badge">{listing.status}</span>}
        <BookmarkStar listingId={listing._id} />
      </div>
      <div className="property-info">
        <p className="price">${listing.price.toLocaleString()}</p>
        <h3 style={{ fontSize: '0.92rem', marginBottom: '0.2rem' }}>{streetFromAddress(listing.address)}</h3>
        <p className="location">{cityStateFromAddress(listing.address)}</p>
        <p className="details">
          {listing.bedrooms != null && `${listing.bedrooms} bd`}
          {listing.bedrooms != null && listing.bathrooms != null && ' · '}
          {listing.bathrooms != null && `${listing.bathrooms} ba`}
          {(listing.bedrooms != null || listing.bathrooms != null) && ' · '}
          {listing.squareFeet} sqft
        </p>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="listings-skeleton-card home-skeleton-card">
    <div className="listings-skeleton-image" />
    <div className="listings-skeleton-body">
      <div className="listings-skeleton-line listings-skeleton-line--short" />
      <div className="listings-skeleton-line listings-skeleton-line--long" />
      <div className="listings-skeleton-line listings-skeleton-line--medium" />
    </div>
  </div>
);

const EMPTY_FILTERS = {
  keyword: '', minPrice: '', maxPrice: '', zipCode: '', status: 'active',
  minSquareFeet: '', maxSquareFeet: '', minBedrooms: '', minBathrooms: '',
  exactBedrooms: false, exactBathrooms: false,
};

const Home = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const filtersRef = useRef(EMPTY_FILTERS);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNearby, setIsNearby] = useState(false);
  const [cityLabel, setCityLabel] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    const fetchListings = async (lat, lng) => {
      try {
        const params = new URLSearchParams({ limit: 8 });
        if (lat != null) { params.set('lat', lat); params.set('lng', lng); }
        const res = await axios.get(`/api/listings/nearby?${params}`);
        setListings(res.data.listings || []);
        setIsNearby(!!res.data.isNearby);
        if (res.data.isNearby && res.data.listings?.length) {
          const city = extractCity(res.data.listings[0].address);
          if (city) setCityLabel(city);
        }
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchListings(pos.coords.latitude, pos.coords.longitude),
        () => fetchListings(null, null),
        { timeout: 5000 }
      );
    } else {
      fetchListings(null, null);
    }
  }, []);

  const handleFilterChange = (name, value) => {
    filtersRef.current = { ...filtersRef.current, [name]: value };
    setFilters(filtersRef.current);
  };

  const handleSearch = () => {
    const f = filtersRef.current;
    const params = new URLSearchParams();
    if (f.keyword) params.set('keyword', f.keyword);
    if (f.minPrice) params.set('minPrice', f.minPrice);
    if (f.maxPrice) params.set('maxPrice', f.maxPrice);
    if (f.zipCode) params.set('zipCode', f.zipCode);
    if (f.status && f.status !== 'active') params.set('status', f.status);
    if (f.minBedrooms) params.set('minBedrooms', f.minBedrooms);
    if (f.minBathrooms) params.set('minBathrooms', f.minBathrooms);
    if (f.minSquareFeet) params.set('minSquareFeet', f.minSquareFeet);
    if (f.maxSquareFeet) params.set('maxSquareFeet', f.maxSquareFeet);
    const qs = params.toString();
    navigate(qs ? `/listings?${qs}` : '/listings');
  };

  const sectionTitle = isNearby
    ? cityLabel ? `Hot Homes Near You in ${cityLabel}` : 'Hot Homes Near You'
    : 'Featured Properties';

  // Listings carousel
  const CARDS_VISIBLE = 4;
  const [cardIndex, setCardIndex] = useState(0);
  const maxCardIndex = Math.max(0, listings.length - CARDS_VISIBLE);
  const cardTrackRef = useRef(null);

  useEffect(() => {
    if (!cardTrackRef.current) return;
    const cardEl = cardTrackRef.current.querySelector('.property-card');
    if (!cardEl) return;
    const gap = 20;
    const offset = cardIndex * (cardEl.offsetWidth + gap);
    cardTrackRef.current.style.transform = `translateX(-${offset}px)`;
  }, [cardIndex, listings]);

  // Feature carousel
  const VISIBLE = 3;
  const [featureIndex, setFeatureIndex] = useState(0);
  const [featureDir, setFeatureDir] = useState(1);
  const featureTimerRef = useRef(null);

  const advanceFeature = (dir) => {
    setFeatureDir(dir);
    setFeatureIndex(i => (i + dir + FEATURES.length) % FEATURES.length);
  };

  useEffect(() => {
    featureTimerRef.current = setInterval(() => advanceFeature(1), 4000);
    return () => clearInterval(featureTimerRef.current);
  }, []);

  const resetTimer = (dir) => {
    clearInterval(featureTimerRef.current);
    advanceFeature(dir);
    featureTimerRef.current = setInterval(() => advanceFeature(1), 4000);
  };

  const visibleFeatures = Array.from({ length: VISIBLE }, (_, i) =>
    FEATURES[(featureIndex + i) % FEATURES.length]
  );

  return (
    <div className="realestate-home">
      {/* Hero */}
      <header className="hero">
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"
            alt="Beautiful real estate"
          />
          <div className="hero-overlay" />
        </div>
        <div className="hero-content">
          <h1>Find Your Dream Home</h1>
          <p>Search by location, address, or keyword.</p>
          <div className="hero-searchbar-wrap">
            <ListingSearchBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              onSelectListing={setSelectedId}
              animatedPlaceholders={[
                'Try "Huntsville, AL"',
                'Try "35801"',
                'Try "Madison, AL"',
                'Try "Blossomwood"',
                'Try "Hampton Cove"',
                'Try "35806"',
              ]}
            />
          </div>
        </div>
      </header>

      {/* Hot / Featured listings */}
      <section className="featured-section">
        <div className="home-section-header">
          <div>
            <h2>{sectionTitle}</h2>
            {isNearby && (
              <p className="home-section-sub">Most-viewed active listings in your area</p>
            )}
          </div>
          <Link to="/listings" className="home-see-all">See all listings →</Link>
        </div>

        <div className="home-listings-carousel">
          {!loading && listings.length > CARDS_VISIBLE && (
            <div className="home-listings-arrows">
              <button
                type="button"
                className="home-listings-arrow"
                onClick={() => setCardIndex(i => Math.max(0, i - 1))}
                disabled={cardIndex === 0}
                aria-label="Previous"
              >&#8249;</button>
              <button
                type="button"
                className="home-listings-arrow"
                onClick={() => setCardIndex(i => Math.min(maxCardIndex, i + 1))}
                disabled={cardIndex >= maxCardIndex}
                aria-label="Next"
              >&#8250;</button>
            </div>
          )}

          <div className="home-listings-track-wrap">
            <div className="home-listings-track" ref={cardTrackRef}>
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                : listings.length === 0
                  ? <p className="no-results">No listings found. Check back soon!</p>
                  : listings.map(listing => (
                      <ListingCard key={listing._id} listing={listing} onSelect={setSelectedId} />
                    ))
              }
            </div>
          </div>

          {!loading && listings.length > CARDS_VISIBLE && (
            <div className="home-listings-dots">
              {Array.from({ length: maxCardIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`home-listings-dot${i === cardIndex ? ' home-listings-dot--active' : ''}`}
                  onClick={() => setCardIndex(i)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feature carousel */}
      <section className="home-features-section">
        <h2 className="home-features-title">Everything You Need, In One Place</h2>
        <p className="home-features-sub">Whether you're searching for your next home or growing your real estate business</p>

        <div className="home-features-carousel">
          <button
            type="button"
            className="home-features-arrow home-features-arrow--prev"
            onClick={() => resetTimer(-1)}
            aria-label="Previous"
          >
            &#8249;
          </button>

          <div className="home-features-track">
            <AnimatePresence mode="popLayout" custom={featureDir}>
              {visibleFeatures.map((f) => (
                <motion.div
                  key={f.title}
                  className="home-feature-card"
                  custom={featureDir}
                  variants={{
                    enter: (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
                    center: { x: 0, opacity: 1 },
                    exit: (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
                >
                  <div className="home-feature-icon">{f.icon}</div>
                  <span className="home-feature-tag">{f.forWho}</span>
                  <h3 className="home-feature-title">{f.title}</h3>
                  <p className="home-feature-desc">{f.desc}</p>
                  <Link to={f.to} className="home-feature-cta">{f.cta} →</Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            type="button"
            className="home-features-arrow home-features-arrow--next"
            onClick={() => resetTimer(1)}
            aria-label="Next"
          >
            &#8250;
          </button>
        </div>

        {/* Dots */}
        <div className="home-features-dots">
          {FEATURES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`home-features-dot${i === featureIndex ? ' home-features-dot--active' : ''}`}
              onClick={() => { resetTimer(i > featureIndex ? 1 : -1); setFeatureIndex(i); }}
            />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="home-cta-banner">
        <div className="home-cta-content">
          <h2>Ready to find your next home?</h2>
          <p>Join thousands of buyers and agents already using Couch2Castle.</p>
          <div className="home-cta-actions">
            <Link to="/listings" className="home-cta-btn home-cta-btn--primary">Browse Listings</Link>
            <Link to="/signup" className="home-cta-btn home-cta-btn--secondary">Create an Account</Link>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {selectedId && (
          <ListingPanel listingId={selectedId} onClose={() => setSelectedId(null)} />
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

export default Home;
