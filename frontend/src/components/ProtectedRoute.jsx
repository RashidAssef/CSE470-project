import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/api.js';

/**
 * Route protection wrapper.
 * Checks for token presence, roles compatibility, and syncs account status.
 * Redirects unauthorized requests to appropriate pages.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Component to render if authorized
 * @param {string[]} props.allowedRoles - Roles permitted to view this route (e.g. ['admin'])
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      const cachedUser = authService.getCurrentUser();

      if (!token || !cachedUser) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      // If allowedRoles is specified, perform initial check
      if (allowedRoles && !allowedRoles.includes(cachedUser.role)) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        // Sync state with the backend to ensure status is up to date (e.g., check if suspended/approved)
        const updatedUser = await authService.verifySession();
        
        if (updatedUser.status === 'suspended') {
          authService.logout();
          setAuthenticated(false);
        } else if (allowedRoles && !allowedRoles.includes(updatedUser.role)) {
          setAuthenticated(false);
        } else {
          setCurrentUser(updatedUser);
          setAuthenticated(true);
        }
      } catch (err) {
        console.error('[Protected Route] Session validation failed:', err.message);
        authService.logout();
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyUser();
  }, [allowedRoles]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-ink-soft">Loading panel credentials...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    // If not logged in at all, go to login page
    const token = localStorage.getItem('token');
    if (!token) {
      return <Navigate to="/login" replace />;
    }
    // If logged in but unauthorized role, go to home
    return <Navigate to="/" replace />;
  }

  return children;
}
