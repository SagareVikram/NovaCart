import {
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

/**
 * Protect routes that require a logged-in user.
 *
 * Example protected pages:
 * - Cart
 * - Wishlist
 * - Checkout
 * - Profile
 * - My Orders
 * - Order Details
 *
 * Usage:
 *
 * <Route element={<ProtectedRoute />}>
 *   <Route path="/cart" element={<Cart />} />
 * </Route>
 */
const ProtectedRoute = ({
  children,
}) => {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location =
    useLocation();

  /**
   * Prevent redirect while authentication
   * state is still being restored.
   */
  if (loading) {
    return (
      <div className="route-loading">
        <div className="route-loading-spinner" />

        <p>
          Checking your session...
        </p>
      </div>
    );
  }

  /**
   * Redirect unauthenticated users
   * to login page.
   *
   * Store original location so Login.jsx
   * can redirect back after successful login.
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
   * Supports both:
   *
   * <ProtectedRoute>
   *   <Component />
   * </ProtectedRoute>
   *
   * and nested React Router routes.
   */
  if (children) {
    return children;
  }

  return <Outlet />;
};

export default ProtectedRoute;