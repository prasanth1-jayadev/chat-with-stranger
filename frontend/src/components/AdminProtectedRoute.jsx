import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // If they aren't logged in at all, send them to the admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // If they are logged in but NOT an admin, send them to the normal app
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // If they pass both checks, render the admin dashboard!
  return children;
}
