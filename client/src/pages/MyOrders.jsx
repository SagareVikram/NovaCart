import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaCalendarAlt,
  FaChevronLeft,
  FaChevronRight,
  FaEye,
  FaReceipt,
  FaSearch,
  FaSyncAlt,
  FaTruck,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

const MyOrders = () => {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState("");

  const [
    paymentFilter,
    setPaymentFilter,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pagination,
    setPagination,
  ] = useState({
    page: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  /**
   * Backend supports:
   *
   * GET /api/orders
   *
   * Query:
   * page
   * limit
   * status
   *
   * Search and payment status are not
   * currently supported server-side.
   */
  const loadOrders =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const params =
            new URLSearchParams();

          params.set(
            "page",
            String(page)
          );

          params.set(
            "limit",
            "10"
          );

          if (statusFilter) {
            params.set(
              "status",
              statusFilter
            );
          }

          const response =
            await api.get(
              `/orders?${params.toString()}`
            );

          setOrders(
            Array.isArray(
              response.data
                ?.orders
            )
              ? response.data
                  .orders
              : []
          );

          setPagination(
            response.data
              ?.pagination || {
              page: 1,
              limit: 10,
              totalOrders: 0,
              totalPages: 1,
              hasNextPage: false,
              hasPreviousPage: false,
            }
          );
        } catch (error) {
          setOrders([]);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load your orders."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        page,
        statusFilter,
      ]
    );

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  /**
   * Status filtering changes the backend
   * result set, so return to page 1.
   *
   * Search/payment filters operate on the
   * currently loaded backend page only and
   * therefore do not need a new API request.
   */
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  /**
   * Current backend does not yet support
   * search/payment filtering.
   *
   * These two filters therefore operate on
   * the currently loaded page.
   */
  const visibleOrders =
    useMemo(() => {
      const cleanSearch =
        search
          .trim()
          .toLowerCase();

      return orders.filter(
        (order) => {
          if (
            paymentFilter &&
            order.payment
              ?.status !==
              paymentFilter
          ) {
            return false;
          }

          if (!cleanSearch) {
            return true;
          }

          const orderNumber =
            String(
              order.orderNumber ||
                ""
            ).toLowerCase();

          const itemNames =
            Array.isArray(
              order.items
            )
              ? order.items
                  .map(
                    (item) =>
                      String(
                        item.name ||
                          ""
                      )
                  )
                  .join(" ")
                  .toLowerCase()
              : "";

          const skuValues =
            Array.isArray(
              order.items
            )
              ? order.items
                  .map(
                    (item) =>
                      String(
                        item.sku ||
                          ""
                      )
                  )
                  .join(" ")
                  .toLowerCase()
              : "";

          return (
            orderNumber.includes(
              cleanSearch
            ) ||
            itemNames.includes(
              cleanSearch
            ) ||
            skuValues.includes(
              cleanSearch
            )
          );
        }
      );
    }, [
      orders,
      search,
      paymentFilter,
    ]);

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

  const formatPrice =
    (value) => {
      return Number(
        value || 0
      ).toLocaleString(
        "en-IN",
        {
          maximumFractionDigits:
            2,
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

  const getItemImage =
    (item) => {
      if (
        typeof item?.image ===
          "string" &&
        item.image
      ) {
        return item.image;
      }

      return "";
    };

  const getItemName =
    (item) => {
      return (
        item?.name ||
        "Product"
      );
    };

  const statusClass =
    (status) =>
      `order-status order-status-${
        status ||
        "unknown"
      }`;

  const paymentStatusClass =
    (status) =>
      `payment-status payment-status-${
        status ||
        "unknown"
      }`;

  const clearLocalFilters =
    () => {
      setSearch("");
      setPaymentFilter("");
    };

  const resetAllFilters =
    () => {
      setSearch("");
      setStatusFilter("");
      setPaymentFilter("");
      setPage(1);
    };

  if (
    loading &&
    orders.length === 0
  ) {
    return (
      <main className="orders-page">
        <Loader
          fullPage
          text="Loading your orders..."
        />
      </main>
    );
  }

  return (
    <main className="orders-page">
      <section className="orders-page-header">
        <div className="container">
          <span className="section-eyebrow">
            My Account
          </span>

          <h1>
            My Orders
          </h1>

          <p>
            Review your purchases,
            check delivery progress,
            and open complete order
            details.
          </p>
        </div>
      </section>

      <section className="orders-main-section section-spacing">
        <div className="container">
          {error && (
            <div className="orders-message error">
              <div>
                <strong>
                  Unable to load orders
                </strong>

                <p>
                  {error}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  loadOrders
                }
              >
                Try Again
              </button>
            </div>
          )}

          {!error && (
            <>
              <div className="orders-toolbar">
                <div className="orders-search-box">
                  <FaSearch />

                  <input
                    type="search"
                    placeholder="Search this page by order, product or SKU..."
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event.target
                          .value
                      )
                    }
                  />
                </div>

                <div className="orders-filters">
                  <select
                    value={
                      statusFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setStatusFilter(
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      All Order Status
                    </option>

                    <option value="placed">
                      Placed
                    </option>

                    <option value="confirmed">
                      Confirmed
                    </option>

                    <option value="processing">
                      Processing
                    </option>

                    <option value="shipped">
                      Shipped
                    </option>

                    <option value="out_for_delivery">
                      Out for Delivery
                    </option>

                    <option value="delivered">
                      Delivered
                    </option>

                    <option value="cancelled">
                      Cancelled
                    </option>
                  </select>

                  <select
                    value={
                      paymentFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setPaymentFilter(
                        event.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      All Payments
                    </option>

                    <option value="pending">
                      Pending
                    </option>

                    <option value="paid">
                      Paid
                    </option>

                    <option value="failed">
                      Failed
                    </option>

                    <option value="refunded">
                      Refunded
                    </option>
                  </select>

                  <button
                    type="button"
                    className="order-track-button"
                    onClick={
                      resetAllFilters
                    }
                  >
                    <FaSyncAlt />

                    Reset
                  </button>
                </div>
              </div>

              <div className="orders-result-summary">
                <span>
                  Showing{" "}
                  {
                    visibleOrders.length
                  }{" "}
                  of{" "}
                  {
                    orders.length
                  }{" "}
                  order
                  {orders.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  on this page
                </span>

                <span>
                  Matching backend orders:{" "}
                  {
                    pagination.totalOrders
                  }
                </span>
              </div>

              {(search ||
                paymentFilter) && (
                <div className="orders-filter-note">
                  Search and payment filters
                  apply to the current page.
                  Order-status filtering is
                  applied across your full
                  order history.
                </div>
              )}

              {orders.length ===
              0 ? (
                <div className="orders-empty-state">
                  <div className="orders-empty-icon">
                    <FaBoxOpen />
                  </div>

                  <h2>
                    {statusFilter
                      ? `No ${formatStatus(
                          statusFilter
                        )} Orders`
                      : "No Orders Yet"}
                  </h2>

                  <p>
                    {statusFilter
                      ? "No orders match the selected order status."
                      : "Once you place your first NovaCart order, it will appear here."}
                  </p>

                  {statusFilter ? (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        resetAllFilters
                      }
                    >
                      Show All Orders
                    </button>
                  ) : (
                    <Link
                      to="/products"
                      className="primary-button"
                    >
                      Start Shopping
                    </Link>
                  )}
                </div>
              ) : visibleOrders.length >
                0 ? (
                <div className="orders-list">
                  {visibleOrders.map(
                    (
                      order
                    ) => {
                      const orderItems =
                        Array.isArray(
                          order.items
                        )
                          ? order.items
                          : [];

                      const previewItems =
                        orderItems.slice(
                          0,
                          3
                        );

                      const extraItems =
                        Math.max(
                          orderItems.length -
                            previewItems.length,
                          0
                        );

                      const orderIdentifier =
                        order.orderNumber ||
                        order._id;

                      return (
                        <article
                          key={
                            order._id
                          }
                          className="order-card"
                        >
                          <div className="order-card-header">
                            <div className="order-card-number">
                              <div className="order-card-icon">
                                <FaReceipt />
                              </div>

                              <div>
                                <span>
                                  Order
                                </span>

                                <strong>
                                  {
                                    orderIdentifier
                                  }
                                </strong>
                              </div>
                            </div>

                            <div className="order-card-date">
                              <FaCalendarAlt />

                              <span>
                                {formatDate(
                                  order.createdAt
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="order-card-body">
                            <div className="order-products-preview">
                              {previewItems.map(
                                (
                                  item,
                                  index
                                ) => {
                                  const image =
                                    getItemImage(
                                      item
                                    );

                                  return (
                                    <div
                                      key={`${item.sku || item.name || "item"}-${index}`}
                                      className="order-product-preview"
                                    >
                                      <div className="order-product-image">
                                        {image ? (
                                          <img
                                            src={
                                              image
                                            }
                                            alt={
                                              getItemName(
                                                item
                                              )
                                            }
                                          />
                                        ) : (
                                          <span>
                                            N
                                          </span>
                                        )}
                                      </div>

                                      <div className="order-product-info">
                                        <strong>
                                          {getItemName(
                                            item
                                          )}
                                        </strong>

                                        <span>
                                          Qty:{" "}
                                          {Number(
                                            item.quantity ||
                                              0
                                          )}
                                        </span>

                                        <small>
                                          ₹
                                          {formatPrice(
                                            item.unitPrice
                                          )}{" "}
                                          each
                                        </small>
                                      </div>
                                    </div>
                                  );
                                }
                              )}

                              {extraItems >
                                0 && (
                                <div className="order-extra-items">
                                  +
                                  {
                                    extraItems
                                  }{" "}
                                  more item
                                  {extraItems ===
                                  1
                                    ? ""
                                    : "s"}
                                </div>
                              )}
                            </div>

                            <div className="order-card-summary">
                              <div>
                                <span>
                                  Order Status
                                </span>

                                <strong
                                  className={statusClass(
                                    order.orderStatus
                                  )}
                                >
                                  {formatStatus(
                                    order.orderStatus
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Payment
                                </span>

                                <strong
                                  className={paymentStatusClass(
                                    order.payment
                                      ?.status
                                  )}
                                >
                                  {formatStatus(
                                    order.payment
                                      ?.status
                                  )}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Payment Method
                                </span>

                                <strong>
                                  {String(
                                    order.payment
                                      ?.method ||
                                      "-"
                                  ).toUpperCase()}
                                </strong>
                              </div>

                              <div>
                                <span>
                                  Total
                                </span>

                                <strong className="order-total">
                                  ₹
                                  {formatPrice(
                                    order.totalAmount
                                  )}
                                </strong>
                              </div>
                            </div>
                          </div>

                          <div className="order-card-footer">
                            <div className="order-card-delivery">
                              <FaTruck />

                              <div>
                                {order.orderStatus ===
                                "delivered" ? (
                                  <>
                                    <strong>
                                      Delivered
                                    </strong>

                                    <span>
                                      {formatDate(
                                        order.deliveredAt
                                      )}
                                    </span>
                                  </>
                                ) : order.orderStatus ===
                                  "cancelled" ? (
                                  <>
                                    <strong>
                                      Order Cancelled
                                    </strong>

                                    <span>
                                      {formatDate(
                                        order.cancelledAt
                                      )}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <strong>
                                      Estimated Delivery
                                    </strong>

                                    <span>
                                      {formatDate(
                                        order.estimatedDeliveryDate
                                      )}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="order-card-actions">
                              <Link
                                to={`/orders/${orderIdentifier}`}
                                className="order-view-button"
                              >
                                <FaEye />

                                View Details
                              </Link>

                              {![
                                "delivered",
                                "cancelled",
                              ].includes(
                                order.orderStatus
                              ) && (
                                <Link
                                  to={`/orders/${orderIdentifier}#tracking`}
                                  className="order-track-button"
                                >
                                  <FaTruck />

                                  Track Order
                                </Link>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="orders-no-results">
                  <FaSearch />

                  <h3>
                    No matching orders on
                    this page
                  </h3>

                  <p>
                    Try changing the local
                    search or payment filter.
                  </p>

                  <button
                    type="button"
                    onClick={
                      clearLocalFilters
                    }
                    className="primary-button"
                  >
                    Clear Page Filters
                  </button>
                </div>
              )}

              {pagination.totalPages >
                1 && (
                <div className="orders-pagination">
                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.max(
                            current -
                              1,
                            1
                          )
                      )
                    }
                    disabled={
                      !pagination.hasPreviousPage
                    }
                  >
                    <FaChevronLeft />

                    Previous
                  </button>

                  <div className="orders-pagination-pages">
                    {Array.from(
                      {
                        length:
                          pagination.totalPages,
                      },
                      (
                        _,
                        index
                      ) =>
                        index +
                        1
                    ).map(
                      (
                        pageNumber
                      ) => (
                        <button
                          type="button"
                          key={
                            pageNumber
                          }
                          className={
                            pageNumber ===
                            pagination.page
                              ? "active"
                              : ""
                          }
                          onClick={() =>
                            setPage(
                              pageNumber
                            )
                          }
                        >
                          {
                            pageNumber
                          }
                        </button>
                      )
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPage(
                        (
                          current
                        ) =>
                          Math.min(
                            current +
                              1,
                            pagination.totalPages
                          )
                      )
                    }
                    disabled={
                      !pagination.hasNextPage
                    }
                  >
                    Next

                    <FaChevronRight />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default MyOrders;