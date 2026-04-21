import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import '../styles/SignIn.css';

const SignIn = () => {
  const [userType, setUserType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(null);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, mockLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (userType === 'agent') {
      try {
        const result = await login('john@example.com', 'password123');
        if (result.success) {
          const agentName = result.agent?.name || 'Agent';
          setSuccess(`Welcome back, ${agentName}. Redirecting...`);
          setTimeout(() => navigate('/listings'), 800);
        } else {
          setError(result.error || 'Login failed.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed.');
      } finally {
        setLoading(false);
      }
    } else if (userType === 'manager') {
      try {
        const result = await login('margaret.holloway@novarealty.com', 'password123');
        if (result.success) {
          const name = result.agent?.name || 'Manager';
          setSuccess(`Welcome, ${name}. Redirecting...`);
          setTimeout(() => navigate('/reports'), 800);
        } else {
          setError(result.error || 'Login failed.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed.');
      } finally {
        setLoading(false);
      }
    } else {
      // Regular user — mock session
      mockLogin({ name: 'Alex Johnson', email: 'alex.johnson@example.com', type: 'user' });
      setSuccess('Welcome, Alex! Redirecting...');
      setTimeout(() => navigate('/listings'), 800);
      setLoading(false);
    }
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!recoveryEmail) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess("If an account exists, you'll receive an email shortly.");
    }, 300);
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setRecoveryMode(null);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setRecoveryEmail('');
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
            onClick={() => handleUserTypeChange('manager')}
          >
            <div className="signin-option-icon">📊</div>
            <h2>Manager</h2>
            <p>Sign in to view reports across all agents and monitor portfolio performance.</p>
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
          {recoveryMode ? (
            <form className="signin-form" onSubmit={handleRecoverySubmit}>
              <h2>
                {recoveryMode === 'password' ? 'Forgot Password' : 'Forgot Username'}
              </h2>
              <p className="signin-recovery-copy">
                Enter the email address associated with your account. We will show a mock confirmation message.
              </p>

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
                  name="recoveryEmail"
                  placeholder="you@example.com"
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </label>

              <button
                type="submit"
                className="signin-submit"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send recovery email'}
              </button>
              <button
                type="button"
                className="signin-back"
                onClick={() => {
                  setRecoveryMode(null);
                  setError('');
                  setSuccess('');
                }}
              >
                ← Back to sign in
              </button>
            </form>
          ) : (
            <>
              <form className="signin-form" onSubmit={handleSubmit}>
                <h2>Sign in as {userType === 'agent' ? 'Agent' : userType === 'manager' ? 'Manager' : 'User'}</h2>

                {success && (
                  <div className="signin-success" style={{ color: '#2e7d32', backgroundColor: '#e8f5e9', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                    {success}
                  </div>
                )}
                {error && (
                  <div className="signin-error" style={{ color: '#d32f2f', backgroundColor: '#ffebee', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
                    {error}
                  </div>
                )}

                <label>
                  Email
                  <input type="email" name="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                </label>
                <label>
                  Password
                  <input type="password" name="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                </label>
                <button type="submit" className="signin-submit" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="signin-recovery-options">
                <button
                  type="button"
                  className="signin-link-button"
                  onClick={() => {
                    setRecoveryMode('password');
                    setError('');
                    setSuccess('');
                    setRecoveryEmail(email);
                  }}
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  className="signin-link-button"
                  onClick={() => {
                    setRecoveryMode('username');
                    setError('');
                    setSuccess('');
                    setRecoveryEmail(email);
                  }}
                >
                  Forgot username?
                </button>
              </div>
            </>
          )}
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
