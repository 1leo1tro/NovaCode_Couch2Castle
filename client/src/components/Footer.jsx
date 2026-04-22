import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer-inner">

      {/* Brand */}
      <div className="footer-brand">
        <span className="footer-logo">Couch2Castle</span>
        <p className="footer-tagline">Find your dream home — from the couch to the castle.</p>
        <div className="footer-socials">
          <a href="#" aria-label="Facebook" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
            </svg>
          </a>
          <a href="#" aria-label="Instagram" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <rect x="2" y="2" width="20" height="20" rx="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
            </svg>
          </a>
          <a href="#" aria-label="Twitter / X" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#" aria-label="LinkedIn" className="footer-social-link">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
              <circle cx="4" cy="4" r="2"/>
            </svg>
          </a>
        </div>
      </div>

      {/* Explore */}
      <div className="footer-col">
        <h4 className="footer-col-title">Explore</h4>
        <ul className="footer-links">
          <li><Link to="/listings">Browse Listings</Link></li>
          <li><Link to="/listings">Open Houses</Link></li>
          <li><Link to="/bookmarks">Saved Homes</Link></li>
          <li><Link to="/my-showings">My Showings</Link></li>
        </ul>
      </div>

      {/* For Agents */}
      <div className="footer-col">
        <h4 className="footer-col-title">For Agents</h4>
        <ul className="footer-links">
          <li><Link to="/listings/create">Create a Listing</Link></li>
          <li><Link to="/listings/mine">My Listings</Link></li>
          <li><Link to="/showings">Manage Showings</Link></li>
          <li><Link to="/reports">Market Reports</Link></li>
          <li><Link to="/scheduling">Scheduling</Link></li>
        </ul>
      </div>

      {/* Company */}
      <div className="footer-col">
        <h4 className="footer-col-title">Company</h4>
        <ul className="footer-links">
          <li><Link to="/help">Help Center</Link></li>
          <li><Link to="/contacts">Contact Us</Link></li>
          <li><a href="#">Privacy Policy</a></li>
          <li><a href="#">Terms of Service</a></li>
          <li><a href="#">Accessibility</a></li>
        </ul>
      </div>

    </div>

    <div className="site-footer-bottom">
      <p>© {new Date().getFullYear()} Couch2Castle. All rights reserved.</p>
      <p className="footer-disclaimer">
        All listings are for demonstration purposes. Equal Housing Opportunity.
      </p>
    </div>
  </footer>
);

export default Footer;
