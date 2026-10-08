import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaArrowLeft,
  FaBox,
  FaCalendarAlt,
  FaCheckCircle,
  FaCreditCard,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaReceipt,
  FaShieldAlt,
  FaTimesCircle,
  FaTruck,
  FaUniversity,
} from "react-icons/fa";

import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

const OrderDetails = () => {
  const {
    identifier,
  } = useParams();

  const location =
    useLocation();

  const [
    order,
    setOrder,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    cancelling,
    setCancelling,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState(
    location.state?.justPlaced
      ? "Your order was placed successfully."
      : ""
  );

  /**
   * Customer detail endpoint accepts:
   *
   * MongoDB _id
   * OR
   * NovaCart order number
   *
   * GET /api/orders/:identifier
   */
  const loadOrder =
    useCallback(async () => {
      if (!identifier) {
        setOrder(null);
        setLoading(false);
        setError(
          "Order identifier is missing."
        );

        return;
      }

      try {
        setLoading(true);
        setError("");

        const response =
          await api.get(
            `/orders/${encodeURIComponent(
              identifier
            )}`
          );

        const loadedOrder =
          response.data?.order;

        if (!loadedOrder) {
          throw new Error(
            "Order details were not returned by the server."
          );
        }

        setOrder(
          loadedOrder
        );
      } catch (error) {
        setOrder(null);

        setError(
          getApiErrorMessage(
            error,
            error.message ||
              "Unable to load order details."
          )
        );
      } finally {
        setLoading(false);
      }
    }, [identifier]);

  useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  /**
   * Support:
   *
   * /orders/:identifier#tracking
   *
   * from MyOrders Track Order button.
   */
  useEffect(() => {
    if (
      location.hash !==
        "#tracking" ||
      !order
    ) {
      return;
    }

    const timeout =
      setTimeout(() => {
        document
          .getElementById(
            "tracking"
          )
          ?.scrollIntoView({
            behavior:
              "smooth",
            block: "start",
          });
      }, 250);

    return () =>
      clearTimeout(
        timeout
      );
  }, [
    location.hash,
    order,
  ]);

  const formatDate = (
    value,
    withTime = false
  ) => {
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

    return date.toLocaleString(
      "en-IN",
      withTime
        ? {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        : {
            day: "2-digit",
            month: "short",
            year: "numeric",
          }
    );
  };

  const formatPrice = (
    value
  ) => {
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

  const formatStatus = (
    value
  ) => {
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

  const paymentIcon =
    useMemo(() => {
      const method =
        order?.payment?.method;

      if (method === "upi") {
        return (
          <FaUniversity />
        );
      }

      if (method === "card") {
        return (
          <FaCreditCard />
        );
      }

      return (
        <FaMoneyBillWave />
      );
    }, [order]);

  /**
   * Normal delivery progress sequence.
   *
   * Cancelled is intentionally excluded
   * because cancellation uses a separate
   * state/section.
   */
  const statusSteps = [
    "placed",
    "confirmed",
    "processing",
    "shipped",
    "out_for_delivery",
    "delivered",
  ];

  const currentStatusIndex =
    order
      ? statusSteps.indexOf(
          order.orderStatus
        )
      : -1;

  /**
   * Matches Order.canBeCancelled():
   *
   * placed
   * confirmed
   * processing
   */
  const canCancel =
    Boolean(
      order &&
        [
          "placed",
          "confirmed",
          "processing",
        ].includes(
          order.orderStatus
        )
    );

  const orderItems =
    useMemo(
      () =>
        Array.isArray(
          order?.items
        )
          ? order.items
          : [],
      [order]
    );

  const statusHistory =
    useMemo(
      () =>
        Array.isArray(
          order?.statusHistory
        )
          ? order.statusHistory
          : [],
      [order]
    );

  /**
   * Find the first status-history entry
   * for a particular status.
   */
  const getHistoryEntry = (
    status
  ) => {
    return (
      statusHistory.find(
        (entry) =>
          entry.status ===
          status
      ) || null
    );
  };

  /**
   * PATCH
   * /api/orders/:identifier/cancel
   *
   * This is intentionally PATCH.
   *
   * Admin cancellation uses POST, but
   * customer cancellation uses PATCH.
   */
  const handleCancelOrder =
    async () => {
      if (
        !order ||
        !canCancel ||
        cancelling
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Are you sure you want to cancel this order? Product stock will be restored."
        );

      if (!confirmed) {
        return;
      }

      try {
        setCancelling(true);
        setError("");
        setMessage("");

        const orderIdentifier =
          order.orderNumber ||
          order._id;

        const response =
          await api.patch(
            `/orders/${encodeURIComponent(
              orderIdentifier
            )}/cancel`,
            {
              reason:
                "Cancelled by customer.",
            }
          );

        const cancelledOrder =
          response.data?.order;

        if (!cancelledOrder) {
          throw new Error(
            "Order was cancelled but updated order data was not returned."
          );
        }

        setOrder(
          cancelledOrder
        );

        setMessage(
          response.data?.message ||
            "Order cancelled successfully."
        );

        /**
         * Scroll to tracking section so
         * cancellation result is visible.
         */
        setTimeout(() => {
          document
            .getElementById(
              "tracking"
            )
            ?.scrollIntoView({
              behavior:
                "smooth",
              block:
                "start",
            });
        }, 100);
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            error.message ||
              "Unable to cancel this order."
          )
        );
      } finally {
        setCancelling(
          false
        );
      }
    };

  if (loading) {
    return (
      <main className="order-details-page">
        <Loader
          fullPage
          text="Loading order details..."
        />
      </main>
    );
  }

  if (
    error &&
    !order
  ) {
    return (
      <main className="order-details-page">
        <section className="order-details-error section-spacing">
          <div className="container">
            <div className="order-details-error-card">
              <FaTimesCircle />

              <h1>
                Order Not Available
              </h1>

              <p>
                {error}
              </p>

              <div className="order-details-error-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={
                    loadOrder
                  }
                >
                  Try Again
                </button>

                <Link
                  to="/my-orders"
                  className="primary-button"
                >
                  Back to My Orders
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <main className="order-details-page">
      <section className="order-details-header">
        <div className="container">
          <div className="order-details-header-row">
            <div>
              <Link
                to="/my-orders"
                className="order-details-back"
              >
                <FaArrowLeft />

                Back to My Orders
              </Link>

              <span className="section-eyebrow">
                Order Details
              </span>

              <h1>
                {order.orderNumber ||
                  order._id}
              </h1>

              <p>
                Placed on{" "}
                {formatDate(
                  order.createdAt,
                  true
                )}
              </p>
            </div>

            <div
              className={`order-details-status-badge order-status-${order.orderStatus}`}
            >
              {formatStatus(
                order.orderStatus
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="order-details-main section-spacing">
        <div className="container">
          {message && (
            <div className="order-details-message success">
              <FaCheckCircle />

              <span>
                {message}
              </span>
            </div>
          )}

          {error && (
            <div className="order-details-message error">
              <FaTimesCircle />

              <span>
                {error}
              </span>
            </div>
          )}

          <div className="order-details-layout">
            <div className="order-details-left">
              {/* =============================================
                  ORDER ITEMS
              ============================================== */}

              <section className="order-details-card">
                <div className="order-details-card-heading">
                  <div>
                    <FaReceipt />

                    <div>
                      <h2>
                        Order Items
                      </h2>

                      <p>
                        {Number(
                          order.totalItems ||
                            0
                        )}{" "}
                        item
                        {Number(
                          order.totalItems ||
                            0
                        ) === 1
                          ? ""
                          : "s"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="order-details-items">
                  {orderItems.map(
                    (
                      item,
                      index
                    ) => (
                      <article
                        key={`${item.product?._id || item.product || item.sku || "item"}-${index}`}
                        className="order-details-item"
                      >
                        <div className="order-details-item-image">
                          {item.image ? (
                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.name ||
                                "Product"
                              }
                            />
                          ) : (
                            <span>
                              N
                            </span>
                          )}
                        </div>

                        <div className="order-details-item-info">
                          <h3>
                            {item.name ||
                              "Product"}
                          </h3>

                          {item.sku && (
                            <span>
                              SKU:{" "}
                              {
                                item.sku
                              }
                            </span>
                          )}

                          <span>
                            Quantity:{" "}
                            {Number(
                              item.quantity ||
                                0
                            )}
                          </span>

                          {item.product
                            ?._id && (
                            <Link
                              to={`/products/${
                                item.product
                                  .slug ||
                                item.product
                                  ._id
                              }`}
                              className="order-product-link"
                            >
                              View Product
                            </Link>
                          )}
                        </div>

                        <div className="order-details-item-price">
                          <span>
                            ₹
                            {formatPrice(
                              item.unitPrice
                            )}{" "}
                            each
                          </span>

                          <strong>
                            ₹
                            {formatPrice(
                              item.totalPrice
                            )}
                          </strong>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </section>

              {/* =============================================
                  TRACKING
              ============================================== */}

              <section
                className="order-details-card"
                id="tracking"
              >
                <div className="order-details-card-heading">
                  <div>
                    <FaTruck />

                    <div>
                      <h2>
                        Order Tracking
                      </h2>

                      <p>
                        Follow the progress
                        of your delivery.
                      </p>
                    </div>
                  </div>
                </div>

                {order.orderStatus ===
                "cancelled" ? (
                  <div className="order-cancelled-box">
                    <FaTimesCircle />

                    <div>
                      <strong>
                        Order Cancelled
                      </strong>

                      <p>
                        This order was
                        cancelled on{" "}
                        {formatDate(
                          order.cancelledAt,
                          true
                        )}
                        .
                      </p>

                      {order.cancellationReason && (
                        <p>
                          Reason:{" "}
                          {
                            order.cancellationReason
                          }
                        </p>
                      )}

                      {order.payment
                        ?.status ===
                        "refunded" && (
                        <span>
                          Payment refunded
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="order-tracking-timeline">
                    {statusSteps.map(
                      (
                        status,
                        index
                      ) => {
                        const completed =
                          index <=
                          currentStatusIndex;

                        const historyEntry =
                          getHistoryEntry(
                            status
                          );

                        let statusDate =
                          historyEntry?.changedAt ||
                          null;

                        if (
                          !statusDate &&
                          status ===
                            "delivered" &&
                          order.deliveredAt
                        ) {
                          statusDate =
                            order.deliveredAt;
                        }

                        if (
                          !statusDate &&
                          status ===
                            "placed"
                        ) {
                          statusDate =
                            order.createdAt;
                        }

                        return (
                          <div
                            key={
                              status
                            }
                            className={`order-tracking-step ${
                              completed
                                ? "completed"
                                : ""
                            }`}
                          >
                            <div className="order-tracking-marker">
                              {completed ? (
                                <FaCheckCircle />
                              ) : (
                                <span />
                              )}
                            </div>

                            <div className="order-tracking-content">
                              <strong>
                                {formatStatus(
                                  status
                                )}
                              </strong>

                              <span>
                                {completed &&
                                statusDate
                                  ? formatDate(
                                      statusDate,
                                      true
                                    )
                                  : "Pending"}
                              </span>

                              {historyEntry
                                ?.message && (
                                <p>
                                  {
                                    historyEntry.message
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}

                {order.orderStatus !==
                  "cancelled" &&
                  order.orderStatus !==
                    "delivered" && (
                    <div className="order-estimated-delivery">
                      <FaCalendarAlt />

                      <div>
                        <strong>
                          Estimated Delivery
                        </strong>

                        <span>
                          {formatDate(
                            order.estimatedDeliveryDate
                          )}
                        </span>
                      </div>
                    </div>
                  )}
              </section>

              {/* =============================================
                  SHIPPING ADDRESS
              ============================================== */}

              <section className="order-details-card">
                <div className="order-details-card-heading">
                  <div>
                    <FaMapMarkerAlt />

                    <div>
                      <h2>
                        Shipping Address
                      </h2>

                      <p>
                        Delivery destination
                        for this order.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="order-shipping-address">
                  <strong>
                    {order
                      .shippingAddress
                      ?.fullName ||
                      "-"}
                  </strong>

                  <p>
                    {order
                      .shippingAddress
                      ?.addressLine1 ||
                      "-"}
                  </p>

                  {order
                    .shippingAddress
                    ?.addressLine2 && (
                    <p>
                      {
                        order
                          .shippingAddress
                          .addressLine2
                      }
                    </p>
                  )}

                  <p>
                    {[
                      order
                        .shippingAddress
                        ?.city,

                      order
                        .shippingAddress
                        ?.state,

                      order
                        .shippingAddress
                        ?.postalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </p>

                  <p>
                    {order
                      .shippingAddress
                      ?.country ||
                      "India"}
                  </p>

                  <span>
                    Phone:{" "}
                    {order
                      .shippingAddress
                      ?.phone ||
                      "-"}
                  </span>
                </div>
              </section>

              {/* =============================================
                  CUSTOMER NOTE
              ============================================== */}

              {order.customerNote && (
                <section className="order-details-card">
                  <div className="order-details-card-heading">
                    <div>
                      <FaBox />

                      <div>
                        <h2>
                          Order Note
                        </h2>

                        <p>
                          Your delivery
                          instruction.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="order-customer-note">
                    {
                      order.customerNote
                    }
                  </p>
                </section>
              )}
            </div>

            {/* ===============================================
                RIGHT SIDE
            ================================================ */}

            <aside className="order-details-right">
              {/* =============================================
                  ORDER SUMMARY
              ============================================== */}

              <div className="order-details-summary-card">
                <h2>
                  Order Summary
                </h2>

                <div className="order-details-summary-row">
                  <span>
                    Items
                  </span>

                  <strong>
                    {Number(
                      order.totalItems ||
                        0
                    )}
                  </strong>
                </div>

                <div className="order-details-summary-row">
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    ₹
                    {formatPrice(
                      order.subtotal
                    )}
                  </strong>
                </div>

                <div className="order-details-summary-row">
                  <span>
                    Shipping
                  </span>

                  <strong>
                    {Number(
                      order.shippingCharge ||
                        0
                    ) === 0
                      ? "FREE"
                      : `₹${formatPrice(
                          order.shippingCharge
                        )}`}
                  </strong>
                </div>

                <div className="order-details-summary-row">
                  <span>
                    Discount
                  </span>

                  <strong>
                    - ₹
                    {formatPrice(
                      order.discountAmount
                    )}
                  </strong>
                </div>

                <div className="order-details-summary-row">
                  <span>
                    Tax
                  </span>

                  <strong>
                    ₹
                    {formatPrice(
                      order.taxAmount
                    )}
                  </strong>
                </div>

                <div className="order-details-summary-divider" />

                <div className="order-details-summary-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    ₹
                    {formatPrice(
                      order.totalAmount
                    )}
                  </strong>
                </div>
              </div>

              {/* =============================================
                  PAYMENT
              ============================================== */}

              <div className="order-details-payment-card">
                <div className="order-details-payment-heading">
                  <div className="order-payment-icon">
                    {paymentIcon}
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
                </div>

                <div className="order-details-payment-status">
                  <span>
                    Payment Status
                  </span>

                  <strong
                    className={`payment-status payment-status-${
                      order.payment
                        ?.status ||
                      "pending"
                    }`}
                  >
                    {formatStatus(
                      order.payment
                        ?.status
                    )}
                  </strong>
                </div>

                {order.payment
                  ?.transactionId && (
                  <div className="order-details-payment-reference">
                    <span>
                      Transaction ID
                    </span>

                    <strong>
                      {
                        order.payment
                          .transactionId
                      }
                    </strong>
                  </div>
                )}

                {order.payment
                  ?.paidAt && (
                  <div className="order-details-payment-reference">
                    <span>
                      Paid On
                    </span>

                    <strong>
                      {formatDate(
                        order.payment
                          .paidAt,
                        true
                      )}
                    </strong>
                  </div>
                )}

                {order.payment
                  ?.refundedAt && (
                  <div className="order-details-payment-reference">
                    <span>
                      Refunded On
                    </span>

                    <strong>
                      {formatDate(
                        order.payment
                          .refundedAt,
                        true
                      )}
                    </strong>
                  </div>
                )}

                {order.payment
                  ?.status ===
                  "refunded" && (
                  <div className="order-payment-refund-note">
                    <FaCheckCircle />

                    <span>
                      Demo payment has been
                      marked as refunded.
                    </span>
                  </div>
                )}
              </div>

              {/* =============================================
                  SECURITY
              ============================================== */}

              <div className="order-details-security-card">
                <FaShieldAlt />

                <div>
                  <strong>
                    Secure Order
                  </strong>

                  <span>
                    Order details are visible
                    only to your NovaCart
                    account.
                  </span>
                </div>
              </div>

              {/* =============================================
                  CUSTOMER CANCELLATION
              ============================================== */}

              {canCancel && (
                <div className="order-details-cancel-card">
                  <h3>
                    Need to cancel?
                  </h3>

                  <p>
                    Orders can be cancelled
                    while they are placed,
                    confirmed, or processing.
                  </p>

                  <button
                    type="button"
                    onClick={
                      handleCancelOrder
                    }
                    disabled={
                      cancelling
                    }
                  >
                    <FaTimesCircle />

                    {cancelling
                      ? "Cancelling..."
                      : "Cancel Order"}
                  </button>
                </div>
              )}

              {!canCancel &&
                ![
                  "cancelled",
                  "delivered",
                ].includes(
                  order.orderStatus
                ) && (
                  <div className="order-details-cancel-card disabled">
                    <h3>
                      Cancellation Closed
                    </h3>

                    <p>
                      This order has already
                      entered shipping and can
                      no longer be cancelled
                      from your account.
                    </p>
                  </div>
                )}

              {order.orderStatus ===
                "cancelled" && (
                <div className="order-details-cancel-card cancelled">
                  <h3>
                    Order Cancelled
                  </h3>

                  <p>
                    {order.cancellationReason ||
                      "This order has been cancelled."}
                  </p>

                  <span>
                    {formatDate(
                      order.cancelledAt,
                      true
                    )}
                  </span>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default OrderDetails;