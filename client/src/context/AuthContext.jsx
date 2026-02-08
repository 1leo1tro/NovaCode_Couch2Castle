import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));

      // Set axios default header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }

    setLoading(false);
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login to:', '/api/auth/login');
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });

      const { token: newToken, agent } = response.data;

      // Store in state
      setToken(newToken);
      setUser(agent);

      // Store in localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(agent));

      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      return { success: true, agent };
    } catch (error) {
      console.error('Login error:', error);

      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Login failed. Please try again.';

      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    // Clear state
    setToken(null);
    setUser(null);

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear axios default header
    delete axios.defaults.headers.common['Authorization'];
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  // Get current user
  const getUser = () => {
    return user;
  };

  // Get token
  const getToken = () => {
    return token;
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    getUser,
    getToken,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
