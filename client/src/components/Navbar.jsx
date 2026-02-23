import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import axios from 'axios';

function HouseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="navbar-house-icon">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/>
    </svg>
  );
}

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!isAuthenticated()) {
        setPendingCount(0);
        return;
      }

      try {
        const response = await axios.get('/api/showings/count/pending');
        setPendingCount(response.data.count || 0);
      } catch (err) {
        console.error('Error fetching pending showings count:', err);
        setPendingCount(0);
      }
    };

    fetchPendingCount();

    // Refresh count every 30 seconds if authenticated
    const interval = isAuthenticated()
      ? setInterval(fetchPendingCount, 30000)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated]);

  const handleSignOut = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <nav className="navbar-inner">
        <ul className="navbar-links navbar-left">
          <li><Link to="/">Buy</Link></li>
          <li><Link to="/">Rent</Link></li>
          <li><Link to="/listings">Listings</Link></li>
        </ul>

        <Link to="/" className="navbar-brand">
          <HouseIcon />
          <span>Couch2Castle</span>
        </Link>

        <ul className="navbar-links navbar-right">
          <li><Link to="/contacts">Find an agent</Link></li>
          <li><Link to="/contacts">Get help</Link></li>
          {isAuthenticated() && (
            <li>
              <Link to="/showings" className="navbar-notifications">
                <span className="navbar-notifications-icon">🔔</span>
                {pendingCount > 0 && (
                  <span className="navbar-notifications-badge">{pendingCount}</span>
                )}
              </Link>
            </li>
          )}
          {isAuthenticated() ? (
            <>
              <li>
                <span style={{ color: '#666', fontSize: '14px' }}>
                  {user?.name || user?.email}
                </span>
              </li>
              <li>
                <button
                  onClick={handleSignOut}
                  className="navbar-signin-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    font: 'inherit'
                  }}
                >
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/signin" className="navbar-signin-btn">Sign in</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
