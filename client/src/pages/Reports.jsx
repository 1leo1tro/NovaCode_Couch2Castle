import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Reports.css';

const Reports = () => {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('open');
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) return;

    const fetchReport = async () => {
      setLoading(true);
      setError(null);
      setData([]);
      setSummary(null);

      try {
        const response = await axios.get(`/api/reports/${activeTab}`);
        setData(response.data.data || []);
        setSummary(response.data.summary || null);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('You do not have permission to view reports. This page is for managers and admins only.');
        } else {
          setError(err.response?.data?.message || 'Failed to load report.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [activeTab, isAuthenticated]);

  return (
    <div className="reports-page">
      <h1>Reports</h1>
      <p className="reports-subtitle">
        {activeTab === 'open' ? 'Active listings by agent' : 'Closed / sold listings by agent'}
      </p>

      <div className="reports-tabs">
        <button
          className={`reports-tab-btn${activeTab === 'open' ? ' active' : ''}`}
          onClick={() => setActiveTab('open')}
        >
          Open Listings
        </button>
        <button
          className={`reports-tab-btn${activeTab === 'closed' ? ' active' : ''}`}
          onClick={() => setActiveTab('closed')}
        >
          Closed Listings
        </button>
      </div>

      {loading && (
        <div className="reports-loading">
          <div className="reports-loading-spinner" />
          Loading report…
        </div>
      )}

      {error && <div className="reports-error">{error}</div>}

      {!loading && !error && summary && (
        <div className="reports-summary">
          <div className="reports-summary-card">
            <span className="reports-summary-label">Total Agents</span>
            <span className="reports-summary-value">{summary.totalAgents}</span>
          </div>
          <div className="reports-summary-card">
            <span className="reports-summary-label">Total Listings</span>
            <span className="reports-summary-value">{summary.totalListings}</span>
          </div>
          <div className="reports-summary-card">
            <span className="reports-summary-label">Total Value</span>
            <span className="reports-summary-value">${(summary.totalValue ?? 0).toLocaleString()}</span>
          </div>
          {activeTab === 'closed' && summary.avgSalePrice !== undefined && (
            <div className="reports-summary-card">
              <span className="reports-summary-label">Avg Sale Price</span>
              <span className="reports-summary-value">${Math.round(summary.avgSalePrice).toLocaleString()}</span>
            </div>
          )}
          {activeTab === 'closed' && summary.avgDaysOnMarket !== undefined && (
            <div className="reports-summary-card">
              <span className="reports-summary-label">Avg Days on Market</span>
              <span className="reports-summary-value">{Math.round(summary.avgDaysOnMarket)}</span>
            </div>
          )}
        </div>
      )}

      {!loading && !error && data.length > 0 && (
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Agent</th>
                <th>Listings</th>
                <th>Total Value</th>
                {activeTab === 'closed' && <th>Avg Sale Price</th>}
                {activeTab === 'closed' && <th>Avg Days on Market</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={row.agent?._id || idx}>
                  <td>
                    <div className="reports-agent-name">{row.agent?.name || '—'}</div>
                    <div className="reports-agent-email">{row.agent?.email || ''}</div>
                  </td>
                  <td>{(row.listingCount ?? row.count ?? 0).toLocaleString()}</td>
                  <td className="reports-value">${(row.totalValue ?? 0).toLocaleString()}</td>
                  {activeTab === 'closed' && (
                    <td className="reports-value">${Math.round(row.avgSalePrice ?? 0).toLocaleString()}</td>
                  )}
                  {activeTab === 'closed' && (
                    <td>{Math.round(row.avgDaysOnMarket ?? 0)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && data.length === 0 && summary && (
        <p className="reports-empty">No {activeTab} listings found.</p>
      )}
    </div>
  );
};

export default Reports;
