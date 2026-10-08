import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import Cart from "./pages/Cart.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";
import NotFound from "./pages/NotFound.jsx";

import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminProducts from "./admin/AdminProducts.jsx";
import AdminProductForm from "./admin/AdminProductForm.jsx";
import AdminOrders from "./admin/AdminOrders.jsx";
import AdminUsers from "./admin/AdminUsers.jsx";
import AdminReports from "./admin/AdminReports.jsx";

import {
  useAuth,
} from "./context/AuthContext.jsx";

/**
 * Public storefront layout.
 *
 * Shared Navbar and Footer remain visible
 * for public and protected customer pages.
 */
const StoreLayout = () => {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="app-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

/**
 * Authentication layout.
 *
 * Login and Register have their own
 * dedicated page design and therefore
 * do not use the main storefront
 * Navbar/Footer.
 */
const AuthLayout = () => {
  return (
    <div className="auth-layout-shell">
      <Outlet />
    </div>
  );
};

/**
 * Admin application shell.
 *
 * AdminRoute handles authorization.
 * This layout only handles:
 *
 * - Admin sidebar
 * - Admin topbar
 * - Admin page outlet
 * - Storefront navigation
 * - Logout
 */
const AdminLayout = () => {
  const location = useLocation();

  const {
    user,
    logout,
  } = useAuth();

  const adminLinks = [
    {
      path: "/admin",
      label: "Dashboard",
    },
    {
      path: "/admin/products",
      label: "Products",
    },
    {
      path: "/admin/orders",
      label: "Orders",
    },
    {
      path: "/admin/users",
      label: "Customers",
    },
    {
      path: "/admin/reports",
      label: "Reports",
    },
  ];

  /**
   * Dashboard should only be active for the
   * exact /admin route.
   *
   * Other admin sections remain active for
   * nested routes such as:
   *
   * /admin/products/new
   * /admin/products/:id/edit
   */
  const isActive = (path) => {
    if (path === "/admin") {
      return (
        location.pathname ===
        "/admin"
      );
    }

    return location.pathname.startsWith(
      path
    );
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      /**
       * AuthContext already owns logout/session
       * cleanup behavior.
       *
       * Avoid introducing a second session
       * implementation here.
       */
      console.error(
        "Admin logout failed:",
        error
      );
    }
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <Link
            to="/admin"
            className="admin-sidebar-brand-link"
            aria-label="NovaCart Admin Dashboard"
          >
            <span className="admin-sidebar-brand-mark">
              N
            </span>

            <div>
              <strong>
                NovaCart
              </strong>

              <span>
                Admin
              </span>
            </div>
          </Link>
        </div>

        <nav
          className="admin-sidebar-nav"
          aria-label="Admin navigation"
        >
          {adminLinks.map(
            (link) => (
              <Link
                key={link.path}
                to={link.path}
                className={
                  isActive(link.path)
                    ? "active"
                    : ""
                }
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-sidebar-avatar">
              {String(
                user?.name ||
                  "A"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>
                {user?.name ||
                  "Administrator"}
              </strong>

              <span>
                {user?.email || ""}
              </span>
            </div>
          </div>

          <Link
            to="/"
            className="admin-sidebar-store-link"
          >
            View Store
          </Link>

          <button
            type="button"
            className="admin-sidebar-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div>
            <span>
              NovaCart
            </span>

            <strong>
              Administration
            </strong>
          </div>

          <div className="admin-topbar-actions">
            <Link to="/">
              Storefront
            </Link>

            <span className="admin-topbar-role">
              Admin
            </span>
          </div>
        </header>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

/**
 * Prevent already authenticated users
 * from opening Login/Register.
 *
 * Admins return to the admin dashboard.
 * Customers return to the storefront.
 */
const GuestOnlyRoute = ({
  children,
}) => {
  const {
    isAuthenticated,
    isAdmin,
    loading,
  } = useAuth();

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

  if (isAuthenticated) {
    return (
      <Navigate
        to={
          isAdmin
            ? "/admin"
            : "/"
        }
        replace
      />
    );
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      {/* =====================================================
          PUBLIC + CUSTOMER STOREFRONT
      ====================================================== */}

      <Route element={<StoreLayout />}>
        <Route
          index
          element={<Home />}
        />

        <Route
          path="products"
          element={<Products />}
        />

        <Route
          path="products/:identifier"
          element={<ProductDetails />}
        />

        <Route
          path="about"
          element={<About />}
        />

        <Route
          path="contact"
          element={<Contact />}
        />

        {/* ================================================
            CUSTOMER AUTHENTICATED ROUTES
        ================================================= */}

        <Route element={<ProtectedRoute />}>
          <Route
            path="cart"
            element={<Cart />}
          />

          <Route
            path="wishlist"
            element={<Wishlist />}
          />

          <Route
            path="checkout"
            element={<Checkout />}
          />

          <Route
            path="profile"
            element={<Profile />}
          />

          <Route
            path="my-orders"
            element={<MyOrders />}
          />

          <Route
            path="orders/:identifier"
            element={<OrderDetails />}
          />
        </Route>
      </Route>

      {/* =====================================================
          AUTHENTICATION
      ====================================================== */}

      <Route element={<AuthLayout />}>
        <Route
          path="login"
          element={
            <GuestOnlyRoute>
              <Login />
            </GuestOnlyRoute>
          }
        />

        <Route
          path="register"
          element={
            <GuestOnlyRoute>
              <Register />
            </GuestOnlyRoute>
          }
        />
      </Route>

      {/* =====================================================
          ADMINISTRATION
      ====================================================== */}

      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route
            path="admin"
            element={
              <AdminDashboard />
            }
          />

          <Route
            path="admin/products"
            element={
              <AdminProducts />
            }
          />

          <Route
            path="admin/products/new"
            element={
              <AdminProductForm />
            }
          />

          <Route
            path="admin/products/:productId/edit"
            element={
              <AdminProductForm />
            }
          />

          <Route
            path="admin/orders"
            element={
              <AdminOrders />
            }
          />

          <Route
            path="admin/users"
            element={
              <AdminUsers />
            }
          />

          <Route
            path="admin/reports"
            element={
              <AdminReports />
            }
          />
        </Route>
      </Route>

      {/* =====================================================
          404
      ====================================================== */}

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
};

export default App;