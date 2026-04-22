import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useBookmarks } from '../context/BookmarkContext';
import ListingCard from '../components/ListingCard';
import '../styles/Bookmarks.css';

const Bookmarks = () => {
  const { bookmarks } = useBookmarks();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
                className="listing-card-wrapper"
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <ListingCard
                  listing={listing}
                  onSelect={(id) => navigate(`/listings?listing=${id}`)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Bookmarks;
