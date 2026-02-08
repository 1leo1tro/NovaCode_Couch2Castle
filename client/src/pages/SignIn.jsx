import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/SignIn.css';

const SignIn = () => {
  const [userType, setUserType] = useState(null);

  return (
    <div className="signin-page-wrapper">
      <motion.div
        className="signin-page"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
      <h1>Sign In</h1>
      <p className="signin-subtitle">Choose how you&apos;d like to sign in</p>

      {!userType ? (
        <div className="signin-options">
          <button
            type="button"
            className="signin-option-card"
            onClick={() => setUserType('agent')}
          >
            <div className="signin-option-icon">👤</div>
            <h2>Agent</h2>
            <p>Sign in to manage your listings, schedule tours, and connect with clients.</p>
          </button>
          <button
            type="button"
            className="signin-option-card"
            onClick={() => setUserType('user')}
          >
            <div className="signin-option-icon">🏠</div>
            <h2>Regular User</h2>
            <p>Sign in to save favorites, schedule property tours, and track your search.</p>
          </button>
        </div>
      ) : (
        <div className="signin-form-container">
          <button
            type="button"
            className="signin-back"
            onClick={() => setUserType(null)}
          >
            ← Back
          </button>
          <form className="signin-form" onSubmit={(e) => e.preventDefault()}>
            <h2>Sign in as {userType === 'agent' ? 'Agent' : 'User'}</h2>
            <label>
              Email
              <input type="email" name="email" placeholder="you@example.com" required />
            </label>
            <label>
              Password
              <input type="password" name="password" placeholder="••••••••" required />
            </label>
            <button type="submit" className="signin-submit">Sign In</button>
          </form>
        </div>
      )}

      <p className="signin-footer">
        Don&apos;t have an account? <Link to="/contacts">Contact us</Link> to get started.
      </p>
      </motion.div>
    </div>
  );
};

export default SignIn;
