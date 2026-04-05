import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/App.css';

const ManagerReports = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchOpenListings();
  }, []);

  const fetchOpenListings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/reports/open-listings');
      setListings(response.data.data || []);
    } catch (err) {
      console.error('Error fetching open listings:', err);
      setError(err.response?.data?.message || 'Failed to load open listings report');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="manager-reports-page">
      <div className="reports-header">
        <h1>Open Listings Report</h1>
        <p>Current open listings with key metrics</p>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {loading ? (
        <div className="loading">Loading report...</div>
      ) : (
        <div className="reports-table-container">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Address</th>
                <th>Price</th>
                <th>Days on Market</th>
                <th>Showing Count</th>
                <th>Agent</th>
                <th>Status</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing._id}>
                  <td>{listing.address}</td>
                  <td>{formatPrice(listing.price)}</td>
                  <td>{listing.daysOnMarket}</td>
                  <td>{listing.showingCount}</td>
                  <td>
                    {listing.agent ? (
                      <div>
                        <div>{listing.agent.name}</div>
                        <div className="agent-email">{listing.agent.email}</div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>
                    <span className={`status-badge status-${listing.status}`}>
                      {listing.status}
                    </span>
                  </td>
                  <td>{formatDate(listing.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {listings.length === 0 && (
            <div className="no-data">No open listings found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerReports;