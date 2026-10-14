import {
  Link,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "./context/AuthContext.jsx";

import Loader from "./components/Loader.jsx";
import DeliveryRoute from "./components/DeliveryRoute.jsx";


/**
 * ============================================================
 * STOREFRONT
 * ============================================================
 */

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";

import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetails from "./pages/ProductDetails.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

import Cart from "./pages/Cart.jsx";
import Wishlist from "./pages/Wishlist.jsx";
import Checkout from "./pages/Checkout.jsx";
import Profile from "./pages/Profile.jsx";
import MyOrders from "./pages/MyOrders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import NotFound from "./pages/NotFound.jsx";


/**
 * ============================================================
 * ADMIN
 * ============================================================
 */

import AdminDashboard from "./admin/AdminDashboard.jsx";
import AdminProducts from "./admin/AdminProducts.jsx";
import AdminProductForm from "./admin/AdminProductForm.jsx";
import AdminOrders from "./admin/AdminOrders.jsx";
import AdminUsers from "./admin/AdminUsers.jsx";
import AdminReports from "./admin/AdminReports.jsx";
import AdminDeliveryAgents from "./admin/AdminDeliveryAgents.jsx";


/**
 * ============================================================
 * DELIVERY AGENT
 * ============================================================
 */

import DeliveryLayout from "./delivery/DeliveryLayout.jsx";
import DeliveryDashboard from "./delivery/DeliveryDashboard.jsx";
import AssignedOrders from "./delivery/AssignedOrders.jsx";
import ActiveDeliveries from "./delivery/ActiveDeliveries.jsx";
import DeliveryHistory from "./delivery/DeliveryHistory.jsx";
import DeliveryPerformance from "./delivery/DeliveryPerformance.jsx";
import DeliveryProfile from "./delivery/DeliveryProfile.jsx";



import {
  FaBoxOpen,
  FaChartBar,
  FaHome,
  FaShoppingCart,
  FaTruck,
  FaUsers,
} from "react-icons/fa";

/**
 * ============================================================
 * STORE LAYOUT
 * ============================================================
 */

const StoreLayout = () => {
  return (
    <div className="app-shell">

      <Navbar />

      <main className="app-main">
        <Outlet />
      </main>

      <Footer />

    </div>
  );
};


/**
 * ============================================================
 * GUEST ONLY ROUTE
 * ============================================================
 */

const GuestOnlyRoute = () => {
  const {
    user,
    loading,
  } =
    useAuth();


  if (loading) {
    return (
      <Loader
        fullPage
        text="Loading..."
      />
    );
  }


  if (user) {
    if (
      user.role ===
      "admin"
    ) {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }


    if (
      user.role ===
      "delivery_agent"
    ) {
      return (
        <Navigate
          to="/delivery"
          replace
        />
      );
    }


    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  return <Outlet />;
};


/**
 * ============================================================
 * CUSTOMER ONLY ROUTE
 * ============================================================
 */

const CustomerRoute = () => {
  const {
    user,
    loading,
  } =
    useAuth();


  if (loading) {
    return (
      <Loader
        fullPage
        text="Loading..."
      />
    );
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    user.role ===
    "admin"
  ) {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }


  if (
    user.role ===
    "delivery_agent"
  ) {
    return (
      <Navigate
        to="/delivery"
        replace
      />
    );
  }


  return <Outlet />;
};


/**
 * ============================================================
 * ADMIN ROUTE
 * ============================================================
 */

const AdminRoute = () => {
  const {
    user,
    loading,
  } =
    useAuth();


  if (loading) {
    return (
      <Loader
        fullPage
        text="Loading..."
      />
    );
  }


  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }


  if (
    user.role !==
    "admin"
  ) {
    if (
      user.role ===
      "delivery_agent"
    ) {
      return (
        <Navigate
          to="/delivery"
          replace
        />
      );
    }


    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  return <Outlet />;
};


/**
 * ============================================================
 * ADMIN LAYOUT
 * ============================================================
 */

const AdminLayout = () => {
  const location =
    useLocation();

  const {
    logout,
  } =
    useAuth();

  const navigate =
    useNavigate();


  const adminLinks = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: FaHome,
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: FaBoxOpen,
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: FaShoppingCart,
  },
  {
    label: "Customers",
    path: "/admin/users",
    icon: FaUsers,
  },
  {
    label: "Delivery Agents",
    path: "/admin/delivery-agents",
    icon: FaTruck,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: FaChartBar,
  },
];


  const isActive =
    (path) => {
      if (
        path ===
        "/admin"
      ) {
        return (
          location.pathname ===
          "/admin"
        );
      }

      return location.pathname.startsWith(
        path
      );
    };


  const handleLogout =
    async () => {
      try {
        await logout();
      } finally {
        navigate(
          "/login",
          {
            replace:
              true,
          }
        );
      }
    };


  return (
    <div className="admin-app-shell">

      <aside className="admin-modern-sidebar">

        {/* BRAND */}

        <div className="admin-modern-brand">

          <div className="admin-modern-logo">
            N
          </div>


          <div>

            <strong>
              NovaCart
            </strong>

            <span>
              Admin
            </span>

          </div>

        </div>


        {/* PROFILE */}

        <div className="admin-modern-profile">

          <div className="admin-modern-avatar">
            A
          </div>


          <div>

            <strong>
              Administrator
            </strong>

            <span>
              Admin Panel
            </span>

          </div>

        </div>


        {/* NAVIGATION */}

        <nav className="admin-modern-nav">

          {adminLinks.map(
            (
              item
            ) => (
              <Link
                key={
                  item.path
                }
                to={
                  item.path
                }
                className={`admin-modern-link ${
                  isActive(
                    item.path
                  )
                    ? "active"
                    : ""
                }`}
              >

                <item.icon className="admin-modern-icon" />

                <span>
                  {
                    item.label
                  }
                </span>

              </Link>
            )
          )}

        </nav>


        {/* FOOTER */}

        <div className="admin-modern-footer">

          <Link
            to="/"
            className="admin-modern-store"
          >
            View Store
          </Link>


          <button
            type="button"
            className="admin-modern-logout"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </aside>


      <main className="admin-modern-content">

        <Outlet />

      </main>

    </div>
  );
};


