import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Showings.css';

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

  useEffect(() => {
    fetchShowings();
  }, [isAuthenticated, filterStatus]);

  useEffect(() => {
    setFeedbackById((previousFeedback) => {
      const nextFeedback = {};

      showings.forEach((showing) => {
        nextFeedback[showing._id] = previousFeedback[showing._id] ?? showing.feedback ?? '';
      });

      return nextFeedback;
    });
  }, [showings]);

  const fetchShowings = async () => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const url = filterStatus === 'all' 
        ? '/api/showings' 
        : `/api/showings?status=${filterStatus}`;
      
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setShowings(response.data.showings || []);
    } catch (err) {
      console.error('Error fetching showings:', err);
      setError(err.response?.data?.message || 'Failed to load showing requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (showingId, newStatus) => {
    try {
      setUpdatingStatus(showingId);
      const token = localStorage.getItem('token');
      
      await axios.patch(
        `/api/showings/${showingId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Refresh the list
      await fetchShowings();
    } catch (err) {
      console.error('Error updating showing status:', err);
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteShowing = async (showingId) => {
    if (!window.confirm('Are you sure you want to delete this showing request?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`/api/showings/${showingId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh the list
      await fetchShowings();
    } catch (err) {
      console.error('Error deleting showing:', err);
      alert(err.response?.data?.message || 'Failed to delete showing');
    }
  };

  const handleFeedbackChange = (showingId, value) => {
    setFeedbackById((previous) => ({
      ...previous,
      [showingId]: value
    }));

    setFeedbackStatusById((previous) => ({
      ...previous,
      [showingId]: null
    }));
  };

  const handleSaveFeedback = async (showingId) => {
    try {
      setSavingFeedbackById((previous) => ({
        ...previous,
        [showingId]: true
      }));

      setFeedbackStatusById((previous) => ({
        ...previous,
        [showingId]: null
      }));

      const token = localStorage.getItem('token');
      const feedback = feedbackById[showingId] ?? '';

      const response = await axios.patch(
        `/api/showings/${showingId}/feedback`,
        { feedback },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const savedFeedback = response.data?.showing?.feedback ?? feedback;

      setFeedbackById((previous) => ({
        ...previous,
        [showingId]: savedFeedback
      }));

      setShowings((previousShowings) =>
        previousShowings.map((showing) =>
          showing._id === showingId
            ? { ...showing, feedback: savedFeedback }
            : showing
        )
      );

      setFeedbackStatusById((previous) => ({
        ...previous,
        [showingId]: { type: 'saved', message: 'Saved' }
      }));
    } catch (err) {
      console.error('Error updating showing feedback:', err);
      setFeedbackStatusById((previous) => ({
        ...previous,
        [showingId]: {
          type: 'error',
          message: err.response?.data?.message || 'Failed to save feedback'
        }
      }));
    } finally {
      setSavingFeedbackById((previous) => ({
        ...previous,
        [showingId]: false
      }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadgeClass = (status) => {
    return `showing-status showing-status-${status}`;
  };

  if (!isAuthenticated()) {
    return (
      <div className="showings-page">
        <div className="showings-container">
          <h1>Access Denied</h1>
          <p>You must be signed in as an agent to view showing requests.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="showings-page">
        <div className="showings-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading showing requests...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="showings-page">
        <div className="showings-container">
          <div className="error-message">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={fetchShowings} className="btn-retry">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="showings-page">
      <div className="showings-container">
        <div className="page-header">
          <h1>Showing Requests</h1>
          <p className="page-subtitle">
            Manage tour requests for your property listings
          </p>
        </div>

        <div className="filter-section">
          <label htmlFor="status-filter">Filter by status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="status-filter"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {showings.length === 0 ? (
          <div className="showings-empty">
            <svg 
              className="empty-icon" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            <h2>No showing requests found</h2>
            <p>
              {filterStatus === 'all' 
                ? 'When someone requests a tour of your listings, they will appear here.'
                : `No ${filterStatus} showing requests at this time.`
              }
            </p>
          </div>
        ) : (
          <div className="showings-table-container">
            <table className="showings-table">
              <thead>
                <tr>
                  <th>Requester</th>
                  <th>Contact</th>
                  <th>Property Address</th>
                  <th>Scheduled Date & Time</th>
                  <th>Status</th>
                  <th>Feedback</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {showings.map((showing) => (
                  <tr key={showing._id}>
                    <td>
                      <div className="requester-info">
                        <span className="requester-name">{showing.name}</span>
                        {showing.message && (
                          <span className="requester-message" title={showing.message}>
                            💬 Has message
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <a href={`mailto:${showing.email}`} className="contact-link">
                          {showing.email}
                        </a>
                        <a href={`tel:${showing.phone}`} className="contact-link">
                          {showing.phone}
                        </a>
                      </div>
                    </td>
                    <td>
                      <div className="property-info">
                        <span className="property-address">
                          {showing.listing?.address || 'N/A'}
                        </span>
                        {showing.listing?.price && (
                          <span className="property-price">
                            ${showing.listing.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="date-info">
                        {formatDate(showing.preferredDate)}
                        {(showing.status === 'confirmed' || showing.status === 'completed') && (
                          <span className="confirmed-date-label">Confirmed</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(showing.status)}>
                        {showing.status.charAt(0).toUpperCase() + showing.status.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div className="feedback-cell">
                        <textarea
                          className="feedback-textarea"
                          value={feedbackById[showing._id] ?? ''}
                          onChange={(e) => handleFeedbackChange(showing._id, e.target.value)}
                          rows={3}
                          placeholder="Add feedback for this showing"
                        />
                        <div className="feedback-actions">
                          <button
                            onClick={() => handleSaveFeedback(showing._id)}
                            disabled={Boolean(savingFeedbackById[showing._id])}
                            className="btn-action btn-feedback-save"
                            title="Save feedback"
                          >
                            {savingFeedbackById[showing._id] ? 'Saving...' : 'Save'}
                          </button>
                          {feedbackStatusById[showing._id]?.message && (
                            <span
                              className={`feedback-status feedback-status-${feedbackStatusById[showing._id].type}`}
                            >
                              {feedbackStatusById[showing._id].message}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="actions-cell">
                        {showing.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(showing._id, 'confirmed')}
                              disabled={updatingStatus === showing._id}
                              className="btn-action btn-approve"
                              title="Approve showing request"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(showing._id, 'cancelled')}
                              disabled={updatingStatus === showing._id}
                              className="btn-action btn-reject"
                              title="Reject showing request"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {showing.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(showing._id, 'completed')}
                            disabled={updatingStatus === showing._id}
                            className="btn-action btn-complete"
                            title="Mark as completed"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteShowing(showing._id)}
                          className="btn-action btn-delete"
                          title="Delete showing"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showings.length > 0 && (
          <div className="results-summary">
            Showing {showings.length} request{showings.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

export default Showings;
