import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const { user, isAuthenticated, logout, mockUser, mockLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

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

  const handleMockSignOut = () => {
    mockLogout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <nav className="navbar-inner">
        <ul className="navbar-links navbar-left">
          <li><Link to="/" className={isActive('/') ? 'nav-active' : ''}>Home</Link></li>
          <li><Link to="/listings" className={location.pathname === '/listings' ? 'nav-active' : ''}>Listings</Link></li>
          {isAuthenticated() && (
            <li><Link to="/listings/mine" className={location.pathname !== '/listings' && isActive('/listings') ? 'nav-active' : ''}>My Listings</Link></li>
          )}
        </ul>

        <Link to="/" className="navbar-brand">
          <HouseIcon />
          <span>Couch2Castle</span>
        </Link>

        <ul className="navbar-links navbar-right">
          {isAuthenticated() ? (
            <>
              <li>
                <Link to="/showings" className={`navbar-showings-link ${isActive('/showings') ? 'nav-active' : ''}`}>
                  Showings
                  {pendingCount > 0 && (
                    <span className="navbar-showings-badge">{pendingCount}</span>
                  )}
                </Link>
              </li>
              <li><Link to="/reports" className={isActive('/reports') ? 'nav-active' : ''}>Reports</Link></li>
              <li className="navbar-agent-profile">
                <span className="navbar-agent-badge">Agent</span>
                <span className="navbar-agent-name">{user?.name || user?.email}</span>
              </li>
              <li>
                <button onClick={handleSignOut} className="navbar-signout-btn">
                  Sign out
                </button>
              </li>
            </>
          ) : mockUser ? (
            <>
              <li><Link to="/contacts" className={isActive('/contacts') ? 'nav-active' : ''}>Find an agent</Link></li>
              <li><Link to="/help" className={isActive('/help') ? 'nav-active' : ''}>Get help</Link></li>
              <li className="navbar-agent-profile">
                <span className="navbar-agent-badge">User</span>
                <span className="navbar-agent-name">{mockUser.name}</span>
              </li>
              <li>
                <button onClick={handleMockSignOut} className="navbar-signout-btn">
                  Sign out
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/contacts" className={isActive('/contacts') ? 'nav-active' : ''}>Find an agent</Link></li>
              <li><Link to="/help" className={isActive('/help') ? 'nav-active' : ''}>Get help</Link></li>
              <li>
                <Link to="/signin" className={`navbar-signin-btn ${isActive('/signin') ? 'navbar-signin-active' : ''}`}>Sign in</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