/**
 * ============================================================
 * APP
 * ============================================================
 */

const App = () => {
  return (
    <Routes>

      {/* ======================================================
          PUBLIC STORE ROUTES
      ====================================================== */}

      <Route
        element={
          <StoreLayout />
        }
      >

        <Route
          index
          element={
            <Home />
          }
        />


        <Route
          path="products"
          element={
            <Products />
          }
        />


        <Route
          path="products/:slug"
          element={
            <ProductDetails />
          }
        />


        <Route
          path="about"
          element={
            <About />
          }
        />


        <Route
          path="contact"
          element={
            <Contact />
          }
        />


        {/* ====================================================
            CUSTOMER ROUTES
        ==================================================== */}

        <Route
          element={
            <CustomerRoute />
          }
        >

          <Route
            path="cart"
            element={
              <Cart />
            }
          />


          <Route
            path="wishlist"
            element={
              <Wishlist />
            }
          />


          <Route
            path="checkout"
            element={
              <Checkout />
            }
          />


          <Route
            path="profile"
            element={
              <Profile />
            }
          />


          <Route
            path="my-orders"
            element={
              <MyOrders />
            }
          />


          <Route
            path="orders/:identifier"
            element={
              <OrderDetails />
            }
          />

        </Route>

      </Route>


      {/* ======================================================
          AUTH ROUTES
      ====================================================== */}

      <Route
        element={
          <GuestOnlyRoute />
        }
      >

        <Route
          path="/login"
          element={
            <Login />
          }
        />


        <Route
          path="/register"
          element={
            <Register />
          }
        />

      </Route>


      {/* ======================================================
          ADMIN ROUTES
      ====================================================== */}

      <Route
        element={
          <AdminRoute />
        }
      >

        <Route
          path="/admin"
          element={
            <AdminLayout />
          }
        >

          <Route
            index
            element={
              <AdminDashboard />
            }
          />


          <Route
            path="products"
            element={
              <AdminProducts />
            }
          />


          <Route
            path="products/new"
            element={
              <AdminProductForm />
            }
          />


          <Route
            path="products/:productId/edit"
            element={
              <AdminProductForm />
            }
          />


          <Route
            path="orders"
            element={
              <AdminOrders />
            }
          />


          <Route
            path="users"
            element={
              <AdminUsers />
            }
          />


          <Route
            path="delivery-agents"
            element={
              <AdminDeliveryAgents />
            }
          />


          <Route
            path="reports"
            element={
              <AdminReports />
            }
          />

        </Route>

      </Route>


      {/* ======================================================
          DELIVERY AGENT ROUTES
      ====================================================== */}

      <Route
        element={
          <DeliveryRoute />
        }
      >

        <Route
          path="/delivery"
          element={
            <DeliveryLayout />
          }
        >

          <Route
            index
            element={
              <DeliveryDashboard />
            }
          />


          <Route
            path="orders"
            element={
              <AssignedOrders />
            }
          />


          <Route
            path="active"
            element={
              <ActiveDeliveries />
            }
          />


          <Route
            path="history"
            element={
              <DeliveryHistory />
            }
          />


          <Route
            path="performance"
            element={
              <DeliveryPerformance />
            }
          />


          <Route
            path="profile"
            element={
              <DeliveryProfile />
            }
          />

        </Route>

      </Route>


      {/* ======================================================
          404
      ====================================================== */}

      <Route
        path="*"
        element={
          <NotFound />
        }
      />

    </Routes>
  );
};


export default App;