import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaDownload,
  FaEye,
  FaFileCsv,
  FaFilePdf,
  FaMapMarkerAlt,
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


const AssignedOrders = () => {
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
   * LOAD ASSIGNED ORDERS
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

          if (
            statusFilter
          ) {
            params.set(
              "status",
              statusFilter
            );
          }

          const query =
            params.toString();

          const response =
            await api.get(
              query
                ? `/delivery/orders?${query}`
                : "/delivery/orders"
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
              "Unable to load assigned orders."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        statusFilter,
      ]
    );


  useEffect(() => {
    loadOrders();
  }, [
    loadOrders,
  ]);


  /**
   * ============================================================
   * HELPERS
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
   * SEARCH FILTER
   * ============================================================
   */
  const filteredOrders =
    useMemo(
      () => {
        const term =
          search
            .trim()
            .toLowerCase();

        if (!term) {
          return orders;
        }

        return orders.filter(
          (order) => {
            const searchableText =
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

            return searchableText.includes(
              term
            );
          }
        );
      },
      [
        orders,
        search,
      ]
    );


  /**
   * ============================================================
   * OPEN ORDER DETAILS
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
            "Unable to load order details."
          )
        );
      }
    };


  /**
   * ============================================================
   * ACCEPT ORDER
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
            "Order assignment accepted."
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
            "Unable to accept this order."
          )
        );
      } finally {
        setBusyOrderId("");
      }
    };


  /**
   * ============================================================
   * NEXT STATUS
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
   * UPDATE STATUS
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
                `Order marked as ${formatStatus(
                  nextStatus
                )} by delivery agent.`,
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
   * PDF REPORT
   * ============================================================
   */
  const downloadPdf =
    () => {
      if (
        filteredOrders.length ===
        0
      ) {
        setError(
          "There are no orders available to download."
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
        "NovaCart Delivery Agent - Assigned Orders Report",
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
        `Status Filter: ${
          statusFilter
            ? formatStatus(
                statusFilter
              )
            : "All"
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
              ]
            ),

          styles: {
            fontSize:
              7,

            cellPadding:
              2,
          },

          headStyles: {
            fontStyle:
              "bold",
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
        `NovaCart_Assigned_Orders_${Date.now()}.pdf`
      );
    };


  /**
   * ============================================================
   * CSV REPORT
   * ============================================================
   */
  const downloadCsv =
    () => {
      if (
        filteredOrders.length ===
        0
      ) {
        setError(
          "There are no orders available to download."
        );

        return;
      }


      const headers = [
        "Order Number",
        "Customer Name",
        "Phone",
        "Address",
        "Total Items",
        "Order Amount",
        "Payment Method",
        "Payment Status",
        "Order Status",
        "Assigned At",
        "Accepted At",
        "Shipped At",
        "Out For Delivery At",
        "Delivered At",
        "Delivery Note",
      ];


      const rows =
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

            getOrderTotal(
              order
            ),

            order.payment
              ?.method ||
              "",

            order.payment
              ?.status ||
              "",

            order.orderStatus ||
              "",

            formatDate(
              order.delivery
                ?.assignedAt
            ),

            formatDate(
              order.delivery
                ?.acceptedAt
            ),

            formatDate(
              order.delivery
                ?.shippedAt
            ),

            formatDate(
              order.delivery
                ?.outForDeliveryAt
            ),

            formatDate(
              order.deliveredAt
            ),

            order.delivery
              ?.deliveryNote ||
              "",
          ]
        );


      const escapeCsvValue =
        (value) => {
          const stringValue =
            String(
              value ??
                ""
            );

          return `"${stringValue.replace(
            /"/g,
            '""'
          )}"`;
        };


      const csvContent = [
        headers
          .map(
            escapeCsvValue
          )
          .join(
            ","
          ),

        ...rows.map(
          (
            row
          ) =>
            row
              .map(
                escapeCsvValue
              )
              .join(
                ","
              )
        ),
      ].join(
        "\n"
      );


      const blob =
        new Blob(
          [
            "\uFEFF",
            csvContent,
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );


      link.href =
        url;

      link.download =
        `NovaCart_Assigned_Orders_${Date.now()}.csv`;


      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
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
          text="Loading assigned orders..."
        />

      </main>
    );
  }


  return (
    <main className="delivery-page">

      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <section className="delivery-page-header">

        <div>

          <span className="delivery-page-eyebrow">
            Delivery Management
          </span>

          <h1>
            Assigned Orders
          </h1>

          <p>
            View all orders assigned to you,
            search deliveries, update status,
            and download order reports.
          </p>

        </div>


        <div className="delivery-page-header-actions">

          <button
            type="button"
            className="delivery-secondary-button"
            onClick={
              downloadCsv
            }
          >
            <FaFileCsv />

            Download CSV
          </button>


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
              placeholder="Search order, customer, phone or address..."
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
              All Status
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
            Assigned Orders
          </span>

          <strong>
            {orders.length}
          </strong>

        </article>


        <article className="delivery-summary-card">

          <span>
            Showing
          </span>

          <strong>
            {
              filteredOrders.length
            }
          </strong>

        </article>


        <article className="delivery-summary-card">

          <span>
            Processing
          </span>

          <strong>
            {
              orders.filter(
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
            Delivered
          </span>

          <strong>
            {
              orders.filter(
                (
                  order
                ) =>
                  order.orderStatus ===
                  "delivered"
              ).length
            }
          </strong>

        </article>

      </section>


      {/* ======================================================
          ORDERS
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Assigned Deliveries
            </span>

            <h2>
              Orders
            </h2>

          </div>


          <FaTruck />

        </div>


        {filteredOrders.length >
        0 ? (
          <div className="delivery-orders-list">

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
                    className="delivery-order-card"
                  >

                    {/* ORDER HEADER */}

                    <div className="delivery-order-card-header">

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


                    {/* DETAILS */}

                    <div className="delivery-order-grid">

                      <div className="delivery-order-info-item">

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

                          <small>
                            {getCustomerPhone(
                              order
                            )}
                          </small>

                        </div>

                      </div>


                      <div className="delivery-order-info-item">

                        <FaMapMarkerAlt />

                        <div>

                          <span>
                            Address
                          </span>

                          <strong>
                            {buildAddress(
                              order
                            )}
                          </strong>

                        </div>

                      </div>


                      <div className="delivery-order-info-item">

                        <FaBoxOpen />

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

                      </div>


                      <div className="delivery-order-info-item">

                        <FaTruck />

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

                          <small>
                            {order.payment
                              ?.method
                              ?.toUpperCase() ||
                              "-"}
                          </small>

                        </div>

                      </div>

                    </div>


                    {/* ASSIGNMENT DETAILS */}

                    <div className="delivery-order-meta">

                      <span>
                        Assigned:{" "}
                        <strong>
                          {formatDate(
                            order.delivery
                              ?.assignedAt
                          )}
                        </strong>
                      </span>


                      <span>
                        Accepted:{" "}
                        <strong>
                          {formatDate(
                            order.delivery
                              ?.acceptedAt
                          )}
                        </strong>
                      </span>

                    </div>


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
                        ?.acceptedAt &&
                        order.orderStatus !==
                          "delivered" && (
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
                              : "Accept Order"}
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
              No assigned orders found
            </h3>

            <p>
              Orders matching your current
              filters will appear here.
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
                  Order Details
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
                    Note:
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


export default AssignedOrders;