import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/SignIn.css';
import '../styles/CreateUser.css';

const CreateUser = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="signin-page-wrapper">
      <motion.div
        className="signin-page create-user-page"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h1>Create Account</h1>
        <p className="signin-subtitle">Sign up to start your property search</p>

        <form className="signin-form create-user-form" onSubmit={handleSubmit}>
          <div className="create-user-name-row">
            <label>
              First Name
              <input
                type="text"
                name="firstName"
                placeholder="Jane"
                value={form.firstName}
                onChange={handleChange}
                autoComplete="given-name"
              />
            </label>
            <label>
              Last Name
              <input
                type="text"
                name="lastName"
                placeholder="Doe"
                value={form.lastName}
                onChange={handleChange}
                autoComplete="family-name"
              />
            </label>
          </div>

          <label>
            Email Address
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </label>

          <button type="submit" className="signin-submit">
            Create Account
          </button>
        </form>

        <p className="signin-footer">
          Already have an account? <Link to="/signin">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default CreateUser;
