import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBan,
  FaBoxOpen,
  FaCreditCard,
  FaEye,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaSearch,
  FaSyncAlt,
  FaTimes,
  FaTruck,
  FaUser,
} from "react-icons/fa";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [sort, setSort] = useState("newest");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalOrders: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const [busyOrderId, setBusyOrderId] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  /**
   * Load admin orders.
   *
   * sort and paymentMethod are intentionally sent now because
   * we will add their backend support during the planned
   * backend query/filter improvement step.
   */
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", "10");

      if (sort) {
        params.set("sort", sort);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (orderStatus) {
        params.set("status", orderStatus);
      }

      if (paymentStatus) {
        params.set(
          "paymentStatus",
          paymentStatus
        );
      }

      if (paymentMethod) {
        params.set(
          "paymentMethod",
          paymentMethod
        );
      }

      const response = await api.get(
        `/admin/orders?${params.toString()}`
      );

      setOrders(
        Array.isArray(response.data?.orders)
          ? response.data.orders
          : []
      );

      setPagination(
        response.data?.pagination || {
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
          "Unable to load orders."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    sort,
    search,
    orderStatus,
    paymentStatus,
    paymentMethod,
  ]);

  /**
   * Debounce filter/search requests.
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadOrders();
    }, 250);

    return () => {
      clearTimeout(timeout);
    };
  }, [loadOrders]);

  /**
   * Return to page 1 whenever filters change.
   */
  useEffect(() => {
    setPage(1);
  }, [
    search,
    orderStatus,
    paymentStatus,
    paymentMethod,
    sort,
  ]);

  /**
   * Prevent background scrolling while order panel is open.
   */
  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedOrder]);

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString(
      "en-IN",
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );
  };

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "-";
    }

    return date.toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const formatStatus = (value) => {
    if (!value) {
      return "-";
    }

    return String(value)
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (character) =>
          character.toUpperCase()
      );
  };

  /**
   * These counts represent only the currently loaded page.
   * Total-order count comes from backend pagination.
   */
  const pendingCount = useMemo(() => {
    return orders.filter((order) =>
      [
        "placed",
        "confirmed",
        "processing",
      ].includes(order.orderStatus)
    ).length;
  }, [orders]);

  const deliveredCount = useMemo(() => {
    return orders.filter(
      (order) =>
        order.orderStatus ===
        "delivered"
    ).length;
  }, [orders]);

  const paidCount = useMemo(() => {
    return orders.filter(
      (order) =>
        order.payment?.status ===
        "paid"
    ).length;
  }, [orders]);

  const resetFeedback = () => {
    setError("");
    setMessage("");
  };

  const resetFilters = () => {
    setSearch("");
    setOrderStatus("");
    setPaymentStatus("");
    setPaymentMethod("");
    setSort("newest");
    setPage(1);
  };

  /**
   * Admin order details endpoint uses MongoDB _id.
   */
  const refreshSelectedOrder = async (
    orderId
  ) => {
    if (!orderId) {
      return;
    }

    try {
      setDetailsError("");

      const response = await api.get(
        `/admin/orders/${orderId}`
      );

      setSelectedOrder(
        response.data?.order || null
      );
    } catch (error) {
      setDetailsError(
        getApiErrorMessage(
          error,
          "Unable to refresh order details."
        )
      );
    }
  };

  /**
   * Open order side panel.
   *
   * IMPORTANT:
   * Backend uses Order.findById(), therefore order._id
   * must be used here.
   */
  const openOrderDetails = async (
    order
  ) => {
    if (!order?._id) {
      setError(
        "Unable to open this order because its order ID is missing."
      );

      return;
    }

    try {
      setDetailsLoading(true);
      setDetailsError("");

      /**
       * Immediately show existing row data.
       */
      setSelectedOrder(order);

      const response = await api.get(
        `/admin/orders/${order._id}`
      );

      setSelectedOrder(
        response.data?.order || order
      );
    } catch (error) {
      setDetailsError(
        getApiErrorMessage(
          error,
          "Unable to load order details."
        )
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setDetailsError("");
  };

  /**
   * Update normal order status.
   *
   * Cancellation is NOT handled here.
   * Backend intentionally requires the dedicated
   * cancellation endpoint so inventory is restored.
   */
  const handleOrderStatusChange = async (
    order,
    nextStatus
  ) => {
    if (
      !order?._id ||
      !nextStatus ||
      nextStatus === order.orderStatus
    ) {
      return;
    }

    /**
     * Never attempt normal status endpoint for cancellation.
     */
    if (
      nextStatus === "cancelled"
    ) {
      setError(
        "Use the Cancel Order button to cancel an order."
      );

      return;
    }

    resetFeedback();

    try {
      setBusyOrderId(order._id);

      const response = await api.patch(
        `/admin/orders/${order._id}/status`,
        {
          status: nextStatus,

          /**
           * Backend expects "message", not "note".
           */
          message:
            `Order status changed to ${formatStatus(
              nextStatus
            )} by administrator.`,
        }
      );

      setMessage(
        response.data?.message ||
          "Order status updated successfully."
      );

      await loadOrders();

      if (
        selectedOrder?._id ===
        order._id
      ) {
        await refreshSelectedOrder(
          order._id
        );
      }
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to update order status."
        )
      );
    } finally {
      setBusyOrderId("");
    }
  };

  /**
   * Update payment status.
   */
  const handlePaymentStatusChange = async (
    order,
    nextStatus
  ) => {
    if (
      !order?._id ||
      !nextStatus ||
      nextStatus ===
        order.payment?.status
    ) {
      return;
    }

    resetFeedback();

    try {
      setBusyOrderId(order._id);

      const response = await api.patch(
        `/admin/orders/${order._id}/payment`,
        {
          status: nextStatus,
        }
      );

      setMessage(
        response.data?.message ||
          "Payment status updated successfully."
      );

      await loadOrders();

      if (
        selectedOrder?._id ===
        order._id
      ) {
        await refreshSelectedOrder(
          order._id
        );
      }
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to update payment status."
        )
      );
    } finally {
      setBusyOrderId("");
    }
  };

  /**
   * Admin cancellation endpoint.
   *
   * IMPORTANT:
   * Backend route is POST, not PATCH.
   *
   * It also restores product stock and automatically
   * refunds already-paid orders.
   */
  const handleCancelOrder = async (
    order
  ) => {
    if (!order?._id) {
      return;
    }

    resetFeedback();

    const orderLabel =
      order.orderNumber ||
      order._id;

    const confirmed =
      window.confirm(
        `Are you sure you want to cancel order ${orderLabel}? Product stock will be restored.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setBusyOrderId(order._id);

      const response = await api.post(
        `/admin/orders/${order._id}/cancel`,
        {
          reason:
            "Cancelled by administrator.",
        }
      );

      setMessage(
        response.data?.message ||
          "Order cancelled successfully."
      );

      /**
       * If side panel is open, immediately use the returned
       * cancelled order before refreshing the list.
       */
      if (
        selectedOrder?._id ===
          order._id &&
        response.data?.order
      ) {
        setSelectedOrder(
          response.data.order
        );
      }

      await loadOrders();

      if (
        selectedOrder?._id ===
        order._id
      ) {
        await refreshSelectedOrder(
          order._id
        );
      }
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to cancel order."
        )
      );
    } finally {
      setBusyOrderId("");
    }
  };

  /**
   * Backend Order model uses:
   * subtotal
   * shippingCharge
   * discountAmount
   * taxAmount
   * totalAmount
   */
  const getSubtotal = (order) => {
    return Number(
      order?.subtotal || 0
    );
  };

  const getShippingCharge = (
    order
  ) => {
    return Number(
      order?.shippingCharge || 0
    );
  };

  const getDiscountAmount = (
    order
  ) => {
    return Number(
      order?.discountAmount || 0
    );
  };

  const getTaxAmount = (order) => {
    return Number(
      order?.taxAmount || 0
    );
  };

  const getOrderTotal = (order) => {
    return Number(
      order?.totalAmount || 0
    );
  };

  /**
   * Order item stores image snapshot as a string.
   *
   * Populated product data is kept as fallback.
   */
  const getItemImage = (item) => {
    if (
      typeof item?.image === "string" &&
      item.image
    ) {
      return item.image;
    }

    if (item?.image?.url) {
      return item.image.url;
    }

    return (
      item?.product?.images?.[0]?.url ||
      ""
    );
  };

  const getItemName = (item) => {
    return (
      item?.name ||
      item?.product?.name ||
      "Product"
    );
  };

  /**
   * Cancel only orders that have not been delivered/cancelled.
   *
   * Backend permits admin cancellation of shipped and
   * out-for-delivery orders, so we follow the backend contract.
   */
  const canCancelOrder = (order) => {
    return ![
      "delivered",
      "cancelled",
    ].includes(order?.orderStatus);
  };

  /**
   * Delivered and cancelled orders cannot be moved back
   * to another normal status.
   */
  const canChangeOrderStatus = (
    order
  ) => {
    return ![
      "delivered",
      "cancelled",
    ].includes(order?.orderStatus);
  };

  if (
    loading &&
    orders.length === 0
  ) {
    return (
      <main className="admin-page admin-orders-page">
        <Loader
          fullPage
          text="Loading orders..."
        />
      </main>
    );
  }

  return (
    <main className="admin-page admin-orders-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            Order Management
          </span>

          <h1>Orders</h1>

          <p>
            Review customer orders,
            update fulfilment progress,
            manage payment status, and
            handle cancellations.
          </p>
        </div>
      </div>

      {message && (
        <div className="admin-message success">
          {message}
        </div>
      )}

      {error && (
        <div className="admin-message error">
          <div>
            <strong>
              Order operation failed
            </strong>

            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              loadOrders();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <section className="admin-order-summary-grid">
        <article className="admin-mini-stat">
          <span>
            Total Orders
          </span>

          <strong>
            {pagination.totalOrders}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Pending on Page
          </span>

          <strong>
            {pendingCount}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Delivered on Page
          </span>

          <strong>
            {deliveredCount}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Paid on Page
          </span>

          <strong>
            {paidCount}
          </strong>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-order-filters">
          <div className="admin-search-box">
            <FaSearch />

            <input
              type="search"
              placeholder="Search order, customer, email..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={orderStatus}
            onChange={(event) =>
              setOrderStatus(
                event.target.value
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
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(
                event.target.value
              )
            }
          >
            <option value="">
              All Payment Status
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

          <select
            value={paymentMethod}
            onChange={(event) =>
              setPaymentMethod(
                event.target.value
              )
            }
          >
            <option value="">
              All Methods
            </option>

            <option value="cod">
              COD
            </option>

            <option value="upi">
              UPI
            </option>

            <option value="card">
              Card
            </option>
          </select>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value
              )
            }
          >
            <option value="newest">
              Newest
            </option>

            <option value="oldest">
              Oldest
            </option>

            <option value="amount_high">
              Amount High-Low
            </option>

            <option value="amount_low">
              Amount Low-High
            </option>
          </select>

          <button
            type="button"
            className="admin-filter-reset"
            onClick={resetFilters}
          >
            <FaSyncAlt />

            Reset
          </button>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-card-eyebrow">
              Customer Orders
            </span>

            <h2>Order List</h2>
          </div>

          <span className="admin-result-count">
            {pagination.totalOrders} total
          </span>
        </div>

        {orders.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table admin-orders-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Order Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {orders.map((order) => {
                    const isBusy =
                      busyOrderId ===
                      order._id;

                    const canCancel =
                      canCancelOrder(
                        order
                      );

                    const canChangeStatus =
                      canChangeOrderStatus(
                        order
                      );

                    return (
                      <tr key={order._id}>
                        <td>
                          <div className="admin-order-number-cell">
                            <div>
                              <strong>
                                {order.orderNumber ||
                                  order._id}
                              </strong>

                              <span>
                                {order.payment
                                  ?.method
                                  ?.toUpperCase() ||
                                  "-"}
                              </span>
                            </div>
                          </div>
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
                          <strong>
                            {order.totalItems ||
                              order.items
                                ?.length ||
                              0}
                          </strong>
                        </td>

                        <td>
                          <strong className="admin-order-amount">
                            ₹
                            {formatPrice(
                              getOrderTotal(
                                order
                              )
                            )}
                          </strong>
                        </td>

                        <td>
                          <div className="admin-order-payment-cell">
                            <span
                              className={`admin-status admin-status-${
                                order.payment
                                  ?.status ||
                                "pending"
                              }`}
                            >
                              {formatStatus(
                                order.payment
                                  ?.status
                              )}
                            </span>

                            <select
                              value={
                                order.payment
                                  ?.status ||
                                "pending"
                              }
                              onChange={(
                                event
                              ) =>
                                handlePaymentStatusChange(
                                  order,
                                  event.target
                                    .value
                                )
                              }
                              disabled={
                                isBusy
                              }
                              aria-label={`Payment status for ${
                                order.orderNumber ||
                                order._id
                              }`}
                            >
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
                          </div>
                        </td>

                        <td>
                          <div className="admin-order-status-cell">
                            <span
                              className={`admin-status admin-status-${order.orderStatus}`}
                            >
                              {formatStatus(
                                order.orderStatus
                              )}
                            </span>

                            <select
                              value={
                                order.orderStatus
                              }
                              onChange={(
                                event
                              ) =>
                                handleOrderStatusChange(
                                  order,
                                  event.target
                                    .value
                                )
                              }
                              disabled={
                                isBusy ||
                                !canChangeStatus
                              }
                              aria-label={`Order status for ${
                                order.orderNumber ||
                                order._id
                              }`}
                            >
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

                              {order.orderStatus ===
                                "cancelled" && (
                                <option value="cancelled">
                                  Cancelled
                                </option>
                              )}
                            </select>
                          </div>
                        </td>

                        <td>
                          {formatDate(
                            order.createdAt
                          )}
                        </td>

                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              title="View order details"
                              onClick={() =>
                                openOrderDetails(
                                  order
                                )
                              }
                            >
                              <FaEye />
                            </button>

                            <button
                              type="button"
                              title="Mark as shipped"
                              disabled={
                                isBusy ||
                                ![
                                  "placed",
                                  "confirmed",
                                  "processing",
                                ].includes(
                                  order.orderStatus
                                )
                              }
                              onClick={() =>
                                handleOrderStatusChange(
                                  order,
                                  "shipped"
                                )
                              }
                            >
                              <FaTruck />
                            </button>

                            <button
                              type="button"
                              title="Mark payment as paid"
                              disabled={
                                isBusy ||
                                order.payment
                                  ?.status ===
                                  "paid" ||
                                order.payment
                                  ?.status ===
                                  "refunded"
                              }
                              onClick={() =>
                                handlePaymentStatusChange(
                                  order,
                                  "paid"
                                )
                              }
                            >
                              {order.payment
                                ?.method ===
                              "card" ? (
                                <FaCreditCard />
                              ) : (
                                <FaMoneyBillWave />
                              )}
                            </button>

                            {canCancel && (
                              <button
                                type="button"
                                className="danger"
                                title="Cancel order"
                                disabled={
                                  isBusy
                                }
                                onClick={() =>
                                  handleCancelOrder(
                                    order
                                  )
                                }
                              >
                                <FaBan />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.max(
                        current - 1,
                        1
                      )
                    )
                  }
                >
                  Previous
                </button>

                <div>
                  {Array.from(
                    {
                      length:
                        pagination.totalPages,
                    },
                    (_, index) =>
                      index + 1
                  ).map((pageNumber) => (
                    <button
                      type="button"
                      key={pageNumber}
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
                      {pageNumber}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={
                    !pagination.hasNextPage
                  }
                  onClick={() =>
                    setPage((current) =>
                      Math.min(
                        current + 1,
                        pagination.totalPages
                      )
                    )
                  }
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="admin-empty-state">
            <FaSearch />

            <h3>
              No orders found
            </h3>

            <p>
              Customer orders matching the
              selected filters will appear
              here.
            </p>

            <button
              type="button"
              className="admin-primary-button"
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {selectedOrder && (
        <>
          <div
            className="admin-order-detail-overlay"
            onClick={
              closeOrderDetails
            }
          />

          <aside className="admin-order-detail-panel">
            <div className="admin-order-detail-header">
              <div>
                <span className="admin-card-eyebrow">
                  Order Details
                </span>

                <h2>
                  {selectedOrder.orderNumber ||
                    "Order"}
                </h2>

                <small>
                  {formatDate(
                    selectedOrder.createdAt
                  )}
                </small>
              </div>

              <button
                type="button"
                onClick={
                  closeOrderDetails
                }
                aria-label="Close order details"
              >
                <FaTimes />
              </button>
            </div>

            {detailsLoading ? (
              <Loader
                text="Loading order details..."
              />
            ) : (
              <div className="admin-order-detail-body">
                {detailsError && (
                  <div className="admin-message error">
                    <div>
                      <strong>
                        Unable to load complete order
                      </strong>

                      <p>
                        {detailsError}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        refreshSelectedOrder(
                          selectedOrder._id
                        )
                      }
                    >
                      Retry
                    </button>
                  </div>
                )}

                <section className="admin-order-detail-statuses">
                  <div>
                    <span>
                      Order Status
                    </span>

                    <strong
                      className={`admin-status admin-status-${selectedOrder.orderStatus}`}
                    >
                      {formatStatus(
                        selectedOrder.orderStatus
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Payment Status
                    </span>

                    <strong
                      className={`admin-status admin-status-${
                        selectedOrder
                          .payment?.status ||
                        "pending"
                      }`}
                    >
                      {formatStatus(
                        selectedOrder
                          .payment?.status
                      )}
                    </strong>
                  </div>
                </section>

                <section className="admin-order-detail-section">
                  <div className="admin-order-detail-title">
                    <FaUser />

                    <h3>
                      Customer
                    </h3>
                  </div>

                  <div className="admin-order-detail-info">
                    <div>
                      <span>Name</span>

                      <strong>
                        {selectedOrder.user
                          ?.name ||
                          selectedOrder
                            .shippingAddress
                            ?.fullName ||
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <span>Email</span>

                      <strong>
                        {selectedOrder.user
                          ?.email ||
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <span>Phone</span>

                      <strong>
                        {selectedOrder
                          .shippingAddress
                          ?.phone ||
                          selectedOrder.user
                            ?.phone ||
                          "-"}
                      </strong>
                    </div>
                  </div>
                </section>

                <section className="admin-order-detail-section">
                  <div className="admin-order-detail-title">
                    <FaMapMarkerAlt />

                    <h3>
                      Shipping Address
                    </h3>
                  </div>

                  <div className="admin-order-shipping-address">
                    <strong>
                      {selectedOrder
                        .shippingAddress
                        ?.fullName ||
                        "-"}
                    </strong>

                    <p>
                      {[
                        selectedOrder
                          .shippingAddress
                          ?.addressLine1,

                        selectedOrder
                          .shippingAddress
                          ?.addressLine2,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <p>
                      {[
                        selectedOrder
                          .shippingAddress
                          ?.city,

                        selectedOrder
                          .shippingAddress
                          ?.state,

                        selectedOrder
                          .shippingAddress
                          ?.postalCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>

                    <p>
                      {selectedOrder
                        .shippingAddress
                        ?.country ||
                        "India"}
                    </p>

                    <span>
                      Phone:{" "}
                      {selectedOrder
                        .shippingAddress
                        ?.phone ||
                        "-"}
                    </span>
                  </div>
                </section>

                <section className="admin-order-detail-section">
                  <div className="admin-order-detail-title">
                    <FaBoxOpen />

                    <h3>
                      Products
                    </h3>
                  </div>

                  <div className="admin-order-detail-items">
                    {selectedOrder.items
                      ?.length > 0 ? (
                      selectedOrder.items.map(
                        (
                          item,
                          index
                        ) => {
                          const image =
                            getItemImage(
                              item
                            );

                          return (
                            <article
                              key={`${item.product?._id || item.product || "product"}-${index}`}
                              className="admin-order-detail-item"
                            >
                              <div className="admin-order-detail-item-image">
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

                              <div className="admin-order-detail-item-content">
                                <strong>
                                  {getItemName(
                                    item
                                  )}
                                </strong>

                                <span>
                                  SKU:{" "}
                                  {item.sku ||
                                    "-"}
                                </span>

                                <span>
                                  Quantity:{" "}
                                  {item.quantity ||
                                    1}
                                </span>

                                <span>
                                  Unit Price: ₹
                                  {formatPrice(
                                    item.unitPrice ||
                                      0
                                  )}
                                </span>
                              </div>

                              <strong className="admin-order-detail-item-total">
                                ₹
                                {formatPrice(
                                  item.totalPrice ??
                                    Number(
                                      item.unitPrice ||
                                        0
                                    ) *
                                      Number(
                                        item.quantity ||
                                          1
                                      )
                                )}
                              </strong>
                            </article>
                          );
                        }
                      )
                    ) : (
                      <p>
                        No product details are
                        available for this order.
                      </p>
                    )}
                  </div>
                </section>

                <section className="admin-order-detail-section">
                  <div className="admin-order-detail-title">
                    <FaCreditCard />

                    <h3>
                      Payment
                    </h3>
                  </div>

                  <div className="admin-order-detail-info">
                    <div>
                      <span>
                        Method
                      </span>

                      <strong>
                        {selectedOrder
                          .payment?.method
                          ?.toUpperCase() ||
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Status
                      </span>

                      <strong>
                        {formatStatus(
                          selectedOrder
                            .payment?.status
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Transaction ID
                      </span>

                      <strong>
                        {selectedOrder
                          .payment
                          ?.transactionId ||
                          "-"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Paid At
                      </span>

                      <strong>
                        {formatDate(
                          selectedOrder
                            .payment?.paidAt
                        )}
                      </strong>
                    </div>

                    {selectedOrder
                      .payment
                      ?.refundedAt && (
                      <div>
                        <span>
                          Refunded At
                        </span>

                        <strong>
                          {formatDate(
                            selectedOrder
                              .payment
                              ?.refundedAt
                          )}
                        </strong>
                      </div>
                    )}
                  </div>
                </section>

                <section className="admin-order-detail-section">
                  <div className="admin-order-detail-title">
                    <FaMoneyBillWave />

                    <h3>
                      Order Summary
                    </h3>
                  </div>

                  <div className="admin-order-detail-summary">
                    <div>
                      <span>
                        Subtotal
                      </span>

                      <strong>
                        ₹
                        {formatPrice(
                          getSubtotal(
                            selectedOrder
                          )
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Shipping
                      </span>

                      <strong>
                        {getShippingCharge(
                          selectedOrder
                        ) === 0
                          ? "Free"
                          : `₹${formatPrice(
                              getShippingCharge(
                                selectedOrder
                              )
                            )}`}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Discount
                      </span>

                      <strong>
                        - ₹
                        {formatPrice(
                          getDiscountAmount(
                            selectedOrder
                          )
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Tax
                      </span>

                      <strong>
                        ₹
                        {formatPrice(
                          getTaxAmount(
                            selectedOrder
                          )
                        )}
                      </strong>
                    </div>

                    <div className="total">
                      <span>
                        Total
                      </span>

                      <strong>
                        ₹
                        {formatPrice(
                          getOrderTotal(
                            selectedOrder
                          )
                        )}
                      </strong>
                    </div>
                  </div>
                </section>

                {selectedOrder.customerNote && (
                  <section className="admin-order-detail-section">
                    <div className="admin-order-detail-title">
                      <h3>
                        Customer Note
                      </h3>
                    </div>

                    <p className="admin-order-note">
                      {
                        selectedOrder.customerNote
                      }
                    </p>
                  </section>
                )}

                {selectedOrder
                  .orderStatus ===
                  "cancelled" && (
                  <section className="admin-order-detail-section">
                    <div className="admin-order-detail-title">
                      <FaBan />

                      <h3>
                        Cancellation
                      </h3>
                    </div>

                    <div className="admin-order-detail-info">
                      <div>
                        <span>
                          Cancelled At
                        </span>

                        <strong>
                          {formatDate(
                            selectedOrder
                              .cancelledAt
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Reason
                        </span>

                        <strong>
                          {selectedOrder
                            .cancellationReason ||
                            "Cancelled by administrator."}
                        </strong>
                      </div>
                    </div>
                  </section>
                )}

                <section className="admin-order-detail-section">
                  <div className="admin-order-detail-title">
                    <FaTruck />

                    <h3>
                      Update Order
                    </h3>
                  </div>

                  <div className="admin-order-detail-actions">
                    <div className="form-group">
                      <label htmlFor="admin-detail-order-status">
                        Order Status
                      </label>

                      <select
                        id="admin-detail-order-status"
                        value={
                          selectedOrder.orderStatus
                        }
                        disabled={
                          busyOrderId ===
                            selectedOrder._id ||
                          !canChangeOrderStatus(
                            selectedOrder
                          )
                        }
                        onChange={(event) =>
                          handleOrderStatusChange(
                            selectedOrder,
                            event.target
                              .value
                          )
                        }
                      >
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

                        {selectedOrder
                          .orderStatus ===
                          "cancelled" && (
                          <option value="cancelled">
                            Cancelled
                          </option>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="admin-detail-payment-status">
                        Payment Status
                      </label>

                      <select
                        id="admin-detail-payment-status"
                        value={
                          selectedOrder
                            .payment?.status ||
                          "pending"
                        }
                        disabled={
                          busyOrderId ===
                          selectedOrder._id
                        }
                        onChange={(event) =>
                          handlePaymentStatusChange(
                            selectedOrder,
                            event.target
                              .value
                          )
                        }
                      >
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
                    </div>

                    {canCancelOrder(
                      selectedOrder
                    ) && (
                      <button
                        type="button"
                        className="admin-order-detail-cancel"
                        disabled={
                          busyOrderId ===
                          selectedOrder._id
                        }
                        onClick={() =>
                          handleCancelOrder(
                            selectedOrder
                          )
                        }
                      >
                        <FaBan />

                        {busyOrderId ===
                        selectedOrder._id
                          ? "Processing..."
                          : "Cancel Order"}
                      </button>
                    )}
                  </div>
                </section>
              </div>
            )}
          </aside>
        </>
      )}
    </main>
  );
};

export default AdminOrders;