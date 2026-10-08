import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaArrowRight,
  FaBoxOpen,
  FaChartLine,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaShoppingBag,
  FaUsers,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

const AdminDashboard = () => {
  const [
    dashboard,
    setDashboard,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            "/admin/dashboard"
          );

        setDashboard(
          response.data || null
        );
      } catch (error) {
        setDashboard(null);

        setError(
          getApiErrorMessage(
            error,
            "Unable to load the admin dashboard."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /**
   * Actual backend response:
   *
   * {
   *   success: true,
   *   stats: {
   *     users: {
   *       total,
   *       active,
   *       inactive
   *     },
   *     products: {
   *       total,
   *       active,
   *       inactive,
   *       lowStock
   *     },
   *     orders: {
   *       total,
   *       pending
   *     },
   *     revenue
   *   },
   *   recentOrders,
   *   recentUsers
   * }
   */

  const stats =
    dashboard?.stats || {};

  const userStats =
    stats.users || {};

  const productStats =
    stats.products || {};

  const orderStats =
    stats.orders || {};

  const recentOrders =
    Array.isArray(
      dashboard?.recentOrders
    )
      ? dashboard.recentOrders
      : [];

  const recentUsers =
    Array.isArray(
      dashboard?.recentUsers
    )
      ? dashboard.recentUsers
      : [];

  const totalRevenue =
    Number(
      stats.revenue || 0
    );

  const totalOrders =
    Number(
      orderStats.total || 0
    );

  const pendingOrders =
    Number(
      orderStats.pending || 0
    );

  const totalProducts =
    Number(
      productStats.total || 0
    );

  const activeProducts =
    Number(
      productStats.active || 0
    );

  const inactiveProducts =
    Number(
      productStats.inactive || 0
    );

  const lowStockCount =
    Number(
      productStats.lowStock || 0
    );

  const totalUsers =
    Number(
      userStats.total || 0
    );

  const activeUsers =
    Number(
      userStats.active || 0
    );

  const inactiveUsers =
    Number(
      userStats.inactive || 0
    );

  const averageOrderValue =
    useMemo(() => {
      if (
        totalOrders <= 0
      ) {
        return 0;
      }

      return (
        totalRevenue /
        totalOrders
      );
    }, [
      totalRevenue,
      totalOrders,
    ]);

  const formatPrice =
    (value) => {
      return Number(
        value || 0
      ).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits:
            0,

          maximumFractionDigits:
            2,
        }
      );
    };

  const formatDate =
    (value) => {
      if (!value) {
        return "-";
      }

      const date =
        new Date(value);

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return "-";
      }

      return date.toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
    };

  const formatStatus =
    (value) => {
      if (!value) {
        return "-";
      }

      return String(value)
        .replace(
          /_/g,
          " "
        )
        .replace(
          /\b\w/g,
          (character) =>
            character.toUpperCase()
        );
    };

  if (loading) {
    return (
      <main className="admin-page admin-dashboard-page">
        <Loader
          fullPage
          text="Loading admin dashboard..."
        />
      </main>
    );
  }

  return (
    <main className="admin-page admin-dashboard-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            NovaCart Administration
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Monitor store activity,
            sales, inventory, users,
            and recent customer orders.
          </p>
        </div>

        <div className="admin-page-header-actions">
          <Link
            to="/admin/products/new"
            className="admin-primary-button"
          >
            <FaBoxOpen />

            Add Product
          </Link>

          <Link
            to="/admin/reports"
            className="admin-secondary-button"
          >
            <FaChartLine />

            View Reports
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-message error">
          <div>
            <strong>
              Dashboard data could not be loaded.
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadDashboard
            }
          >
            Try Again
          </button>
        </div>
      )}

      <section className="admin-stat-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <FaMoneyBillWave />
          </div>

          <div className="admin-stat-content">
            <span>
              Total Revenue
            </span>

            <strong>
              ₹
              {formatPrice(
                totalRevenue
              )}
            </strong>

            <small>
              Revenue from non-cancelled orders
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <FaShoppingBag />
          </div>

          <div className="admin-stat-content">
            <span>
              Total Orders
            </span>

            <strong>
              {totalOrders}
            </strong>

            <small>
              {pendingOrders} pending
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <FaBoxOpen />
          </div>

          <div className="admin-stat-content">
            <span>
              Products
            </span>

            <strong>
              {totalProducts}
            </strong>

            <small>
              {activeProducts} active
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <FaUsers />
          </div>

          <div className="admin-stat-content">
            <span>
              Customers
            </span>

            <strong>
              {totalUsers}
            </strong>

            <small>
              {activeUsers} active
            </small>
          </div>
        </article>
      </section>

      <section className="admin-dashboard-grid">
        <div className="admin-dashboard-main-column">
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Sales Snapshot
                </span>

                <h2>
                  Store Performance
                </h2>
              </div>

              <Link
                to="/admin/reports"
                className="admin-card-link"
              >
                Full Report

                <FaArrowRight />
              </Link>
            </div>

            <div className="admin-performance-grid">
              <div className="admin-performance-item">
                <span>
                  Revenue
                </span>

                <strong>
                  ₹
                  {formatPrice(
                    totalRevenue
                  )}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Orders
                </span>

                <strong>
                  {totalOrders}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Avg. Order Value
                </span>

                <strong>
                  ₹
                  {formatPrice(
                    averageOrderValue
                  )}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Low Stock
                </span>

                <strong>
                  {lowStockCount}
                </strong>
              </div>
            </div>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Latest Activity
                </span>

                <h2>
                  Recent Orders
                </h2>
              </div>

              <Link
                to="/admin/orders"
                className="admin-card-link"
              >
                View Orders

                <FaArrowRight />
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        Order
                      </th>

                      <th>
                        Customer
                      </th>

                      <th>
                        Date
                      </th>

                      <th>
                        Amount
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentOrders.map(
                      (order) => (
                        <tr
                          key={
                            order._id
                          }
                        >
                          <td>
                            <strong>
                              {order.orderNumber ||
                                "-"}
                            </strong>
                          </td>

                          <td>
                            <div className="admin-customer-cell">
                              <div>
                                <strong>
                                  {order.user
                                    ?.name ||
                                    order
                                      .shippingAddress
                                      ?.fullName ||
                                    "-"}
                                </strong>

                                <span>
                                  {order.user
                                    ?.email ||
                                    order
                                      .shippingAddress
                                      ?.phone ||
                                    "-"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {formatDate(
                              order.createdAt
                            )}
                          </td>

                          <td>
                            <strong className="admin-order-amount">
                              ₹
                              {formatPrice(
                                order.totalAmount
                              )}
                            </strong>
                          </td>

                          <td>
                            <span
                              className={`admin-status admin-status-${
                                order.orderStatus ||
                                "unknown"
                              }`}
                            >
                              {formatStatus(
                                order.orderStatus
                              )}
                            </span>
                          </td>

                          <td>
                            <Link
                              to="/admin/orders"
                              className="admin-table-action"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-empty-state">
                <FaShoppingBag />

                <h3>
                  No recent orders
                </h3>

                <p>
                  New customer orders will
                  appear here.
                </p>
              </div>
            )}
          </section>
        </div>

        <div className="admin-dashboard-side-column">
          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Inventory
                </span>

                <h2>
                  Inventory Status
                </h2>
              </div>

              <FaExclamationTriangle className="admin-card-header-icon" />
            </div>

            <div className="admin-performance-grid">
              <div className="admin-performance-item">
                <span>
                  Total
                </span>

                <strong>
                  {totalProducts}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Active
                </span>

                <strong>
                  {activeProducts}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Inactive
                </span>

                <strong>
                  {inactiveProducts}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Low Stock
                </span>

                <strong>
                  {lowStockCount}
                </strong>
              </div>
            </div>

            {lowStockCount > 0 ? (
              <div className="admin-dashboard-warning">
                <FaExclamationTriangle />

                <div>
                  <strong>
                    Stock attention required
                  </strong>

                  <p>
                    {lowStockCount} active{" "}
                    {lowStockCount === 1
                      ? "product has"
                      : "products have"}{" "}
                    reached the configured
                    low-stock threshold.
                  </p>
                </div>
              </div>
            ) : (
              <div className="admin-dashboard-success">
                <FaBoxOpen />

                <div>
                  <strong>
                    Inventory looks good
                  </strong>

                  <p>
                    No active product is
                    currently at or below its
                    low-stock threshold.
                  </p>
                </div>
              </div>
            )}

            <Link
              to="/admin/products"
              className="admin-full-width-link"
            >
              Manage Products

              <FaArrowRight />
            </Link>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Customers
                </span>

                <h2>
                  Account Status
                </h2>
              </div>

              <FaUsers className="admin-card-header-icon" />
            </div>

            <div className="admin-performance-grid">
              <div className="admin-performance-item">
                <span>
                  Total
                </span>

                <strong>
                  {totalUsers}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Active
                </span>

                <strong>
                  {activeUsers}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Inactive
                </span>

                <strong>
                  {inactiveUsers}
                </strong>
              </div>

              <div className="admin-performance-item">
                <span>
                  Active Rate
                </span>

                <strong>
                  {totalUsers > 0
                    ? `${Math.round(
                        (activeUsers /
                          totalUsers) *
                          100
                      )}%`
                    : "0%"}
                </strong>
              </div>
            </div>

            <Link
              to="/admin/users"
              className="admin-full-width-link"
            >
              Manage Customers

              <FaArrowRight />
            </Link>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  New Customers
                </span>

                <h2>
                  Recent Users
                </h2>
              </div>

              <FaUsers className="admin-card-header-icon" />
            </div>

            {recentUsers.length > 0 ? (
              <div className="admin-recent-users">
                {recentUsers.map(
                  (user) => (
                    <div
                      key={
                        user._id
                      }
                      className="admin-recent-user"
                    >
                      <div className="admin-user-avatar">
                        {String(
                          user.name ||
                            "U"
                        )
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <strong>
                          {user.name ||
                            "Customer"}
                        </strong>

                        <span>
                          {user.email ||
                            "-"}
                        </span>

                        <span>
                          Joined{" "}
                          {formatDate(
                            user.createdAt
                          )}
                        </span>
                      </div>

                      <span
                        className={`admin-status ${
                          user.isActive
                            ? "admin-status-active"
                            : "admin-status-inactive"
                        }`}
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="admin-compact-empty">
                <FaUsers />

                <p>
                  No recent customer accounts.
                </p>
              </div>
            )}

            <Link
              to="/admin/users"
              className="admin-full-width-link"
            >
              View Customers

              <FaArrowRight />
            </Link>
          </section>

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Shortcuts
                </span>

                <h2>
                  Quick Actions
                </h2>
              </div>
            </div>

            <div className="admin-quick-actions">
              <Link to="/admin/products/new">
                <FaBoxOpen />

                Add Product
              </Link>

              <Link to="/admin/products">
                <FaBoxOpen />

                Products
              </Link>

              <Link to="/admin/orders">
                <FaShoppingBag />

                Orders
              </Link>

              <Link to="/admin/users">
                <FaUsers />

                Customers
              </Link>

              <Link to="/admin/reports">
                <FaChartLine />

                Reports
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
};

export default AdminDashboard;