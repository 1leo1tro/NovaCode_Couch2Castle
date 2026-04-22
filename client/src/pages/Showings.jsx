import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Showings.css';

const STATUS_TABS = [
  { value: 'all',       label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_META = {
  pending:   { label: 'Pending',   cls: 'sw-badge--pending' },
  confirmed: { label: 'Confirmed', cls: 'sw-badge--confirmed' },
  completed: { label: 'Completed', cls: 'sw-badge--completed' },
  cancelled: { label: 'Cancelled', cls: 'sw-badge--cancelled' },
};

const Showings = () => {
  const { isAuthenticated } = useAuth();
  const [showings, setShowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [feedbackById, setFeedbackById] = useState({});
  const [savingFeedbackById, setSavingFeedbackById] = useState({});
  const [feedbackStatusById, setFeedbackStatusById] = useState({});
  const [expandedFeedback, setExpandedFeedback] = useState({});

  useEffect(() => { fetchShowings(); }, [isAuthenticated]);

  useEffect(() => {
    setFeedbackById((prev) => {
      const next = {};
      showings.forEach((s) => { next[s._id] = prev[s._id] ?? s.feedback ?? ''; });
      return next;
    });
  }, [showings]);

  const fetchShowings = async () => {
    if (!isAuthenticated()) { setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/showings?limit=500', { headers: { Authorization: `Bearer ${token}` } });
      setShowings(res.data.showings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load showing requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (showingId, newStatus) => {
    setUpdatingStatus(showingId);
    // Optimistic update — update status in full list; client-side filter handles display
    setShowings(prev => prev.map(s => s._id === showingId ? { ...s, status: newStatus } : s));
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`/api/showings/${showingId}`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      await fetchShowings();
    } catch (err) {
      await fetchShowings(); // revert on failure
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteShowing = async (showingId) => {
    if (!window.confirm('Delete this showing request?')) return;
    setShowings(prev => prev.filter(s => s._id !== showingId));
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/showings/${showingId}`, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {
      await fetchShowings(); // revert on failure
      alert(err.response?.data?.message || 'Failed to delete showing');
    }
  };

  const handleFeedbackChange = (showingId, value) => {
    setFeedbackById((p) => ({ ...p, [showingId]: value }));
    setFeedbackStatusById((p) => ({ ...p, [showingId]: null }));
  };

  const handleSaveFeedback = async (showingId) => {
    try {
      setSavingFeedbackById((p) => ({ ...p, [showingId]: true }));
      setFeedbackStatusById((p) => ({ ...p, [showingId]: null }));
      const token = localStorage.getItem('token');
      const feedback = feedbackById[showingId] ?? '';
      const res = await axios.patch(`/api/showings/${showingId}/feedback`, { feedback }, { headers: { Authorization: `Bearer ${token}` } });
      const saved = res.data?.showing?.feedback ?? feedback;
      setFeedbackById((p) => ({ ...p, [showingId]: saved }));
      setShowings((prev) => prev.map((s) => s._id === showingId ? { ...s, feedback: saved } : s));
      setFeedbackStatusById((p) => ({ ...p, [showingId]: { type: 'saved', message: 'Saved' } }));
    } catch (err) {
      setFeedbackStatusById((p) => ({ ...p, [showingId]: { type: 'error', message: err.response?.data?.message || 'Failed to save' } }));
    } finally {
      setSavingFeedbackById((p) => ({ ...p, [showingId]: false }));
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const visibleShowings = filterStatus === 'all'
    ? showings
    : showings.filter(s => s.status === filterStatus);

  const allCounts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
  showings.forEach(s => { if (allCounts[s.status] !== undefined) allCounts[s.status]++; });

  if (!isAuthenticated()) {
    return (
      <div className="sw-page">
        <div className="sw-wrap">
          <div className="sw-access-denied">
            <div className="sw-denied-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
            <h2>Access Denied</h2>
            <p>You must be signed in as an agent to view showing requests.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sw-page">
      <div className="sw-wrap">

        {/* Header */}
        <div className="sw-header">
          <div>
            <h1 className="sw-title">Showing Requests</h1>
            <p className="sw-sub">Manage tour requests for your property listings</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="sw-tabs">
          {STATUS_TABS.map(tab => (
            <button
              key={tab.value}
              className={`sw-tab${filterStatus === tab.value ? ' sw-tab--active' : ''}`}
              onClick={() => setFilterStatus(tab.value)}
            >
              {tab.label}
              <span className="sw-tab-count">
                {tab.value === 'all' ? showings.length : allCounts[tab.value]}
              </span>
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="sw-error">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {error}
            <button className="sw-retry-btn" onClick={fetchShowings}>Retry</button>
          </div>
        )}

        {/* Loading skeletons */}
        {loading ? (
          <div className="sw-skeleton-list">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="sw-skeleton-card">
                <div className="sw-skeleton-row">
                  <div className="sw-skeleton-avatar" />
                  <div className="sw-skeleton-lines">
                    <div className="sw-skeleton-line sw-skeleton-line--w50" />
                    <div className="sw-skeleton-line sw-skeleton-line--w30" />
                  </div>
                  <div className="sw-skeleton-badge" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleShowings.length === 0 ? (
          <div className="sw-empty">
            <div className="sw-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="28" height="28">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3>No {filterStatus !== 'all' ? filterStatus : ''} showing requests</h3>
            <p>{filterStatus === 'all' ? 'Tour requests from buyers will appear here.' : `No ${filterStatus} requests at this time.`}</p>
          </div>
        ) : (
          <motion.div className="sw-list" layout initial={false}>
            <AnimatePresence>
              {visibleShowings.map((showing, index) => {
                const meta = STATUS_META[showing.status] || {};
                const isUpdating = updatingStatus === showing.id;
                const feedbackOpen = expandedFeedback[showing._id];
                const isCompleted = showing.status === 'completed';

                return (
                  <motion.div
                    key={showing._id}
                    layout
                    className="sw-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.28, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }}
                  >
                    {/* Card top row */}
                    <div className="sw-card-top">
                      <div className="sw-avatar">
                        {(showing.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="sw-card-info">
                        <div className="sw-card-name">{showing.name}</div>
                        <div className="sw-card-contacts">
                          <a href={`mailto:${showing.email}`} className="sw-contact-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            {showing.email}
                          </a>
                          <a href={`tel:${showing.phone}`} className="sw-contact-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.43 2 2 0 0 1 3.62 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z"/></svg>
                            {showing.phone}
                          </a>
                        </div>
                      </div>
                      <span className={`sw-badge ${meta.cls}`}>{meta.label}</span>
                    </div>

                    {/* Property + date */}
                    <div className="sw-card-meta">
                      <div className="sw-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                        <span className="sw-meta-address">{showing.listing?.address || 'N/A'}</span>
                        {showing.listing?.price && (
                          <span className="sw-meta-price">${showing.listing.price.toLocaleString()}</span>
                        )}
                      </div>
                      <div className="sw-meta-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        <span>{formatDate(showing.preferredDate)}</span>
                        {(showing.status === 'confirmed' || showing.status === 'completed') && (
                          <span className="sw-confirmed-tag">Confirmed</span>
                        )}
                      </div>
                      {showing.message && (
                        <div className="sw-meta-item sw-meta-item--message">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                          <span className="sw-message-text">"{showing.message}"</span>
                        </div>
                      )}
                    </div>

                    {/* Action row */}
                    <div className="sw-card-footer">
                      <div className="sw-actions">
                        {showing.status === 'pending' && (
                          <>
                            <button
                              className="sw-btn sw-btn--approve"
                              onClick={() => handleStatusUpdate(showing._id, 'confirmed')}
                              disabled={isUpdating}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><path d="M20 6L9 17l-5-5"/></svg>
                              Approve
                            </button>
                            <button
                              className="sw-btn sw-btn--reject"
                              onClick={() => handleStatusUpdate(showing._id, 'cancelled')}
                              disabled={isUpdating}
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Reject
                            </button>
                          </>
                        )}
                        {showing.status === 'confirmed' && (
                          <button
                            className="sw-btn sw-btn--complete"
                            onClick={() => handleStatusUpdate(showing._id, 'completed')}
                            disabled={isUpdating}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="13" height="13"><path d="M9 12l2 2 4-4"/><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/></svg>
                            Mark Complete
                          </button>
                        )}
                        <button
                          className="sw-btn sw-btn--notes"
                          onClick={() => setExpandedFeedback(p => ({ ...p, [showing._id]: !p[showing._id] }))}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                          {isCompleted ? 'Feedback' : 'Notes'}
                        </button>
                        <button
                          className="sw-btn sw-btn--delete"
                          onClick={() => handleDeleteShowing(showing._id)}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Expandable feedback/notes panel */}
                    <AnimatePresence>
                      {feedbackOpen && (
                        <motion.div
                          className={`sw-feedback-panel${isCompleted ? ' sw-feedback-panel--post' : ''}`}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22 }}
                        >
                          <label className="sw-feedback-label">
                            {isCompleted ? 'Post-Showing Feedback' : 'Pre-Showing Notes'}
                          </label>
                          <textarea
                            className="sw-feedback-textarea"
                            value={feedbackById[showing._id] ?? ''}
                            onChange={(e) => handleFeedbackChange(showing._id, e.target.value)}
                            rows={isCompleted ? 4 : 2}
                            placeholder={isCompleted
                              ? 'How did the showing go? Note client reactions, likelihood of an offer, follow-up steps…'
                              : 'Internal notes before the showing…'}
                          />
                          <div className="sw-feedback-footer">
                            <button
                              className="sw-btn sw-btn--save"
                              onClick={() => handleSaveFeedback(showing._id)}
                              disabled={!!savingFeedbackById[showing._id]}
                            >
                              {savingFeedbackById[showing._id] ? 'Saving…' : 'Save'}
                            </button>
                            {feedbackStatusById[showing._id]?.message && (
                              <span className={`sw-feedback-msg sw-feedback-msg--${feedbackStatusById[showing._id].type}`}>
                                {feedbackStatusById[showing._id].type === 'saved' && (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12"><path d="M20 6L9 17l-5-5"/></svg>
                                )}
                                {feedbackStatusById[showing._id].message}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && visibleShowings.length > 0 && (
          <p className="sw-results-count">{visibleShowings.length} request{visibleShowings.length !== 1 ? 's' : ''}</p>
        )}
      </div>
    </div>
  );
};

export default Showings;
