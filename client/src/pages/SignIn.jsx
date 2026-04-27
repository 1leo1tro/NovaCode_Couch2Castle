import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [dir, setDir] = useState(1); // 1 = forward (→ right enters), -1 = back (← left enters)

  const { login, mockLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        const dest = result.agent?.role === 'manager' ? '/reports' : '/listings';
        setSuccess(`Welcome back, ${result.agent?.name || 'Agent'}.`);
        setTimeout(() => navigate(dest), 800);
      } else {
        setError(result.error || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverySubmit = (e) => {
    e.preventDefault();
    if (!recoveryEmail) { setError('Please enter your email address.'); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess("If an account exists, you'll receive an email shortly.");
    }, 400);
  };

  const reset = (type = null) => {
    setDir(-1);
    setUserType(type); setRecoveryMode(null);
    setError(''); setSuccess('');
    setEmail(''); setPassword(''); setRecoveryEmail('');
  };

  const goForward = (type) => {
    setDir(1);
    setUserType(type);
  };

  const roleLabel = userType === 'agent' ? 'Agent' : userType === 'manager' ? 'Manager' : 'User';

  return (
    <div className="signin-shell">
      {/* Left brand panel */}
      <div className="signin-brand">
        <div className="signin-brand-inner">
          <div className="signin-brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="36" height="36">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>Couch2Castle</span>
          </div>
          <h2 className="signin-brand-headline">Find your next home with confidence.</h2>
          <p className="signin-brand-sub">Search listings, connect with agents, and track your favorites — all in one place.</p>
          <ul className="signin-brand-features">
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
              Save and bookmark listings
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
              Schedule property tours
            </li>
            <li>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>
              Access agent tools &amp; reports
            </li>
          </ul>
        </div>
      </div>

      {/* Right form panel */}
      <div className="signin-panel">
        <AnimatePresence mode="wait" custom={dir}>
          {!userType ? (
            <motion.div
              key="pick"
              className="signin-card"
              custom={dir}
              variants={{
                initial: (d) => ({ opacity: 0, x: d * 60 }),
                animate: { opacity: 1, x: 0 },
                exit: (d) => ({ opacity: 0, x: d * -60 }),
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <h1 className="signin-title">Welcome</h1>
              <p className="signin-desc">How would you like to sign in?</p>
              <div className="signin-roles">
                <button className="signin-role-btn" onClick={() => { mockLogin({ name: 'Alex Johnson', email: 'alex.johnson@example.com', type: 'user' }); navigate('/listings'); }}>
                  <span className="signin-role-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <span className="signin-role-text">
                    <strong>Home Buyer</strong>
                    <span>Browse listings and save favourites</span>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="signin-role-arrow"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button className="signin-role-btn" onClick={() => goForward('agent')}>
                  <span className="signin-role-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
                    </svg>
                  </span>
                  <span className="signin-role-text">
                    <strong>Agent</strong>
                    <span>Manage listings and schedule tours</span>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="signin-role-arrow"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <button className="signin-role-btn" onClick={() => goForward('manager')}>
                  <span className="signin-role-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </span>
                  <span className="signin-role-text">
                    <strong>Manager</strong>
                    <span>View reports and portfolio analytics</span>
                  </span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" className="signin-role-arrow"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
              <p className="signin-contact-line">Don't have an account? <Link to="/contacts">Contact us</Link></p>
            </motion.div>
          ) : recoveryMode ? (
            <motion.div
              key="recovery"
              className="signin-card"
              custom={dir}
              variants={{
                initial: (d) => ({ opacity: 0, x: d * 60 }),
                animate: { opacity: 1, x: 0 },
                exit: (d) => ({ opacity: 0, x: d * -60 }),
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <button className="signin-back-btn" onClick={() => { setDir(-1); setRecoveryMode(null); setError(''); setSuccess(''); }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back
              </button>
              <h1 className="signin-title">Reset password</h1>
              <p className="signin-desc">Enter your email and we'll send you a reset link.</p>
              {success && <div className="signin-alert signin-alert--success">{success}</div>}
              {error   && <div className="signin-alert signin-alert--error">{error}</div>}
              <form className="signin-form" onSubmit={handleRecoverySubmit}>
                <div className="signin-field">
                  <label>Email address</label>
                  <input type="email" placeholder="you@example.com" value={recoveryEmail} onChange={e => setRecoveryEmail(e.target.value)} disabled={loading} required />
                </div>
                <button type="submit" className="signin-submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="signin-card"
              custom={dir}
              variants={{
                initial: (d) => ({ opacity: 0, x: d * 60 }),
                animate: { opacity: 1, x: 0 },
                exit: (d) => ({ opacity: 0, x: d * -60 }),
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <button className="signin-back-btn" onClick={() => reset()}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                Back
              </button>
              <h1 className="signin-title">Sign in as {roleLabel}</h1>
              <p className="signin-desc">Enter your credentials to continue.</p>
              {success && <div className="signin-alert signin-alert--success">{success}</div>}
              {error   && <div className="signin-alert signin-alert--error">{error}</div>}
              <form className="signin-form" onSubmit={handleSubmit}>
                <div className="signin-field">
                  <label>Email address</label>
                  <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
                </div>
                <div className="signin-field">
                  <label>Password</label>
                  <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                </div>
                <button type="submit" className="signin-submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
              </form>
              <button className="signin-forgot" onClick={() => { setDir(1); setRecoveryMode('password'); setError(''); setSuccess(''); setRecoveryEmail(email); }}>
                Forgot password?
              </button>
              {userType === 'agent' && (
                <p className="signin-agent-note">New agent? <Link to="/contacts">Request access</Link></p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SignIn;
