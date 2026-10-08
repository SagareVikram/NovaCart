import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaChartBar,
  FaChartLine,
  FaMoneyBillWave,
  FaShoppingBag,
  FaUsers,
} from "react-icons/fa";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

const AdminReports = () => {
  const [
    days,
    setDays,
  ] = useState("30");

  const [
    overview,
    setOverview,
  ] = useState(null);

  const [
    customers,
    setCustomers,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /**
   * Load:
   *
   * GET /api/admin/reports/overview?days=30
   * GET /api/admin/reports/customers
   */
  const loadReports =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            overviewResponse,
            customerResponse,
          ] =
            await Promise.all([
              api.get(
                `/admin/reports/overview?days=${days}`
              ),

              api.get(
                "/admin/reports/customers"
              ),
            ]);

          setOverview({
            period:
              overviewResponse.data
                ?.period ||
              null,

            summary:
              overviewResponse.data
                ?.summary || {
                totalRevenue: 0,
                totalOrders: 0,
                averageOrderValue: 0,
              },

            orderStatusCounts:
              Array.isArray(
                overviewResponse.data
                  ?.orderStatusCounts
              )
                ? overviewResponse
                    .data
                    .orderStatusCounts
                : [],

            dailySales:
              Array.isArray(
                overviewResponse.data
                  ?.dailySales
              )
                ? overviewResponse
                    .data
                    .dailySales
                : [],

            topProducts:
              Array.isArray(
                overviewResponse.data
                  ?.topProducts
              )
                ? overviewResponse
                    .data
                    .topProducts
                : [],

            lowStockProducts:
              Array.isArray(
                overviewResponse.data
                  ?.lowStockProducts
              )
                ? overviewResponse
                    .data
                    .lowStockProducts
                : [],
          });

          setCustomers(
            Array.isArray(
              customerResponse.data
                ?.customers
            )
              ? customerResponse
                  .data
                  .customers
              : []
          );
        } catch (error) {
          setOverview(null);
          setCustomers([]);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load admin reports."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [days]
    );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const summary =
    overview?.summary || {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
    };

  const totalRevenue =
    Number(
      summary.totalRevenue ||
        0
    );

  const totalOrders =
    Number(
      summary.totalOrders ||
        0
    );

  const averageOrderValue =
    Number(
      summary.averageOrderValue ||
        0
    );

  const dailySales =
    Array.isArray(
      overview?.dailySales
    )
      ? overview.dailySales
      : [];

  const orderStatusCounts =
    Array.isArray(
      overview?.orderStatusCounts
    )
      ? overview.orderStatusCounts
      : [];

  const topProducts =
    Array.isArray(
      overview?.topProducts
    )
      ? overview.topProducts
      : [];

  const lowStockProducts =
    Array.isArray(
      overview?.lowStockProducts
    )
      ? overview.lowStockProducts
      : [];

  const totalCustomers =
    customers.length;

  /**
   * Customer report endpoint is all-time
   * non-cancelled customer activity.
   */
  const totalCustomerSpend =
    useMemo(
      () =>
        customers.reduce(
          (
            total,
            customer
          ) =>
            total +
            Number(
              customer.totalSpent ||
                0
            ),
          0
        ),
      [customers]
    );

  const repeatCustomers =
    useMemo(
      () =>
        customers.filter(
          (customer) =>
            Number(
              customer.totalOrders ||
                0
            ) > 1
        ).length,
      [customers]
    );

  /**
   * Calculate chart maximum once instead of
   * recalculating it for every bar.
   */
  const maximumDailyRevenue =
    useMemo(() => {
      if (
        dailySales.length ===
        0
      ) {
        return 1;
      }

      return Math.max(
        ...dailySales.map(
          (entry) =>
            Number(
              entry.revenue ||
                0
            )
        ),
        1
      );
    }, [dailySales]);

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

  const getProductImage =
    (product) => {
      if (
        product?.images?.[0]
          ?.url
      ) {
        return product.images[0]
          .url;
      }

      if (
        typeof product?.image ===
          "string" &&
        product.image
      ) {
        return product.image;
      }

      return "";
    };

  if (loading) {
    return (
      <main className="admin-page admin-reports-page">
        <Loader
          fullPage
          text="Loading reports..."
        />
      </main>
    );
  }

  return (
    <main className="admin-page admin-reports-page">
      {/* ==========================================
          PAGE HEADER
      =========================================== */}

      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            Business Intelligence
          </span>

          <h1>
            Reports & Analytics
          </h1>

          <p>
            Review NovaCart sales,
            orders, product performance,
            inventory, and customer
            activity.
          </p>
        </div>

        <div className="admin-report-period">
          <label htmlFor="report-days">
            Report Period
          </label>

          <select
            id="report-days"
            value={days}
            onChange={(
              event
            ) =>
              setDays(
                event.target.value
              )
            }
          >
            <option value="7">
              Last 7 Days
            </option>

            <option value="30">
              Last 30 Days
            </option>

            <option value="90">
              Last 90 Days
            </option>

            <option value="365">
              Last 1 Year
            </option>
          </select>
        </div>
      </div>

      {/* ==========================================
          ERROR
      =========================================== */}

      {error && (
        <div className="admin-message error">
          <div>
            <strong>
              Reports could not be
              loaded.
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={
              loadReports
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* ==========================================
          SUMMARY CARDS
      =========================================== */}

      <section className="admin-report-summary-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <FaMoneyBillWave />
          </div>

          <div className="admin-stat-content">
            <span>
              Revenue
            </span>

            <strong>
              ₹
              {formatPrice(
                totalRevenue
              )}
            </strong>

            <small>
              Non-cancelled orders in
              selected period
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <FaShoppingBag />
          </div>

          <div className="admin-stat-content">
            <span>
              Orders
            </span>

            <strong>
              {totalOrders}
            </strong>

            <small>
              Revenue-counted orders in
              selected period
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <FaChartLine />
          </div>

          <div className="admin-stat-content">
            <span>
              Avg. Order Value
            </span>

            <strong>
              ₹
              {formatPrice(
                averageOrderValue
              )}
            </strong>

            <small>
              Average non-cancelled
              order value
            </small>
          </div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-icon">
            <FaUsers />
          </div>

          <div className="admin-stat-content">
            <span>
              Top Customers
            </span>

            <strong>
              {totalCustomers}
            </strong>

            <small>
              All-time customer report
              records
            </small>
          </div>
        </article>
      </section>

      {/* ==========================================
          MAIN REPORT LAYOUT
      =========================================== */}

      <section className="admin-report-grid">
        <div className="admin-report-main-column">
          {/* ========================================
              DAILY SALES
          ========================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Sales Trend
                </span>

                <h2>
                  Daily Sales
                </h2>
              </div>

              <FaChartLine className="admin-card-header-icon" />
            </div>

            {dailySales.length >
            0 ? (
              <div className="admin-sales-chart">
                {dailySales.map(
                  (
                    sale,
                    index
                  ) => {
                    const revenue =
                      Number(
                        sale.revenue ||
                          0
                      );

                    const orders =
                      Number(
                        sale.orders ||
                          0
                      );

                    const height =
                      Math.max(
                        (
                          revenue /
                          maximumDailyRevenue
                        ) *
                          100,
                        4
                      );

                    return (
                      <div
                        key={
                          sale._id ||
                          index
                        }
                        className="admin-sales-chart-item"
                      >
                        <div className="admin-sales-chart-bar-wrap">
                          <div
                            className="admin-sales-chart-bar"
                            style={{
                              height: `${height}%`,
                            }}
                            title={`₹${formatPrice(
                              revenue
                            )}`}
                          />
                        </div>

                        <strong>
                          ₹
                          {formatPrice(
                            revenue
                          )}
                        </strong>

                        <span>
                          {orders}{" "}
                          order
                          {orders ===
                          1
                            ? ""
                            : "s"}
                        </span>

                        <small>
                          {formatDate(
                            sale._id
                          )}
                        </small>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="admin-empty-state">
                <FaChartBar />

                <h3>
                  No Sales Data
                </h3>

                <p>
                  Sales activity for the
                  selected period will
                  appear here.
                </p>
              </div>
            )}
          </section>

          {/* ========================================
              TOP PRODUCTS
          ========================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Product Performance
                </span>

                <h2>
                  Top Products
                </h2>
              </div>

              <FaBoxOpen className="admin-card-header-icon" />
            </div>

            {topProducts.length >
            0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        Product
                      </th>

                      <th>
                        Sold
                      </th>

                      <th>
                        Revenue
                      </th>

                      <th>
                        Avg. Price
                      </th>

                      <th>
                        Stock
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {topProducts.map(
                      (
                        product,
                        index
                      ) => {
                        const image =
                          getProductImage(
                            product
                          );

                        return (
                          <tr
                            key={
                              product.productId ||
                              product._id ||
                              `${product.sku}-${index}`
                            }
                          >
                            <td>
                              <div className="admin-product-cell">
                                <div className="admin-product-thumb">
                                  {image ? (
                                    <img
                                      src={
                                        image
                                      }
                                      alt={
                                        product.name ||
                                        "Product"
                                      }
                                    />
                                  ) : (
                                    <span>
                                      N
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <strong>
                                    {product.name ||
                                      "Product"}
                                  </strong>

                                  <span>
                                    {product.sku ||
                                      "-"}
                                  </span>

                                  {(product.category ||
                                    product.brand) && (
                                    <small>
                                      {[
                                        product.category,
                                        product.brand,
                                      ]
                                        .filter(
                                          Boolean
                                        )
                                        .join(
                                          " • "
                                        )}
                                    </small>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td>
                              {Number(
                                product.soldCount ||
                                  0
                              )}
                            </td>

                            <td>
                              <strong>
                                ₹
                                {formatPrice(
                                  product.revenue
                                )}
                              </strong>
                            </td>

                            <td>
                              ₹
                              {formatPrice(
                                product.averageUnitPrice
                              )}
                            </td>

                            <td>
                              {product.stock ??
                                "-"}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-compact-empty">
                <FaBoxOpen />

                <p>
                  No product sales data
                  for this period.
                </p>
              </div>
            )}
          </section>

          {/* ========================================
              CUSTOMER REPORT
          ========================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Customer Intelligence
                </span>

                <h2>
                  Top Customers
                </h2>
              </div>

              <FaUsers className="admin-card-header-icon" />
            </div>

            <div className="admin-customer-report-summary">
              <div>
                <span>
                  Report Customers
                </span>

                <strong>
                  {totalCustomers}
                </strong>
              </div>

              <div>
                <span>
                  Total Spend
                </span>

                <strong>
                  ₹
                  {formatPrice(
                    totalCustomerSpend
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Repeat Customers
                </span>

                <strong>
                  {repeatCustomers}
                </strong>
              </div>
            </div>

            <p className="admin-report-note">
              Customer ranking is
              all-time and includes
              non-cancelled orders only.
              The selected date period
              applies to the sales
              overview above.
            </p>

            {customers.length >
            0 ? (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>
                        Customer
                      </th>

                      <th>
                        Orders
                      </th>

                      <th>
                        Total Spent
                      </th>

                      <th>
                        Last Order
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {customers.map(
                      (
                        customer,
                        index
                      ) => (
                        <tr
                          key={
                            customer.userId ||
                            index
                          }
                        >
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-user-avatar">
                                {String(
                                  customer.name ||
                                    "U"
                                )
                                  .charAt(
                                    0
                                  )
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {customer.name ||
                                    "Customer"}
                                </strong>

                                <span>
                                  {customer.email ||
                                    "-"}
                                </span>

                                {customer.phone && (
                                  <small>
                                    {
                                      customer.phone
                                    }
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>

                          <td>
                            {Number(
                              customer.totalOrders ||
                                0
                            )}
                          </td>

                          <td>
                            ₹
                            {formatPrice(
                              customer.totalSpent
                            )}
                          </td>

                          <td>
                            {formatDate(
                              customer.lastOrderAt
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="admin-compact-empty">
                <FaUsers />

                <p>
                  Customer report data
                  is not available yet.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* ==========================================
            SIDE COLUMN
        =========================================== */}

        <aside className="admin-report-side-column">
          {/* ========================================
              ORDER STATUS
          ========================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Fulfilment
                </span>

                <h2>
                  Order Status
                </h2>
              </div>

              <FaShoppingBag className="admin-card-header-icon" />
            </div>

            {orderStatusCounts.length >
            0 ? (
              <div className="admin-status-report-list">
                {orderStatusCounts.map(
                  (
                    item,
                    index
                  ) => {
                    const status =
                      item._id ||
                      "unknown";

                    const count =
                      Number(
                        item.count ||
                          0
                      );

                    return (
                      <div
                        key={`${status}-${index}`}
                        className="admin-status-report-item"
                      >
                        <div>
                          <span
                            className={`admin-status admin-status-${status}`}
                          >
                            {formatStatus(
                              status
                            )}
                          </span>
                        </div>

                        <strong>
                          {count}
                        </strong>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="admin-compact-empty">
                <FaShoppingBag />

                <p>
                  No order-status data
                  for this period.
                </p>
              </div>
            )}
          </section>

          {/* ========================================
              LOW STOCK
          ========================================= */}

          <section className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="admin-card-eyebrow">
                  Inventory Risk
                </span>

                <h2>
                  Low Stock Products
                </h2>
              </div>

              <FaBoxOpen className="admin-card-header-icon" />
            </div>

            {lowStockProducts.length >
            0 ? (
              <div className="admin-low-stock-list">
                {lowStockProducts.map(
                  (
                    product,
                    index
                  ) => {
                    const image =
                      getProductImage(
                        product
                      );

                    return (
                      <div
                        key={
                          product._id ||
                          index
                        }
                        className="admin-low-stock-item"
                      >
                        <div className="admin-low-stock-image">
                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                product.name ||
                                "Product"
                              }
                            />
                          ) : (
                            <span>
                              N
                            </span>
                          )}
                        </div>

                        <div className="admin-low-stock-content">
                          <strong>
                            {product.name ||
                              "Product"}
                          </strong>

                          <span>
                            SKU:{" "}
                            {product.sku ||
                              "-"}
                          </span>

                          <span>
                            Stock:{" "}
                            {Number(
                              product.stock ||
                                0
                            )}
                          </span>

                          <small>
                            Alert at{" "}
                            {Number(
                              product.lowStockThreshold ||
                                0
                            )}
                          </small>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="admin-compact-empty">
                <FaBoxOpen />

                <p>
                  Inventory levels look
                  good.
                </p>
              </div>
            )}
          </section>
        </aside>
      </section>
    </main>
  );
};

export default AdminReports;