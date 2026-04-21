import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Reports.css';

const Reports = () => {
  const { isAuthenticated, user } = useAuth();
  const isManager = user?.role === 'manager';
  const [activeTab, setActiveTab] = useState('open');
  const [listings, setListings] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      setListings([]);
      setSummary(null);

      try {
        const response = await axios.get(`/api/reports/${activeTab}`);
        setListings(response.data.listings || []);
        setSummary(response.data.summary || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [activeTab, isAuthenticated]);

  const formatPrice = (n) => `$${Number(n ?? 0).toLocaleString()}`;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
  const daysOnMarket = (listing) => {
    if (listing.daysOnMarket != null) return listing.daysOnMarket;
    if (listing.closingDate && listing.createdAt) {
      return Math.round((new Date(listing.closingDate) - new Date(listing.createdAt)) / 86400000);
    }
    return null;
  };

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Reports</h1>
        <div className="reports-tabs">
          <button
            className={`reports-tab-btn${activeTab === 'open' ? ' active' : ''}`}
            onClick={() => setActiveTab('open')}
          >
            Active
          </button>
          <button
            className={`reports-tab-btn${activeTab === 'closed' ? ' active' : ''}`}
            onClick={() => setActiveTab('closed')}
          >
            Sold
          </button>
        </div>
      </div>

      {loading && <div className="reports-loading"><span className="reports-loading-spinner" /> Loading…</div>}
      {error && <div className="reports-error">{error}</div>}

      {!loading && !error && summary && (
        <div className="reports-strip">
          <div className="reports-strip-item">
            <span className="reports-strip-val">{summary.totalListings}</span>
            <span className="reports-strip-label">{activeTab === 'open' ? 'Active listings' : 'Sold listings'}</span>
          </div>
          <div className="reports-strip-divider" />
          <div className="reports-strip-item">
            <span className="reports-strip-val">{formatPrice(summary.totalValue)}</span>
            <span className="reports-strip-label">{activeTab === 'open' ? 'Total list value' : 'Total sold value'}</span>
          </div>
          {activeTab === 'closed' && summary.avgSalePrice !== undefined && (
            <>
              <div className="reports-strip-divider" />
              <div className="reports-strip-item">
                <span className="reports-strip-val">{formatPrice(Math.round(summary.avgSalePrice))}</span>
                <span className="reports-strip-label">Avg sale price</span>
              </div>
            </>
          )}
          {activeTab === 'closed' && summary.avgDaysOnMarket !== undefined && (
            <>
              <div className="reports-strip-divider" />
              <div className="reports-strip-item">
                <span className="reports-strip-val">{Math.round(summary.avgDaysOnMarket)}</span>
                <span className="reports-strip-label">Avg days on market</span>
              </div>
            </>
          )}
          {summary.totalViews !== undefined && (
            <>
              <div className="reports-strip-divider" />
              <div className="reports-strip-item">
                <span className="reports-strip-val">{summary.totalViews.toLocaleString()}</span>
                <span className="reports-strip-label">Total views</span>
              </div>
            </>
          )}
          {summary.totalShowings !== undefined && (
            <>
              <div className="reports-strip-divider" />
              <div className="reports-strip-item">
                <span className="reports-strip-val">{summary.totalShowings}</span>
                <span className="reports-strip-label">
                  {activeTab === 'closed' ? 'Total showings' : 'Total showings'}
                </span>
              </div>
            </>
          )}
          {activeTab === 'closed' && summary.totalCompletedShowings !== undefined && (
            <>
              <div className="reports-strip-divider" />
              <div className="reports-strip-item">
                <span className="reports-strip-val">{summary.totalCompletedShowings}</span>
                <span className="reports-strip-label">Completed showings</span>
              </div>
            </>
          )}
        </div>
      )}

      {!loading && !error && listings.length > 0 && (
        <ul className="reports-list">
          {listings.map((listing) => (
            <li key={listing._id} className="reports-row">
              <div className="reports-row-main">
                <span className="reports-row-address">{listing.address}</span>
                <span className="reports-row-zip">{listing.zipCode}</span>
                {isManager && listing.createdBy?.name && (
                  <span className="reports-row-agent">{listing.createdBy.name}</span>
                )}
              </div>
              <div className="reports-row-meta">
                {activeTab === 'open' ? (
                  <>
                    <span className="reports-row-price">{formatPrice(listing.price)}</span>
                    <span className={`reports-row-status reports-row-status--${listing.status}`}>{listing.status}</span>
                    <span className="reports-row-date">Listed {formatDate(listing.createdAt)}</span>
                  </>
                ) : (
                  <>
                    <span className="reports-row-price">{formatPrice(listing.finalSalePrice ?? listing.price)}</span>
                    <span className="reports-row-date">Closed {formatDate(listing.closingDate)}</span>
                    {daysOnMarket(listing) !== null && (
                      <span className="reports-row-dom">{daysOnMarket(listing)} days on market</span>
                    )}
                  </>
                )}
                <div className="reports-row-counts">
                  <span className="reports-row-count" title="Page views">
                    <span className="reports-row-count-val">{listing.viewCount ?? 0}</span> views
                  </span>
                  <span className="reports-row-count" title="Showing requests">
                    <span className="reports-row-count-val">{listing.showingCount ?? 0}</span> showings
                  </span>
                  {activeTab === 'closed' && (
                    <span className="reports-row-count" title="Completed showings">
                      <span className="reports-row-count-val">{listing.completedShowings ?? 0}</span> completed
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && listings.length === 0 && summary && (
        <p className="reports-empty">No {activeTab === 'open' ? 'active' : 'sold'} listings.</p>
      )}
    </div>
  );
};

export default Reports;
