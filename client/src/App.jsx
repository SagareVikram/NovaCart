import {
  Navigate,
  Outlet,
  Route,
  Routes,
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
  return (
    <div className="admin-layout">

      <aside className="admin-sidebar">

        <div className="admin-sidebar-brand">

          <strong>
            NovaCart
          </strong>

          <span>
            Admin
          </span>

        </div>


        <nav className="admin-sidebar-nav">

          <a href="/admin">
            Dashboard
          </a>

          <a href="/admin/products">
            Products
          </a>

          <a href="/admin/orders">
            Orders
          </a>

          <a href="/admin/users">
            Customers
          </a>

          <a href="/admin/delivery-agents">
            Delivery Agents
          </a>

          <a href="/admin/reports">
            Reports
          </a>

        </nav>

      </aside>


      <div className="admin-main">
        <Outlet />
      </div>

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