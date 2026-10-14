import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaEye,
  FaFilePdf,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaSearch,
  FaSyncAlt,
  FaTruck,
  FaUser,
} from "react-icons/fa";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";


const ActiveDeliveries = () => {
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
    message,
    setMessage,
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
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);

  const [
    busyOrderId,
    setBusyOrderId,
  ] = useState("");


  /**
   * ============================================================
   * ACTIVE DELIVERY STATUSES
   * ============================================================
   */
  const activeStatuses = [
    "processing",
    "shipped",
    "out_for_delivery",
  ];


  /**
   * ============================================================
   * LOAD ALL ASSIGNED ORDERS
   * ============================================================
   */
  const loadOrders =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              "/delivery/orders"
            );

          setOrders(
            Array.isArray(
              response.data?.orders
            )
              ? response.data.orders
              : []
          );
        } catch (error) {
          setOrders([]);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load active deliveries."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    loadOrders();
  }, [
    loadOrders,
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


  const buildAddress =
    (order) => {
      const address =
        order
          ?.shippingAddress;

      if (!address) {
        return "-";
      }

      return [
        address.addressLine1,
        address.addressLine2,
        address.city,
        address.state,
        address.postalCode,
        address.country,
      ]
        .filter(Boolean)
        .join(", ");
    };


  const getCustomerName =
    (order) => {
      return (
        order?.shippingAddress
          ?.fullName ||
        order?.user?.name ||
        "Customer"
      );
    };


  const getCustomerPhone =
    (order) => {
      return (
        order?.shippingAddress
          ?.phone ||
        order?.user?.phone ||
        "-"
      );
    };


  const getOrderTotal =
    (order) => {
      return Number(
        order?.totalAmount || 0
      );
    };


  /**
   * ============================================================
   * ACTIVE ORDER FILTER
   * ============================================================
   */
  const activeOrders =
    useMemo(
      () => {
        return orders.filter(
          (order) =>
            activeStatuses.includes(
              order.orderStatus
            )
        );
      },
      [
        orders,
      ]
    );


  /**
   * ============================================================
   * SEARCH + STATUS FILTER
   * ============================================================
   */
  const filteredOrders =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        return activeOrders.filter(
          (order) => {
            const matchesStatus =
              !statusFilter ||
              order.orderStatus ===
                statusFilter;

            if (!matchesStatus) {
              return false;
            }

            if (!term) {
              return true;
            }

            const searchable =
              [
                order.orderNumber,
                getCustomerName(
                  order
                ),
                getCustomerPhone(
                  order
                ),
                buildAddress(
                  order
                ),
                order.orderStatus,
                order.payment
                  ?.method,
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(
              term
            );
          }
        );
      },
      [
        activeOrders,
        search,
        statusFilter,
      ]
    );


  /**
   * ============================================================
   * NEXT DELIVERY STATUS
   * ============================================================
   */
  const getNextStatus =
    (status) => {
      const flow = {
        processing:
          "shipped",

        shipped:
          "out_for_delivery",

        out_for_delivery:
          "delivered",
      };

      return (
        flow[status] ||
        ""
      );
    };


  /**
   * ============================================================
   * OPEN ORDER
   * ============================================================
   */
  const openOrder =
    async (
      order
    ) => {
      try {
        setError("");

        const response =
          await api.get(
            `/delivery/orders/${order._id}`
          );

        setSelectedOrder(
          response.data?.order ||
            order
        );
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to load delivery details."
          )
        );
      }
    };


  /**
   * ============================================================
   * ACCEPT DELIVERY
   * ============================================================
   */
  const acceptOrder =
    async (
      order
    ) => {
      try {
        setBusyOrderId(
          order._id
        );

        setError("");
        setMessage("");

        const response =
          await api.patch(
            `/delivery/orders/${order._id}/accept`
          );

        setMessage(
          response.data
            ?.message ||
            "Delivery assignment accepted."
        );

        await loadOrders();

        if (
          selectedOrder?._id ===
          order._id
        ) {
          setSelectedOrder(
            response.data?.order ||
              selectedOrder
          );
        }
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to accept this delivery."
          )
        );
      } finally {
        setBusyOrderId("");
      }
    };


  /**
   * ============================================================
   * UPDATE DELIVERY STATUS
   * ============================================================
   */
  const updateStatus =
    async (
      order
    ) => {
      const nextStatus =
        getNextStatus(
          order.orderStatus
        );

      if (!nextStatus) {
        return;
      }

      try {
        setBusyOrderId(
          order._id
        );

        setError("");
        setMessage("");

        const response =
          await api.patch(
            `/delivery/orders/${order._id}/status`,
            {
              status:
                nextStatus,

              note:
                `Delivery moved to ${formatStatus(
                  nextStatus
                )}.`,
            }
          );

        setMessage(
          response.data
            ?.message ||
            "Delivery status updated successfully."
        );

        await loadOrders();

        if (
          selectedOrder?._id ===
          order._id
        ) {
          setSelectedOrder(
            response.data?.order ||
              selectedOrder
          );
        }
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to update delivery status."
          )
        );
      } finally {
        setBusyOrderId("");
      }
    };


  /**
   * ============================================================
   * DOWNLOAD ACTIVE DELIVERY PDF
   * ============================================================
   */
  const downloadPdf =
    () => {
      if (
        filteredOrders.length ===
        0
      ) {
        setError(
          "There are no active deliveries available to download."
        );

        return;
      }


      const pdf =
        new jsPDF({
          orientation:
            "landscape",

          unit:
            "mm",

          format:
            "a4",
        });


      pdf.setFontSize(
        18
      );

      pdf.text(
        "NovaCart Active Deliveries Report",
        14,
        15
      );


      pdf.setFontSize(
        10
      );

      pdf.text(
        `Generated: ${new Date().toLocaleString(
          "en-IN"
        )}`,
        14,
        22
      );


      pdf.text(
        `Status: ${
          statusFilter
            ? formatStatus(
                statusFilter
              )
            : "All Active Deliveries"
        }`,
        14,
        28
      );


      autoTable(
        pdf,
        {
          startY:
            34,

          head: [
            [
              "Order",
              "Customer",
              "Phone",
              "Address",
              "Items",
              "Amount",
              "Payment",
              "Status",
              "Assigned",
              "Accepted",
            ],
          ],

          body:
            filteredOrders.map(
              (
                order
              ) => [
                order.orderNumber ||
                  order._id,

                getCustomerName(
                  order
                ),

                getCustomerPhone(
                  order
                ),

                buildAddress(
                  order
                ),

                order.totalItems ||
                  order.items
                    ?.length ||
                  0,

                `Rs. ${formatPrice(
                  getOrderTotal(
                    order
                  )
                )}`,

                order.payment
                  ?.method
                  ?.toUpperCase() ||
                  "-",

                formatStatus(
                  order.orderStatus
                ),

                formatDate(
                  order.delivery
                    ?.assignedAt
                ),

                formatDate(
                  order.delivery
                    ?.acceptedAt
                ),
              ]
            ),

          styles: {
            fontSize:
              7,

            cellPadding:
              2,
          },

          columnStyles: {
            3: {
              cellWidth:
                55,
            },
          },
        }
      );


      pdf.save(
        `NovaCart_Active_Deliveries_${Date.now()}.pdf`
      );
    };


  /**
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (
    loading &&
    orders.length ===
      0
  ) {
    return (
      <main className="delivery-page">

        <Loader
          fullPage
          text="Loading active deliveries..."
        />

      </main>
    );
  }


  return (
    <main className="delivery-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="delivery-page-header">

        <div>

          <span className="delivery-page-eyebrow">
            Current Work
          </span>

          <h1>
            Active Deliveries
          </h1>

          <p>
            Focus on deliveries that still
            need action, from processing
            through final delivery.
          </p>

        </div>


        <div className="delivery-page-header-actions">

          <button
            type="button"
            className="delivery-primary-button"
            onClick={
              downloadPdf
            }
          >
            <FaFilePdf />

            Download PDF
          </button>

        </div>

      </section>


      {/* ======================================================
          FEEDBACK
      ====================================================== */}

      {message && (
        <div className="delivery-message success">
          {message}
        </div>
      )}


      {error && (
        <div className="delivery-message error">

          <span>
            {error}
          </span>

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
          FILTERS
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-order-filters">

          <div className="delivery-search-box">

            <FaSearch />

            <input
              type="search"
              placeholder="Search active delivery..."
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
              statusFilter
            }
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value
              )
            }
          >

            <option value="">
              All Active Status
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

          </select>


          <button
            type="button"
            className="delivery-filter-reset"
            onClick={() => {
              setSearch("");
              setStatusFilter("");
            }}
          >
            <FaSyncAlt />

            Reset
          </button>

        </div>

      </section>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="delivery-summary-grid">

        <article className="delivery-summary-card">

          <span>
            Active
          </span>

          <strong>
            {
              activeOrders.length
            }
          </strong>

        </article>


        <article className="delivery-summary-card">

          <span>
            Processing
          </span>

          <strong>
            {
              activeOrders.filter(
                (
                  order
                ) =>
                  order.orderStatus ===
                  "processing"
              ).length
            }
          </strong>

        </article>


        <article className="delivery-summary-card">

          <span>
            Shipped
          </span>

          <strong>
            {
              activeOrders.filter(
                (
                  order
                ) =>
                  order.orderStatus ===
                  "shipped"
              ).length
            }
          </strong>

        </article>


        <article className="delivery-summary-card">

          <span>
            Out for Delivery
          </span>

          <strong>
            {
              activeOrders.filter(
                (
                  order
                ) =>
                  order.orderStatus ===
                  "out_for_delivery"
              ).length
            }
          </strong>

        </article>

      </section>


      {/* ======================================================
          ACTIVE DELIVERY LIST
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Current Assignments
            </span>

            <h2>
              Deliveries Requiring Action
            </h2>

          </div>


          <FaTruck />

        </div>


        {filteredOrders.length >
        0 ? (
          <div className="delivery-active-list">

            {filteredOrders.map(
              (
                order
              ) => {
                const busy =
                  busyOrderId ===
                  order._id;

                const nextStatus =
                  getNextStatus(
                    order.orderStatus
                  );


                return (
                  <article
                    key={
                      order._id
                    }
                    className="delivery-active-card"
                  >

                    {/* HEADER */}

                    <div className="delivery-active-card-header">

                      <div>

                        <span>
                          Order
                        </span>

                        <h3>
                          {order.orderNumber ||
                            order._id}
                        </h3>

                      </div>


                      <span
                        className={`delivery-status delivery-status-${order.orderStatus}`}
                      >
                        {formatStatus(
                          order.orderStatus
                        )}
                      </span>

                    </div>


                    {/* CUSTOMER */}

                    <div className="delivery-active-customer">

                      <div className="delivery-active-customer-main">

                        <FaUser />

                        <div>

                          <span>
                            Customer
                          </span>

                          <strong>
                            {getCustomerName(
                              order
                            )}
                          </strong>

                        </div>

                      </div>


                      <div className="delivery-active-phone">

                        <FaPhoneAlt />

                        <span>
                          {getCustomerPhone(
                            order
                          )}
                        </span>

                      </div>

                    </div>


                    {/* ADDRESS */}

                    <div className="delivery-active-address">

                      <FaMapMarkerAlt />

                      <div>

                        <span>
                          Delivery Address
                        </span>

                        <strong>
                          {buildAddress(
                            order
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* DETAILS */}

                    <div className="delivery-active-details">

                      <div>

                        <span>
                          Items
                        </span>

                        <strong>
                          {order.totalItems ||
                            order.items
                              ?.length ||
                            0}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Amount
                        </span>

                        <strong>
                          ₹
                          {formatPrice(
                            getOrderTotal(
                              order
                            )
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Payment
                        </span>

                        <strong>
                          {order.payment
                            ?.method
                            ?.toUpperCase() ||
                            "-"}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Payment Status
                        </span>

                        <strong>
                          {formatStatus(
                            order.payment
                              ?.status
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* TIMELINE */}

                    <div className="delivery-active-timeline">

                      <div>

                        <span>
                          Assigned
                        </span>

                        <strong>
                          {formatDate(
                            order.delivery
                              ?.assignedAt
                          )}
                        </strong>

                      </div>


                      <div>

                        <span>
                          Accepted
                        </span>

                        <strong>
                          {formatDate(
                            order.delivery
                              ?.acceptedAt
                          )}
                        </strong>

                      </div>

                    </div>


                    {/* NOTE */}

                    {order.delivery
                      ?.deliveryNote && (
                      <div className="delivery-active-note">

                        <span>
                          Delivery Note
                        </span>

                        <p>
                          {
                            order.delivery
                              .deliveryNote
                          }
                        </p>

                      </div>
                    )}


                    {/* ACTIONS */}

                    <div className="delivery-order-actions">

                      <button
                        type="button"
                        className="delivery-secondary-button"
                        onClick={() =>
                          openOrder(
                            order
                          )
                        }
                      >
                        <FaEye />

                        View Details
                      </button>


                      {!order.delivery
                        ?.acceptedAt && (
                        <button
                          type="button"
                          className="delivery-secondary-button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            acceptOrder(
                              order
                            )
                          }
                        >
                          <FaTruck />

                          {busy
                            ? "Processing..."
                            : "Accept Delivery"}
                        </button>
                      )}


                      {nextStatus && (
                        <button
                          type="button"
                          className="delivery-primary-button"
                          disabled={
                            busy
                          }
                          onClick={() =>
                            updateStatus(
                              order
                            )
                          }
                        >
                          <FaTruck />

                          {busy
                            ? "Updating..."
                            : `Mark ${formatStatus(
                                nextStatus
                              )}`}
                        </button>
                      )}

                    </div>

                  </article>
                );
              }
            )}

          </div>
        ) : (
          <div className="delivery-empty-state">

            <FaBoxOpen />

            <h3>
              No active deliveries
            </h3>

            <p>
              You currently have no deliveries
              requiring action.
            </p>

          </div>
        )}

      </section>


      {/* ======================================================
          ORDER DETAILS MODAL
      ====================================================== */}

      {selectedOrder && (
        <div className="delivery-modal-overlay">

          <div className="delivery-order-modal">

            <div className="delivery-modal-header">

              <div>

                <span>
                  Active Delivery
                </span>

                <h2>
                  {selectedOrder
                    .orderNumber ||
                    selectedOrder
                      ._id}
                </h2>

              </div>


              <button
                type="button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                ×
              </button>

            </div>


            <div className="delivery-modal-body">

              <section className="delivery-modal-section">

                <h3>
                  Customer
                </h3>

                <p>
                  <strong>
                    Name:
                  </strong>{" "}
                  {getCustomerName(
                    selectedOrder
                  )}
                </p>

                <p>
                  <strong>
                    Phone:
                  </strong>{" "}
                  {getCustomerPhone(
                    selectedOrder
                  )}
                </p>

                <p>
                  <strong>
                    Address:
                  </strong>{" "}
                  {buildAddress(
                    selectedOrder
                  )}
                </p>

              </section>


              <section className="delivery-modal-section">

                <h3>
                  Products
                </h3>

                <div className="delivery-modal-products">

                  {selectedOrder.items
                    ?.length > 0 ? (
                    selectedOrder.items.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          key={`${item.product?._id || item.product || "product"}-${index}`}
                          className="delivery-modal-product"
                        >

                          <div>

                            <strong>
                              {item.name ||
                                item.product
                                  ?.name ||
                                "Product"}
                            </strong>

                            <span>
                              Quantity:{" "}
                              {item.quantity ||
                                1}
                            </span>

                          </div>


                          <strong>
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

                        </div>
                      )
                    )
                  ) : (
                    <p>
                      Product information is not available.
                    </p>
                  )}

                </div>

              </section>


              <section className="delivery-modal-section">

                <h3>
                  Payment
                </h3>

                <p>
                  <strong>
                    Method:
                  </strong>{" "}
                  {selectedOrder
                    .payment
                    ?.method
                    ?.toUpperCase() ||
                    "-"}
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {formatStatus(
                    selectedOrder
                      .payment
                      ?.status
                  )}
                </p>

                <p>
                  <strong>
                    Amount:
                  </strong>{" "}
                  ₹
                  {formatPrice(
                    getOrderTotal(
                      selectedOrder
                    )
                  )}
                </p>

              </section>


              <section className="delivery-modal-section">

                <h3>
                  Delivery
                </h3>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {formatStatus(
                    selectedOrder
                      .orderStatus
                  )}
                </p>

                <p>
                  <strong>
                    Assigned:
                  </strong>{" "}
                  {formatDate(
                    selectedOrder
                      .delivery
                      ?.assignedAt
                  )}
                </p>

                <p>
                  <strong>
                    Accepted:
                  </strong>{" "}
                  {formatDate(
                    selectedOrder
                      .delivery
                      ?.acceptedAt
                  )}
                </p>

                <p>
                  <strong>
                    Shipped:
                  </strong>{" "}
                  {formatDate(
                    selectedOrder
                      .delivery
                      ?.shippedAt
                  )}
                </p>

                <p>
                  <strong>
                    Out for Delivery:
                  </strong>{" "}
                  {formatDate(
                    selectedOrder
                      .delivery
                      ?.outForDeliveryAt
                  )}
                </p>

                <p>
                  <strong>
                    Delivery Note:
                  </strong>{" "}
                  {selectedOrder
                    .delivery
                    ?.deliveryNote ||
                    "-"}
                </p>

              </section>

            </div>


            <div className="delivery-modal-footer">

              <button
                type="button"
                className="delivery-secondary-button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                Close
              </button>


              {getNextStatus(
                selectedOrder
                  .orderStatus
              ) && (
                <button
                  type="button"
                  className="delivery-primary-button"
                  disabled={
                    busyOrderId ===
                    selectedOrder
                      ._id
                  }
                  onClick={() =>
                    updateStatus(
                      selectedOrder
                    )
                  }
                >
                  <FaTruck />

                  Mark{" "}
                  {formatStatus(
                    getNextStatus(
                      selectedOrder
                        .orderStatus
                    )
                  )}
                </button>
              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
};


export default ActiveDeliveries;