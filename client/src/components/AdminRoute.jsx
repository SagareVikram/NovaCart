import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

/**
 * Protect administrator-only routes.
 *
 * This component ensures:
 * 1. User is logged in
 * 2. User role is "admin"
 *
 * Example admin pages:
 * - Dashboard
 * - Products
 * - Orders
 * - Users
 * - Reports
 */
const AdminRoute = ({
  children,
}) => {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth();

  const location =
    useLocation();

  /**
   * Wait until authentication restoration
   * finishes before deciding whether to redirect.
   */
  if (loading) {
    return (
      <div className="route-loading">
        <div className="route-loading-spinner" />

        <p>
          Checking administrator access...
        </p>
      </div>
    );
  }

  /**
   * Not logged in:
   * send user to login page.
   */
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  /**
   * Logged in but not administrator:
   * return user to normal storefront.
   */
  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /**
   * Supports both direct children
   * and nested React Router routes.
   */
  if (children) {
    return children;
  }

  return <Outlet />;
};

export default AdminRoute;