import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Showings.css';

const Showings = () => {
  const { isAuthenticated } = useAuth();
  const [showings, setShowings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShowings = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await axios.get('/api/showings');
        setShowings(response.data.showings || []);
      } catch (err) {
        console.error('Error fetching showings:', err);
        setError(err.response?.data?.message || 'Failed to load showing requests');
      } finally {
        setLoading(false);
      }
    };

    fetchShowings();
  }, [isAuthenticated]);

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
          <h2>Loading showing requests...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="showings-page">
        <div className="showings-container">
          <h2>Error: {error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="showings-page">
      <div className="showings-container">
        <h1>Showing Requests</h1>

        {showings.length === 0 ? (
          <div className="showings-empty">
            <p>No showing requests yet.</p>
            <p className="showings-empty-subtitle">
              When someone requests a tour of your listings, they will appear here.
            </p>
          </div>
        ) : (
          <div className="showings-list">
            {showings.map((showing) => (
              <div key={showing._id} className="showing-card">
                <div className="showing-header">
                  <h3>{showing.name}</h3>
                  <span className={`showing-status showing-status-${showing.status}`}>
                    {showing.status}
                  </span>
                </div>

                <div className="showing-details">
                  <p><strong>Property:</strong> {showing.listing?.address || 'N/A'}</p>
                  <p><strong>Email:</strong> {showing.email}</p>
                  <p><strong>Phone:</strong> {showing.phone}</p>
                  <p><strong>Preferred Date:</strong> {new Date(showing.preferredDate).toLocaleString()}</p>
                  {showing.message && (
                    <p><strong>Message:</strong> {showing.message}</p>
                  )}
                </div>

                <div className="showing-actions">
                  <button className="btn-primary" disabled>
                    Confirm (Coming Soon)
                  </button>
                  <button className="btn-secondary" disabled>
                    Cancel (Coming Soon)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Showings;
