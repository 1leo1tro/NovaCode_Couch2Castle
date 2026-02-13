import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import '../styles/SignIn.css';

const SignIn = () => {
  const [userType, setUserType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Only agent login is currently implemented
    if (userType !== 'agent') {
      setError('Regular user login is not yet implemented. Please sign in as an agent.');
      return;
    }

    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        const agentName = result.agent?.name || 'Agent';
        setSuccess(`Welcome back, ${agentName}. Redirecting to listings...`);
        setTimeout(() => {
          navigate('/listings');
        }, 800);
      } else {
        setError(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // Extract error message from response
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
  };

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
            onClick={() => handleUserTypeChange('agent')}
          >
            <div className="signin-option-icon">👤</div>
            <h2>Agent</h2>
            <p>Sign in to manage your listings, schedule tours, and connect with clients.</p>
          </button>
          <button
            type="button"
            className="signin-option-card"
            onClick={() => handleUserTypeChange('user')}
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
            onClick={() => handleUserTypeChange(null)}
          >
            ← Back
          </button>
          <form className="signin-form" onSubmit={handleSubmit}>
            <h2>Sign in as {userType === 'agent' ? 'Agent' : 'User'}</h2>

            {success && (
              <div
                className="signin-success"
                style={{
                  color: '#2e7d32',
                  backgroundColor: '#e8f5e9',
                  padding: '12px',
                  borderRadius: '4px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              >
                {success}
              </div>
            )}
            {error && (
              <div className="signin-error" style={{
                color: '#d32f2f',
                backgroundColor: '#ffebee',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <label>
              Email
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </label>
            <button
              type="submit"
              className="signin-submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          {userType === 'agent' && (
            <div className="signin-helper">
              <div className="signin-helper-card">
                <h3>Need access?</h3>
                <p>New agents should reach out to verify licensing and unlock the portal.</p>
                <Link to="/contacts">Contact the team</Link>
              </div>           
            </div>
          )}
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
