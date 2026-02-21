import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component - wraps routes that require authentication
 * Redirects to login page if user is not authenticated
 * @param {boolean} requireAgent - If true, ensures the user is an authenticated agent
 */
const ProtectedRoute = ({ children, requireAgent = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="loading-container" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/signin" replace />;
  }

  // Check if route requires agent role
  if (requireAgent && !user) {
    return <Navigate to="/signin" replace />;
  }

  // Render protected content if authenticated
  return children;
};

export default ProtectedRoute;
