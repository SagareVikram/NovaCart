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
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    deliveryAgents,
    setDeliveryAgents,
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
    message,
    setMessage,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    orderStatus,
    setOrderStatus,
  ] = useState("");

  const [
    paymentStatus,
    setPaymentStatus,
  ] = useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("");

  const [
    sort,
    setSort,
  ] = useState(
    "newest"
  );

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

  const [
    busyOrderId,
    setBusyOrderId,
  ] = useState("");

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    detailsLoading,
    setDetailsLoading,
  ] = useState(false);

  const [
    detailsError,
    setDetailsError,
  ] = useState("");


  /**
   * ============================================================
   * LOAD DELIVERY AGENTS
   * ============================================================
   */
  const loadDeliveryAgents =
    useCallback(
      async () => {
        try {
          const response =
            await api.get(
              "/admin/delivery-agents?status=active&limit=100"
            );

          setDeliveryAgents(
            Array.isArray(
              response.data?.agents
            )
              ? response.data.agents
              : []
          );
        } catch (error) {
          console.error(
            "Unable to load delivery agents:",
            error
          );

          setDeliveryAgents([]);
        }
      },
      []
    );


  /**
   * ============================================================
   * LOAD ORDERS
   * ============================================================
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

          if (sort) {
            params.set(
              "sort",
              sort
            );
          }

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (
            orderStatus
          ) {
            params.set(
              "status",
              orderStatus
            );
          }

          if (
            paymentStatus
          ) {
            params.set(
              "paymentStatus",
              paymentStatus
            );
          }

          if (
            paymentMethod
          ) {
            params.set(
              "paymentMethod",
              paymentMethod
            );
          }

          const response =
            await api.get(
              `/admin/orders?${params.toString()}`
            );

          setOrders(
            Array.isArray(
              response.data?.orders
            )
              ? response.data.orders
              : []
          );

          setPagination(
            response.data?.pagination ||
              {
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
      },
      [
        page,
        sort,
        search,
        orderStatus,
        paymentStatus,
        paymentMethod,
      ]
    );


  /**
   * ============================================================
   * INITIAL DELIVERY AGENT LOAD
   * ============================================================
   */
  useEffect(() => {
    loadDeliveryAgents();
  }, [
    loadDeliveryAgents,
  ]);


  /**
   * ============================================================
   * DEBOUNCED ORDER LOAD
   * ============================================================
   */
  useEffect(() => {
    const timeout =
      setTimeout(
        () => {
          loadOrders();
        },
        250
      );

    return () => {
      clearTimeout(
        timeout
      );
    };
  }, [
    loadOrders,
  ]);


  /**
   * Reset page on filters.
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
   * Prevent page background scrolling
   * while order details are open.
   */
  useEffect(() => {
    if (
      selectedOrder
    ) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        "";
    }

    return () => {
      document.body.style.overflow =
        "";
    };
  }, [
    selectedOrder,
  ]);


  /**
   * ============================================================
   * FORMATTERS
   * ============================================================
   */

  const formatPrice =
    (value) => {
      return Number(
        value || 0
      ).toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
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


  /**
   * ============================================================
   * PAGE SUMMARY
   * ============================================================
   */

  const pendingCount =
    useMemo(
      () => {
        return orders.filter(
          (order) =>
            [
              "placed",
              "confirmed",
              "processing",
            ].includes(
              order.orderStatus
            )
        ).length;
      },
      [orders]
    );


  const deliveredCount =
    useMemo(
      () => {
        return orders.filter(
          (order) =>
            order.orderStatus ===
            "delivered"
        ).length;
      },
      [orders]
    );


  const paidCount =
    useMemo(
      () => {
        return orders.filter(
          (order) =>
            order.payment
              ?.status ===
            "paid"
        ).length;
      },
      [orders]
    );


  /**
   * ============================================================
   * HELPERS
   * ============================================================
   */

  const resetFeedback =
    () => {
      setError("");
      setMessage("");
    };


  const resetFilters =
    () => {
      setSearch("");
      setOrderStatus("");
      setPaymentStatus("");
      setPaymentMethod("");
      setSort("newest");
      setPage(1);
    };


  const getDeliveryAgentId =
    (order) => {
      const agent =
        order?.delivery
          ?.agent;

      if (!agent) {
        return "";
      }

      if (
        typeof agent ===
        "string"
      ) {
        return agent;
      }

      return agent._id || "";
    };


  const getDeliveryAgent =
    (order) => {
      const agentId =
        getDeliveryAgentId(
          order
        );

      if (!agentId) {
        return null;
      }

      const populatedAgent =
        order?.delivery
          ?.agent;

      if (
        populatedAgent &&
        typeof populatedAgent ===
          "object" &&
        populatedAgent.name
      ) {
        return populatedAgent;
      }

      return (
        deliveryAgents.find(
          (agent) =>
            agent._id ===
            agentId
        ) || null
      );
    };


  /**
   * ============================================================
   * REFRESH SINGLE ORDER
   * ============================================================
   */
  const refreshSelectedOrder =
    async (
      orderId
    ) => {
      if (!orderId) {
        return;
      }

      try {
        setDetailsError("");

        const response =
          await api.get(
            `/admin/orders/${orderId}`
          );

        setSelectedOrder(
          response.data?.order ||
            null
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
   * ============================================================
   * OPEN ORDER DETAILS
   * ============================================================
   */
  const openOrderDetails =
    async (
      order
    ) => {
      if (!order?._id) {
        setError(
          "Unable to open this order because its order ID is missing."
        );

        return;
      }

      try {
        setDetailsLoading(
          true
        );

        setDetailsError("");

        setSelectedOrder(
          order
        );

        const response =
          await api.get(
            `/admin/orders/${order._id}`
          );

        setSelectedOrder(
          response.data?.order ||
            order
        );
      } catch (error) {
        setDetailsError(
          getApiErrorMessage(
            error,
            "Unable to load order details."
          )
        );
      } finally {
        setDetailsLoading(
          false
        );
      }
    };


  const closeOrderDetails =
    () => {
      setSelectedOrder(
        null
      );

      setDetailsError(
        ""
      );
    };


  /**
   * ============================================================
   * UPDATE ORDER STATUS
   * ============================================================
   */
  const handleOrderStatusChange =
    async (
      order,
      nextStatus
    ) => {
      if (
        !order?._id ||
        !nextStatus ||
        nextStatus ===
          order.orderStatus
      ) {
        return;
      }

      if (
        nextStatus ===
        "cancelled"
      ) {
        setError(
          "Use the Cancel Order button to cancel an order."
        );

        return;
      }

      resetFeedback();

      try {
        setBusyOrderId(
          order._id
        );

        const response =
          await api.patch(
            `/admin/orders/${order._id}/status`,
            {
              status:
                nextStatus,

              message:
                `Order status changed to ${formatStatus(
                  nextStatus
                )} by administrator.`,
            }
          );

        setMessage(
          response.data
            ?.message ||
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
   * ============================================================
   * UPDATE PAYMENT STATUS
   * ============================================================
   */
  const handlePaymentStatusChange =
    async (
      order,
      nextStatus
    ) => {
      if (
        !order?._id ||
        !nextStatus ||
        nextStatus ===
          order.payment
            ?.status
      ) {
        return;
      }

      resetFeedback();

      try {
        setBusyOrderId(
          order._id
        );

        const response =
          await api.patch(
            `/admin/orders/${order._id}/payment`,
            {
              status:
                nextStatus,
            }
          );

        setMessage(
          response.data
            ?.message ||
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
   * ============================================================
   * ASSIGN DELIVERY AGENT
   * ============================================================
   *
   * Order must already be:
   *
   * processing
   * shipped
   * out_for_delivery
   */
  const handleAssignDeliveryAgent =
    async (
      order,
      agentId
    ) => {
      if (
        !order?._id ||
        !agentId
      ) {
        return;
      }

      if (
        ![
          "processing",
          "shipped",
          "out_for_delivery",
        ].includes(
          order.orderStatus
        )
      ) {
        setError(
          "Move this order to Processing before assigning a delivery agent."
        );

        return;
      }

      const agent =
        deliveryAgents.find(
          (item) =>
            item._id ===
            agentId
        );

      if (
        agent &&
        !agent
          .deliveryAgentProfile
          ?.isAvailable
      ) {
        setError(
          `${agent.name} is currently unavailable.`
        );

        return;
      }

      resetFeedback();

      try {
        setBusyOrderId(
          order._id
        );

        const response =
          await api.patch(
            `/admin/orders/${order._id}/delivery-agent`,
            {
              agentId,
            }
          );

        setMessage(
          response.data
            ?.message ||
            "Delivery agent assigned successfully."
        );

        await Promise.all([
          loadOrders(),
          loadDeliveryAgents(),
        ]);

        if (
          selectedOrder?._id ===
          order._id
        ) {
          if (
            response.data
              ?.order
          ) {
            setSelectedOrder(
              response.data
                .order
            );
          } else {
            await refreshSelectedOrder(
              order._id
            );
          }
        }
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to assign delivery agent."
          )
        );
      } finally {
        setBusyOrderId("");
      }
    };


  /**
   * ============================================================
   * REMOVE DELIVERY AGENT
   * ============================================================
   */
  const handleRemoveDeliveryAgent =
    async (
      order
    ) => {
      if (
        !order?._id
      ) {
        return;
      }

      const currentAgent =
        getDeliveryAgent(
          order
        );

      const confirmed =
        window.confirm(
          `Remove ${
            currentAgent?.name ||
            "the delivery agent"
          } from order ${
            order.orderNumber ||
            order._id
          }?`
        );

      if (!confirmed) {
        return;
      }

      resetFeedback();

      try {
        setBusyOrderId(
          order._id
        );

        const response =
          await api.delete(
            `/admin/orders/${order._id}/delivery-agent`
          );

        setMessage(
          response.data
            ?.message ||
            "Delivery agent removed successfully."
        );

        await Promise.all([
          loadOrders(),
          loadDeliveryAgents(),
        ]);

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
            "Unable to remove delivery agent."
          )
        );
      } finally {
        setBusyOrderId("");
      }
    };


  /**
   * ============================================================
   * CANCEL ORDER
   * ============================================================
   */
  const handleCancelOrder =
    async (
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
        setBusyOrderId(
          order._id
        );

        const response =
          await api.post(
            `/admin/orders/${order._id}/cancel`,
            {
              reason:
                "Cancelled by administrator.",
            }
          );

        setMessage(
          response.data
            ?.message ||
            "Order cancelled successfully."
        );

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
   * ============================================================
   * ORDER VALUE HELPERS
   * ============================================================
   */

  const getSubtotal =
    (order) => {
      return Number(
        order?.subtotal || 0
      );
    };


  const getShippingCharge =
    (order) => {
      return Number(
        order
          ?.shippingCharge || 0
      );
    };


  const getDiscountAmount =
    (order) => {
      return Number(
        order
          ?.discountAmount || 0
      );
    };


  const getTaxAmount =
    (order) => {
      return Number(
        order?.taxAmount || 0
      );
    };


  const getOrderTotal =
    (order) => {
      return Number(
        order
          ?.totalAmount || 0
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

      if (
        item?.image?.url
      ) {
        return item.image.url;
      }

      return (
        item?.product
          ?.images?.[0]?.url ||
        ""
      );
    };


  const getItemName =
    (item) => {
      return (
        item?.name ||
        item?.product?.name ||
        "Product"
      );
    };


  const canCancelOrder =
    (order) => {
      return ![
        "delivered",
        "cancelled",
      ].includes(
        order?.orderStatus
      );
    };


  const canChangeOrderStatus =
    (order) => {
      return ![
        "delivered",
        "cancelled",
      ].includes(
        order?.orderStatus
      );
    };


  const canAssignDeliveryAgent =
    (order) => {
      return [
        "processing",
        "shipped",
        "out_for_delivery",
      ].includes(
        order?.orderStatus
      );
    };


  /**
   * ============================================================
   * LOADING
   * ============================================================
   */
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

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-page-header">

        <div>

          <span className="admin-eyebrow">
            Order Management
          </span>

          <h1>
            Orders
          </h1>

          <p>
            Review customer orders,
            manage payment and fulfilment,
            and assign processing orders
            to NovaCart delivery agents.
          </p>

        </div>

      </div>


      {/* ======================================================
          FEEDBACK
      ====================================================== */}

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

            <p>
              {error}
            </p>

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


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="admin-order-summary-grid">

        <article className="admin-mini-stat">

          <span>
            Total Orders
          </span>

          <strong>
            {
              pagination
                .totalOrders
            }
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


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <section className="admin-card">

        <div className="admin-order-filters">

          <div className="admin-search-box">

            <FaSearch />

            <input
              type="search"
              placeholder="Search order, customer, email..."
              value={
                search
              }
              onChange={(event) =>
                setSearch(
                  event.target
                    .value
                )
              }
            />

          </div>


          <select
            value={
              orderStatus
            }
            onChange={(event) =>
              setOrderStatus(
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
              paymentStatus
            }
            onChange={(event) =>
              setPaymentStatus(
                event.target
                  .value
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
            value={
              paymentMethod
            }
            onChange={(event) =>
              setPaymentMethod(
                event.target
                  .value
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
            value={
              sort
            }
            onChange={(event) =>
              setSort(
                event.target
                  .value
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
            onClick={
              resetFilters
            }
          >
            <FaSyncAlt />

            Reset
          </button>

        </div>

      </section>


      {/* ======================================================
          ORDER LIST
      ====================================================== */}

      <section className="admin-card">

        <div className="admin-card-header">

          <div>

            <span className="admin-card-eyebrow">
              Customer Orders
            </span>

            <h2>
              Order List
            </h2>

          </div>


          <span className="admin-result-count">
            {
              pagination
                .totalOrders
            }{" "}
            total
          </span>

        </div>


        {orders.length >
        0 ? (
          <>

            <div className="admin-table-wrap">

              <table className="admin-table admin-orders-table">

                <thead>

                  <tr>
                    <th>
                      Order
                    </th>

                    <th>
                      Customer
                    </th>

                    <th>
                      Items
                    </th>

                    <th>
                      Amount
                    </th>

                    <th>
                      Payment
                    </th>

                    <th>
                      Order Status
                    </th>

                    <th>
                      Delivery Agent
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>

                </thead>


                <tbody>

                  {orders.map(
                    (order) => {
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

                      const assignedAgent =
                        getDeliveryAgent(
                          order
                        );

                      const assignedAgentId =
                        getDeliveryAgentId(
                          order
                        );

                      const canAssign =
                        canAssignDeliveryAgent(
                          order
                        );


                      return (
                        <tr
                          key={
                            order._id
                          }
                        >

                          {/* ORDER */}

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


                          {/* CUSTOMER */}

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


                          {/* ITEMS */}

                          <td>

                            <strong>
                              {order.totalItems ||
                                order.items
                                  ?.length ||
                                0}
                            </strong>

                          </td>


                          {/* AMOUNT */}

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


                          {/* PAYMENT */}

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
                                onChange={(event) =>
                                  handlePaymentStatusChange(
                                    order,
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  isBusy
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

                          </td>


                          {/* ORDER STATUS */}

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
                                onChange={(event) =>
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


                          {/* DELIVERY AGENT */}

                          <td>

                            <div className="admin-delivery-assignment-cell">

                              {assignedAgent ? (
                                <div className="admin-assigned-agent">

                                  <strong>
                                    {
                                      assignedAgent
                                        .name
                                    }
                                  </strong>

                                  <span>
                                    {assignedAgent
                                      .deliveryAgentProfile
                                      ?.employeeId ||
                                      "Delivery Agent"}
                                  </span>

                                </div>
                              ) : (
                                <span className="admin-unassigned-label">
                                  Not Assigned
                                </span>
                              )}


                              {canAssign ? (
                                <select
                                  value={
                                    assignedAgentId
                                  }
                                  disabled={
                                    isBusy
                                  }
                                  onChange={(event) => {
                                    const agentId =
                                      event.target
                                        .value;

                                    if (
                                      agentId
                                    ) {
                                      handleAssignDeliveryAgent(
                                        order,
                                        agentId
                                      );
                                    }
                                  }}
                                >
                                  <option value="">
                                    Select Agent
                                  </option>

                                  {deliveryAgents.map(
                                    (agent) => {
                                      const available =
                                        Boolean(
                                          agent
                                            .deliveryAgentProfile
                                            ?.isAvailable
                                        );

                                      const isCurrent =
                                        agent._id ===
                                        assignedAgentId;

                                      return (
                                        <option
                                          key={
                                            agent._id
                                          }
                                          value={
                                            agent._id
                                          }
                                          disabled={
                                            !available &&
                                            !isCurrent
                                          }
                                        >
                                          {agent.name}
                                          {" - "}
                                          {agent
                                            .deliveryAgentProfile
                                            ?.employeeId ||
                                            "Agent"}
                                          {!available
                                            ? " (Unavailable)"
                                            : ""}
                                        </option>
                                      );
                                    }
                                  )}

                                </select>
                              ) : (
                                ![
                                  "delivered",
                                  "cancelled",
                                ].includes(
                                  order.orderStatus
                                ) && (
                                  <small className="admin-delivery-help">
                                    Set Processing first
                                  </small>
                                )
                              )}


                              {assignedAgentId &&
                                order.orderStatus !==
                                  "delivered" && (
                                  <button
                                    type="button"
                                    className="admin-remove-agent-button"
                                    disabled={
                                      isBusy
                                    }
                                    onClick={() =>
                                      handleRemoveDeliveryAgent(
                                        order
                                      )
                                    }
                                  >
                                    Remove
                                  </button>
                                )}

                            </div>

                          </td>


                          {/* DATE */}

                          <td>
                            {formatDate(
                              order.createdAt
                            )}
                          </td>


                          {/* ACTIONS */}

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
                                title="Move to processing"
                                disabled={
                                  isBusy ||
                                  ![
                                    "placed",
                                    "confirmed",
                                  ].includes(
                                    order.orderStatus
                                  )
                                }
                                onClick={() =>
                                  handleOrderStatusChange(
                                    order,
                                    "processing"
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
                    }
                  )}

                </tbody>

              </table>

            </div>


            {/* PAGINATION */}

            {pagination.totalPages >
              1 && (
              <div className="admin-pagination">

                <button
                  type="button"
                  disabled={
                    !pagination.hasPreviousPage
                  }
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
                >
                  Previous
                </button>


                <div>

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
                  disabled={
                    !pagination.hasNextPage
                  }
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
              Customer orders matching
              the selected filters will
              appear here.
            </p>

            <button
              type="button"
              className="admin-primary-button"
              onClick={
                resetFilters
              }
            >
              Reset Filters
            </button>

          </div>
        )}

      </section>


      {/* ======================================================
          ORDER DETAILS PANEL
      ====================================================== */}

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
                  {selectedOrder
                    .orderNumber ||
                    "Order"}
                </h2>

                <small>
                  {formatDate(
                    selectedOrder
                      .createdAt
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
                        {
                          detailsError
                        }
                      </p>

                    </div>


                    <button
                      type="button"
                      onClick={() =>
                        refreshSelectedOrder(
                          selectedOrder
                            ._id
                        )
                      }
                    >
                      Retry
                    </button>

                  </div>
                )}


                {/* STATUS */}

                <section className="admin-order-detail-statuses">

                  <div>

                    <span>
                      Order Status
                    </span>

                    <strong
                      className={`admin-status admin-status-${selectedOrder.orderStatus}`}
                    >
                      {formatStatus(
                        selectedOrder
                          .orderStatus
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
                          .payment
                          ?.status ||
                        "pending"
                      }`}
                    >
                      {formatStatus(
                        selectedOrder
                          .payment
                          ?.status
                      )}
                    </strong>

                  </div>

                </section>


                {/* CUSTOMER */}

                <section className="admin-order-detail-section">

                  <div className="admin-order-detail-title">

                    <FaUser />

                    <h3>
                      Customer
                    </h3>

                  </div>


                  <div className="admin-order-detail-info">

                    <div>

                      <span>
                        Name
                      </span>

                      <strong>
                        {selectedOrder
                          .user?.name ||
                          selectedOrder
                            .shippingAddress
                            ?.fullName ||
                          "-"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Email
                      </span>

                      <strong>
                        {selectedOrder
                          .user?.email ||
                          "-"}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Phone
                      </span>

                      <strong>
                        {selectedOrder
                          .shippingAddress
                          ?.phone ||
                          selectedOrder
                            .user
                            ?.phone ||
                          "-"}
                      </strong>

                    </div>

                  </div>

                </section>


                {/* SHIPPING */}

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


                {/* PRODUCTS */}

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
                        No product details
                        are available for
                        this order.
                      </p>
                    )}

                  </div>

                </section>


                {/* DELIVERY AGENT */}

                <section className="admin-order-detail-section">

                  <div className="admin-order-detail-title">

                    <FaTruck />

                    <h3>
                      Delivery Agent
                    </h3>

                  </div>


                  {getDeliveryAgent(
                    selectedOrder
                  ) ? (
                    <div className="admin-order-detail-info">

                      <div>

                        <span>
                          Agent
                        </span>

                        <strong>
                          {
                            getDeliveryAgent(
                              selectedOrder
                            )?.name
                          }
                        </strong>

                      </div>


                      <div>

                        <span>
                          Employee ID
                        </span>

                        <strong>
                          {getDeliveryAgent(
                            selectedOrder
                          )
                            ?.deliveryAgentProfile
                            ?.employeeId ||
                            "-"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Phone
                        </span>

                        <strong>
                          {getDeliveryAgent(
                            selectedOrder
                          )?.phone ||
                            "-"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Assigned At
                        </span>

                        <strong>
                          {formatDate(
                            selectedOrder
                              .delivery
                              ?.assignedAt
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Accepted At
                        </span>

                        <strong>
                          {formatDate(
                            selectedOrder
                              .delivery
                              ?.acceptedAt
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Delivery Note
                        </span>

                        <strong>
                          {selectedOrder
                            .delivery
                            ?.deliveryNote ||
                            "-"}
                        </strong>

                      </div>

                    </div>
                  ) : (
                    <p className="admin-order-note">
                      No delivery agent is
                      currently assigned.
                    </p>
                  )}


                  {canAssignDeliveryAgent(
                    selectedOrder
                  ) && (
                    <div className="admin-order-delivery-controls">

                      <div className="form-group">

                        <label htmlFor="admin-detail-delivery-agent">
                          Assign / Reassign Agent
                        </label>


                        <select
                          id="admin-detail-delivery-agent"
                          value={
                            getDeliveryAgentId(
                              selectedOrder
                            )
                          }
                          disabled={
                            busyOrderId ===
                            selectedOrder
                              ._id
                          }
                          onChange={(event) => {
                            const agentId =
                              event.target
                                .value;

                            if (
                              agentId
                            ) {
                              handleAssignDeliveryAgent(
                                selectedOrder,
                                agentId
                              );
                            }
                          }}
                        >

                          <option value="">
                            Select Delivery Agent
                          </option>


                          {deliveryAgents.map(
                            (agent) => {
                              const available =
                                Boolean(
                                  agent
                                    .deliveryAgentProfile
                                    ?.isAvailable
                                );

                              const isCurrent =
                                agent._id ===
                                getDeliveryAgentId(
                                  selectedOrder
                                );

                              return (
                                <option
                                  key={
                                    agent._id
                                  }
                                  value={
                                    agent._id
                                  }
                                  disabled={
                                    !available &&
                                    !isCurrent
                                  }
                                >
                                  {agent.name}
                                  {" - "}
                                  {agent
                                    .deliveryAgentProfile
                                    ?.employeeId ||
                                    "Agent"}
                                  {!available
                                    ? " (Unavailable)"
                                    : ""}
                                </option>
                              );
                            }
                          )}

                        </select>

                      </div>


                      {getDeliveryAgentId(
                        selectedOrder
                      ) && (
                        <button
                          type="button"
                          className="admin-order-detail-cancel"
                          disabled={
                            busyOrderId ===
                            selectedOrder
                              ._id
                          }
                          onClick={() =>
                            handleRemoveDeliveryAgent(
                              selectedOrder
                            )
                          }
                        >
                          Remove Delivery Agent
                        </button>
                      )}

                    </div>
                  )}

                </section>


                {/* PAYMENT */}

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
                          .payment
                          ?.method
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
                            .payment
                            ?.status
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
                            .payment
                            ?.paidAt
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


                {/* SUMMARY */}

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


                {/* CUSTOMER NOTE */}

                {selectedOrder
                  .customerNote && (
                  <section className="admin-order-detail-section">

                    <div className="admin-order-detail-title">

                      <h3>
                        Customer Note
                      </h3>

                    </div>


                    <p className="admin-order-note">
                      {
                        selectedOrder
                          .customerNote
                      }
                    </p>

                  </section>
                )}


                {/* CANCELLATION */}

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


                {/* UPDATE ORDER */}

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
                          selectedOrder
                            .orderStatus
                        }
                        disabled={
                          busyOrderId ===
                            selectedOrder
                              ._id ||
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
                            .payment
                            ?.status ||
                          "pending"
                        }
                        disabled={
                          busyOrderId ===
                          selectedOrder
                            ._id
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
                          selectedOrder
                            ._id
                        }
                        onClick={() =>
                          handleCancelOrder(
                            selectedOrder
                          )
                        }
                      >
                        <FaBan />

                        {busyOrderId ===
                        selectedOrder
                          ._id
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