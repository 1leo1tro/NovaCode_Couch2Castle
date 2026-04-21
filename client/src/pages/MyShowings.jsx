import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useShowingNotifications } from '../context/ShowingNotificationsContext';
import '../styles/MyShowings.css';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: '#d97706', bg: '#fef3c7' },
  confirmed: { label: 'Confirmed', color: '#059669', bg: '#d1fae5' },
  completed: { label: 'Completed', color: '#2563eb', bg: '#dbeafe' },
  cancelled: { label: 'Cancelled', color: '#dc2626', bg: '#fee2e2' },
};

const loadIds = () => {
  try { return JSON.parse(localStorage.getItem('c2c_my_showings') || '[]'); }
  catch { return []; }
};

const MyShowings = () => {
  const [showings, setShowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { markAllSeen } = useShowingNotifications();

  useEffect(() => {
    const ids = loadIds();
    if (ids.length === 0) { setLoading(false); return; }

    Promise.all(
      ids.map((id) => axios.get(`/api/showings/${id}`).then((r) => r.data.showing).catch(() => null))
    ).then((results) => {
      setShowings(results.filter(Boolean).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setLoading(false);
      markAllSeen();
    });
  }, []);

  return (
    <div className="my-showings-page">
      <h1 className="my-showings-title">My Showings</h1>
      <p className="my-showings-subtitle">Track the status of your tour requests.</p>

      {loading ? (
        <div className="my-showings-loading">
          <div className="my-showings-spinner" />
          Loading…
        </div>
      ) : showings.length === 0 ? (
        <div className="my-showings-empty">
          <div className="my-showings-empty-icon">🏠</div>
          <p>No showing requests yet.</p>
          <Link to="/listings" className="my-showings-browse-btn">Browse Listings</Link>
        </div>
      ) : (
        <motion.div className="my-showings-list" layout initial={false}>
          <AnimatePresence>
            {showings.map((showing, i) => {
              const cfg = STATUS_CONFIG[showing.status] || STATUS_CONFIG.pending;
              const address = showing.listing?.address || 'Property';
              const date = showing.preferredDate
                ? new Date(showing.preferredDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '—';
              return (
                <motion.div
                  key={showing._id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.04 }}
                  className="my-showings-card"
                >
                  <div className="my-showings-card-header">
                    <div>
                      <p className="my-showings-address">{address}</p>
                      <p className="my-showings-date">{date}</p>
                    </div>
                    <span
                      className="my-showings-status"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  {showing.message && (
                    <p className="my-showings-message">"{showing.message}"</p>
                  )}

                  {showing.feedback && (
                    <div className="my-showings-feedback">
                      <span className="my-showings-feedback-label">Agent note:</span>
                      {showing.feedback}
                    </div>
                  )}

                  {showing.listing?._id && (
                    <Link to={`/property/${showing.listing._id}`} className="my-showings-view-btn">
                      View Listing →
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default MyShowings;
