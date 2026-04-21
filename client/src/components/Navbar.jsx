import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useBookmarks } from '../context/BookmarkContext';
import { useShowingNotifications } from '../context/ShowingNotificationsContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

function HouseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="navbar-house-icon">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="navbar-theme-icon">
      <circle cx="12" cy="12" r="8" />
      <circle cx="16" cy="9" r="7" fill="var(--color-background)" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="navbar-theme-icon">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="navbar-burger-icon">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function Navbar() {
  const { user, isAuthenticated, logout, mockUser, mockLogout } = useAuth();
  const isManager = isAuthenticated() && user?.role === 'manager';
  const { isDark, toggleTheme } = useTheme();
  const { bookmarks } = useBookmarks();
  const { unseenCount } = useShowingNotifications();
  const signedIn = isAuthenticated() || !!mockUser;
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (!e.target.closest('.navbar-burger-item')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

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
          {isAuthenticated() && !isManager && (
            <li><Link to="/listings/mine" className={location.pathname !== '/listings' && isActive('/listings') ? 'nav-active' : ''}>My Listings</Link></li>
          )}
          {!isAuthenticated() && (
            <li className="navbar-bookmark-item">
              {mockUser ? (
                <Link to="/my-showings" className={isActive('/my-showings') ? 'nav-active' : ''}>
                  My Showings
                  <AnimatePresence>
                    {unseenCount > 0 && (
                      <motion.span
                        key={unseenCount}
                        className="navbar-bookmark-badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                      >
                        {unseenCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              ) : (
                <span className="navbar-bookmark-link navbar-bookmark-link--disabled">
                  My Showings
                  <span className="navbar-bookmark-tooltip">Sign in to view your showings</span>
                </span>
              )}
            </li>
          )}
          <li className="navbar-bookmark-item">
            {signedIn ? (
              <Link to="/bookmarks" className={`navbar-bookmark-link${isActive('/bookmarks') ? ' nav-active' : ''}`}>
                Bookmarks
                <AnimatePresence>
                  {bookmarks.length > 0 && (
                    <motion.span
                      key={bookmarks.length}
                      className="navbar-bookmark-badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    >
                      {bookmarks.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            ) : (
              <span className="navbar-bookmark-link navbar-bookmark-link--disabled">
                Bookmarks
                <span className="navbar-bookmark-tooltip">Sign in to save listings</span>
              </span>
            )}
          </li>
        </ul>

        <Link to="/" className="navbar-brand">
          <HouseIcon />
          <span>Couch2Castle</span>
        </Link>

        <ul className="navbar-links navbar-right">
          {isAuthenticated() ? (
            <>
              <li className="navbar-burger-item">
                <button
                  className={`navbar-burger-btn${menuOpen ? ' navbar-burger-btn--open' : ''}`}
                  onClick={() => setMenuOpen(o => !o)}
                  aria-label="Toggle menu"
                >
                  <BurgerIcon />
                  {pendingCount > 0 && !menuOpen && (
                    <span className="navbar-burger-dot" />
                  )}
                </button>
                <AnimatePresence>
                  {menuOpen && (
                    <motion.ul
                      className="navbar-burger-menu"
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      {isManager ? (
                        <li>
                          <Link to="/reports" className={isActive('/reports') ? 'nav-active' : ''} onClick={() => setMenuOpen(false)}>
                            Reports
                          </Link>
                        </li>
                      ) : (
                        <>
                          <li>
                            <Link to="/showings" className={`navbar-showings-link${isActive('/showings') ? ' nav-active' : ''}`} onClick={() => setMenuOpen(false)}>
                              Showings
                              {pendingCount > 0 && (
                                <span className="navbar-showings-badge">{pendingCount}</span>
                              )}
                            </Link>
                          </li>
                          <li>
                            <Link to="/scheduling" className={isActive('/scheduling') ? 'nav-active' : ''} onClick={() => setMenuOpen(false)}>
                              Scheduling
                            </Link>
                          </li>
                        </>
                      )}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
              <li className="navbar-agent-profile">
                <span className="navbar-agent-badge">{isManager ? 'Manager' : 'Agent'}</span>
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
          <li className="navbar-theme-toggle-item">
            <button 
              onClick={toggleTheme} 
              className="navbar-theme-toggle"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
