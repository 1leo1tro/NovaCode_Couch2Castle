import { Link } from 'react-router-dom';

function HouseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="navbar-house-icon">
      <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/>
    </svg>
  );
}

function Navbar() {
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
          <li>
            <Link to="/signin" className="navbar-signin-btn">Sign in</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Navbar;
