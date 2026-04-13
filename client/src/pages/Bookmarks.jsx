import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useBookmarks } from '../context/BookmarkContext';
import BookmarkStar from '../components/BookmarkStar';
import '../styles/Bookmarks.css';

const Bookmarks = () => {
  const { bookmarks } = useBookmarks();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarked = async () => {
      setLoading(true);
      if (bookmarks.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }
      try {
        const results = await Promise.all(
          bookmarks.map((id) => axios.get(`/api/listings/${id}`).then((r) => r.data.listing).catch(() => null))
        );
        setListings(results.filter(Boolean));
      } catch {
        setListings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarked();
  }, [bookmarks]);

  return (
    <div className="bookmarks-page">
      <h1 className="bookmarks-title">Saved Listings</h1>
      <p className="bookmarks-subtitle">
        {bookmarks.length === 0 ? 'Star a listing to save it here.' : `${bookmarks.length} saved listing${bookmarks.length !== 1 ? 's' : ''}`}
      </p>

      {loading ? (
        <div className="bookmarks-loading">
          <div className="bookmarks-spinner" />
          Loading…
        </div>
      ) : listings.length === 0 ? (
        <div className="bookmarks-empty">
          <div className="bookmarks-empty-icon">☆</div>
          <p>No saved listings yet.</p>
          <Link to="/listings" className="bookmarks-browse-btn">Browse Listings</Link>
        </div>
      ) : (
        <motion.div className="bookmarks-grid" layout initial={false}>
          <AnimatePresence>
            {listings.map((listing, index) => (
              <motion.div
                key={listing._id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="property-card"
              >
                <Link to={`/property/${listing._id}`} className="property-card-link" style={{ textDecoration: 'none' }}>
                  <div className="property-card-image">
                    {listing.images && listing.images.length > 0 ? (
                      <>
                        <img src={listing.images[0]} alt={listing.address}
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                        <div className="listing-image-placeholder" style={{ display: 'none' }}>No image</div>
                      </>
                    ) : (
                      <div className="listing-image-placeholder">No image</div>
                    )}
                    {listing.status && listing.status !== 'active' && (
                      <span className="property-badge">{listing.status}</span>
                    )}
                    <BookmarkStar listingId={listing._id} />
                  </div>
                  <div className="property-info">
                    <span className="property-type">Listing</span>
                    <h3>{listing.address}</h3>
                    <p className="location">ZIP: {listing.zipCode}</p>
                    <p className="price">${listing.price.toLocaleString()}</p>
                    <p className="details">{listing.squareFeet} sqft · {listing.status}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Bookmarks;
