import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/Reports.css';

const fmt$ = (n) => `$${Number(n ?? 0).toLocaleString()}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const dom = (l) => {
  if (l.daysOnMarket != null) return Math.max(0, l.daysOnMarket);
  if (l.closingDate && l.createdAt) return Math.max(0, Math.round((new Date(l.closingDate) - new Date(l.createdAt)) / 86400000));
  return null;
};

const STATUS_CLS = { pending: 'badge--yellow', confirmed: 'badge--blue', completed: 'badge--green', cancelled: 'badge--red', active: 'badge--green', sold: 'badge--gray' };

const Spinner = () => (
  <div className="reports-loading"><span className="reports-loading-spinner" /> Loading…</div>
);

/* ── SVG icons ──────────────────────────────────────────── */
const IconAgents = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
    <path d="M19 8v6M22 11h-6" strokeWidth="2"/>
  </svg>
);
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
);
const IconClipboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <rect x="8" y="2" width="8" height="4" rx="1"/>
    <line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/>
  </svg>
);
const IconDollar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/>
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const KPICard = ({ icon, value, label }) => (
  <div className="kpi-card">
    <div className="kpi-icon">{icon}</div>
    <div className="kpi-body">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  </div>
);

/* ── Create Agent Drawer ─────────────────────────────────── */
const CreateAgentDrawer = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const nameRef = useRef(null);

  useEffect(() => {
    if (open) {
      setForm({ name: '', email: '', password: '', phone: '' });
      setError(null);
      setTimeout(() => nameRef.current?.focus(), 60);
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await axios.post('/api/agents', form);
      onCreated(res.data.agent);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create agent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {open && <div className="drawer-backdrop" onClick={onClose} />}
      <div className={`drawer${open ? ' drawer--open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">New Agent</h2>
          <button className="drawer-close" onClick={onClose}><IconX /></button>
        </div>
        <form className="drawer-form" onSubmit={submit}>
          <label className="drawer-label">
            Full Name <span className="drawer-req">*</span>
            <input ref={nameRef} className="drawer-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Jane Smith" />
          </label>
          <label className="drawer-label">
            Email <span className="drawer-req">*</span>
            <input className="drawer-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="jane@example.com" />
          </label>
          <label className="drawer-label">
            Password <span className="drawer-req">*</span>
            <input className="drawer-input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min. 6 characters" minLength={6} />
          </label>
          <label className="drawer-label">
            Phone <span className="drawer-opt">(optional)</span>
            <input className="drawer-input" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="10-digit number" />
          </label>
          {error && <p className="drawer-error">{error}</p>}
          <div className="drawer-actions">
            <button type="button" className="drawer-btn-cancel" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="drawer-btn-submit" disabled={saving}>
              {saving ? 'Creating…' : 'Create Agent'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

/* ── Main Component ─────────────────────────────────────── */
const Reports = () => {
  const { isAuthenticated, user } = useAuth();
  const isManager = user?.role === 'manager';

  const [section, setSection] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const [listingsTab, setListingsTab] = useState('open');
  const [listings, setListings] = useState([]);
  const [listingsSummary, setListingsSummary] = useState(null);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(null);
  const [listingsPage, setListingsPage] = useState(1);
  const LISTINGS_PER_PAGE = 20;

  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [agentsError, setAgentsError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [showings, setShowings] = useState([]);
  const [showingsSummary, setShowingsSummary] = useState(null);
  const [showingsLoading, setShowingsLoading] = useState(false);
  const [showingsError, setShowingsError] = useState(null);
  const [showingsFilter, setShowingsFilter] = useState('all');

  useEffect(() => {
    if (section !== 'overview' || !isAuthenticated()) return;
    setOverviewLoading(true);
    axios.get('/api/reports/overview')
      .then(r => setOverview(r.data.overview))
      .catch(() => setOverview(null))
      .finally(() => setOverviewLoading(false));
  }, [section]);

  const fetchAgents = () => {
    setAgentsLoading(true);
    setAgentsError(null);
    axios.get('/api/reports/agents')
      .then(r => setAgents(r.data.agents || []))
      .catch(e => setAgentsError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setAgentsLoading(false));
  };

  useEffect(() => {
    if (section !== 'listings' || !isAuthenticated()) return;
    setListingsLoading(true);
    setListingsError(null);
    setListingsPage(1);
    axios.get(`/api/reports/${listingsTab}`)
      .then(r => { setListings(r.data.listings || []); setListingsSummary(r.data.summary || null); })
      .catch(e => setListingsError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setListingsLoading(false));
  }, [section, listingsTab]);

  useEffect(() => {
    if (section !== 'agents' || !isAuthenticated()) return;
    fetchAgents();
  }, [section]);

  useEffect(() => {
    if (section !== 'showings' || !isAuthenticated()) return;
    setShowingsLoading(true);
    setShowingsError(null);
    axios.get('/api/reports/showings')
      .then(r => { setShowings(r.data.showings || []); setShowingsSummary(r.data.summary || null); })
      .catch(e => setShowingsError(e.response?.data?.message || 'Failed to load.'))
      .finally(() => setShowingsLoading(false));
  }, [section]);

  const filteredShowings = showingsFilter === 'all' ? showings : showings.filter(s => s.status === showingsFilter);

  const NAV = [
    { id: 'overview', label: 'Overview' },
    { id: 'listings', label: 'Listings' },
    { id: 'agents',   label: 'Agents' },
    { id: 'showings', label: 'Showings' },
  ];

  return (
    <div className="reports-page">
      <div className="reports-header">
        <h1>Manager Portal</h1>
      </div>

      <nav className="reports-nav">
        {NAV.map(n => (
          <button key={n.id} className={`reports-nav-btn${section === n.id ? ' active' : ''}`} onClick={() => setSection(n.id)}>
            {n.label}
          </button>
        ))}
      </nav>

      {/* ── OVERVIEW ─────────────────────────────────── */}
      {section === 'overview' && (
        <div className="reports-section">
          {overviewLoading ? <Spinner /> : overview ? (
            <div className="kpi-grid">
              <KPICard icon={<IconAgents />}   value={overview.activeAgents}                 label="Active Agents" />
              <KPICard icon={<IconHome />}      value={overview.activeListings}               label="Active Listings" />
              <KPICard icon={<IconClipboard />} value={overview.pendingShowings}              label="Pending Showings" />
              <KPICard icon={<IconDollar />}    value={fmt$(overview.totalSalesVolume)}       label="Total Sales Volume" />
              <KPICard icon={<IconCheck />}     value={overview.totalSold}                    label="Properties Sold" />
              <KPICard icon={<IconCalendar />}  value={overview.closingsThisMonth}            label="Closings This Month" />
            </div>
          ) : (
            <p className="reports-empty">Could not load overview.</p>
          )}
        </div>
      )}

      {/* ── LISTINGS ─────────────────────────────────── */}
      {section === 'listings' && (
        <div className="reports-section">
          <div className="reports-tabs">
            <button className={`reports-tab-btn${listingsTab === 'open' ? ' active' : ''}`} onClick={() => setListingsTab('open')}>Active</button>
            <button className={`reports-tab-btn${listingsTab === 'closed' ? ' active' : ''}`} onClick={() => setListingsTab('closed')}>Sold</button>
          </div>

          {listingsLoading && <Spinner />}
          {listingsError && <div className="reports-error">{listingsError}</div>}

          {!listingsLoading && !listingsError && listingsSummary && (
            <div className="reports-strip">
              <div className="reports-strip-item">
                <span className="reports-strip-val">{listingsSummary.totalListings}</span>
                <span className="reports-strip-label">{listingsTab === 'open' ? 'Active listings' : 'Sold listings'}</span>
              </div>
              <div className="reports-strip-divider" />
              <div className="reports-strip-item">
                <span className="reports-strip-val">{fmt$(listingsSummary.totalValue)}</span>
                <span className="reports-strip-label">{listingsTab === 'open' ? 'Total list value' : 'Total sold value'}</span>
              </div>
              {listingsTab === 'closed' && listingsSummary.avgSalePrice !== undefined && (<><div className="reports-strip-divider" /><div className="reports-strip-item"><span className="reports-strip-val">{fmt$(Math.round(listingsSummary.avgSalePrice))}</span><span className="reports-strip-label">Avg sale price</span></div></>)}
              {listingsTab === 'closed' && listingsSummary.avgDaysOnMarket !== undefined && (<><div className="reports-strip-divider" /><div className="reports-strip-item"><span className="reports-strip-val">{Math.max(0, Math.round(listingsSummary.avgDaysOnMarket))}</span><span className="reports-strip-label">Avg days on market</span></div></>)}
              {listingsSummary.totalViews !== undefined && (<><div className="reports-strip-divider" /><div className="reports-strip-item"><span className="reports-strip-val">{listingsSummary.totalViews.toLocaleString()}</span><span className="reports-strip-label">Total views</span></div></>)}
              {listingsSummary.totalShowings !== undefined && (<><div className="reports-strip-divider" /><div className="reports-strip-item"><span className="reports-strip-val">{listingsSummary.totalShowings}</span><span className="reports-strip-label">Total showings</span></div></>)}
              {listingsTab === 'closed' && listingsSummary.totalCompletedShowings !== undefined && (<><div className="reports-strip-divider" /><div className="reports-strip-item"><span className="reports-strip-val">{listingsSummary.totalCompletedShowings}</span><span className="reports-strip-label">Completed showings</span></div></>)}
            </div>
          )}

          {!listingsLoading && !listingsError && listings.length > 0 && (() => {
            const totalPages = Math.ceil(listings.length / LISTINGS_PER_PAGE);
            const paged = listings.slice((listingsPage - 1) * LISTINGS_PER_PAGE, listingsPage * LISTINGS_PER_PAGE);
            return (
              <>
                <div className="reports-table-wrap">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Address</th>
                        <th>ZIP</th>
                        {isManager && <th>Agent</th>}
                        <th>{listingsTab === 'open' ? 'List Price' : 'Sale Price'}</th>
                        {listingsTab === 'open'
                          ? <><th>Status</th><th>Listed</th></>
                          : <><th>Closed</th><th>Days on Market</th></>
                        }
                        <th>Views</th>
                        <th>Showings</th>
                        {listingsTab === 'closed' && <th>Completed</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((listing) => (
                        <tr key={listing._id}>
                          <td className="reports-td-name">{listing.address}</td>
                          <td className="reports-td-muted">{listing.zipCode}</td>
                          {isManager && <td className="reports-td-accent">{listing.createdBy?.name || '—'}</td>}
                          <td className="reports-td-name">{fmt$(listingsTab === 'open' ? listing.price : (listing.finalSalePrice ?? listing.price))}</td>
                          {listingsTab === 'open' ? (
                            <>
                              <td><span className={`reports-row-status reports-row-status--${listing.status}`}>{listing.status}</span></td>
                              <td className="reports-td-muted">{fmtDate(listing.createdAt)}</td>
                            </>
                          ) : (
                            <>
                              <td className="reports-td-muted">{fmtDate(listing.closingDate)}</td>
                              <td className="reports-td-muted">{dom(listing) !== null ? dom(listing) : '—'}</td>
                            </>
                          )}
                          <td className="reports-td-muted">{(listing.viewCount ?? 0).toLocaleString()}</td>
                          <td className="reports-td-muted">{listing.showingCount ?? 0}</td>
                          {listingsTab === 'closed' && <td className="reports-td-muted">{listing.completedShowings ?? 0}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="reports-pagination">
                    <button className="reports-pg-btn" onClick={() => setListingsPage(p => p - 1)} disabled={listingsPage === 1}>&#8249;</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || Math.abs(p - listingsPage) <= 1)
                      .reduce((acc, p, i, arr) => { if (i > 0 && p - arr[i - 1] > 1) acc.push('…'); acc.push(p); return acc; }, [])
                      .map((item, i) => item === '…'
                        ? <span key={`e${i}`} className="reports-pg-ellipsis">…</span>
                        : <button key={item} className={`reports-pg-btn${item === listingsPage ? ' active' : ''}`} onClick={() => setListingsPage(item)}>{item}</button>
                      )}
                    <button className="reports-pg-btn" onClick={() => setListingsPage(p => p + 1)} disabled={listingsPage === totalPages}>&#8250;</button>
                    <span className="reports-pg-info">Page {listingsPage} of {totalPages} · {listings.length} total</span>
                  </div>
                )}
              </>
            );
          })()}
          {!listingsLoading && !listingsError && listings.length === 0 && listingsSummary && (
            <p className="reports-empty">No {listingsTab === 'open' ? 'active' : 'sold'} listings.</p>
          )}
        </div>
      )}

      {/* ── AGENTS ───────────────────────────────────── */}
      {section === 'agents' && (
        <div className="reports-section">
          <div className="reports-section-toolbar">
            <p className="reports-section-count">{agentsLoading ? '' : `${agents.length} agent${agents.length !== 1 ? 's' : ''}`}</p>
            <button className="reports-create-btn" onClick={() => setDrawerOpen(true)}>
              <IconPlus /> New Agent
            </button>
          </div>

          {agentsLoading ? <Spinner /> : agentsError ? (
            <div className="reports-error">{agentsError}</div>
          ) : agents.length === 0 ? (
            <p className="reports-empty">No agents yet. Create one above.</p>
          ) : (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Active Listings</th>
                    <th>Sold</th>
                    <th>Sales Volume</th>
                    <th>Pending Showings</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map(a => (
                    <tr key={a._id}>
                      <td className="reports-td-name">{a.name}</td>
                      <td className="reports-td-muted">{a.email}</td>
                      <td><span className={`reports-badge ${a.isActive ? 'badge--green' : 'badge--red'}`}>{a.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td>{a.activeListings}</td>
                      <td>{a.soldListings}</td>
                      <td>{fmt$(a.salesVolume)}</td>
                      <td>{a.pendingShowings > 0 ? <span className="reports-badge badge--yellow">{a.pendingShowings}</span> : <span className="reports-td-muted">0</span>}</td>
                      <td className="reports-td-muted">{fmtDate(a.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <CreateAgentDrawer
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            onCreated={(newAgent) => setAgents(prev => [
              { ...newAgent, totalListings: 0, activeListings: 0, soldListings: 0, salesVolume: 0, pendingShowings: 0 },
              ...prev
            ])}
          />
        </div>
      )}

      {/* ── SHOWINGS ─────────────────────────────────── */}
      {section === 'showings' && (
        <div className="reports-section">
          {showingsSummary && (
            <div className="reports-strip">
              {[['total','Total'],['pending','Pending'],['confirmed','Confirmed'],['completed','Completed'],['cancelled','Cancelled']].map(([key, label], i, arr) => (
                <span key={key} style={{ display: 'contents' }}>
                  {i > 0 && <div className="reports-strip-divider" />}
                  <div className="reports-strip-item">
                    <span className="reports-strip-val">{showingsSummary[key] ?? 0}</span>
                    <span className="reports-strip-label">{label}</span>
                  </div>
                </span>
              ))}
            </div>
          )}

          <div className="reports-filter-row">
            {['all','pending','confirmed','completed','cancelled'].map(s => (
              <button key={s} className={`reports-filter-btn${showingsFilter === s ? ' active' : ''}`} onClick={() => setShowingsFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {showingsLoading ? <Spinner /> : showingsError ? (
            <div className="reports-error">{showingsError}</div>
          ) : filteredShowings.length === 0 ? (
            <p className="reports-empty">No showings found.</p>
          ) : (
            <div className="reports-table-wrap">
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Requested</th>
                    <th>Buyer</th>
                    <th>Phone</th>
                    <th>Property</th>
                    <th>Agent</th>
                    <th>Preferred Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShowings.map(s => (
                    <tr key={s._id}>
                      <td className="reports-td-muted">{fmtDate(s.createdAt)}</td>
                      <td className="reports-td-name">{s.name}</td>
                      <td className="reports-td-muted">{s.phone || '—'}</td>
                      <td>{s.listing?.address || '—'}</td>
                      <td className="reports-td-muted">{s.listing?.createdBy?.name || '—'}</td>
                      <td className="reports-td-muted">{fmtDate(s.preferredDate)}</td>
                      <td><span className={`reports-badge ${STATUS_CLS[s.status] || ''}`}>{s.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
