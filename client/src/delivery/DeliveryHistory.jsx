import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaCalendarAlt,
  FaCheckCircle,
  FaEye,
  FaFileCsv,
  FaFilePdf,
  FaHistory,
  FaMapMarkerAlt,
  FaSearch,
  FaSyncAlt,
  FaUser,
} from "react-icons/fa";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";


const DeliveryHistory = () => {
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
    period,
    setPeriod,
  ] = useState("30");

  const [
    customStart,
    setCustomStart,
  ] = useState("");

  const [
    customEnd,
    setCustomEnd,
  ] = useState("");

  const [
    selectedOrder,
    setSelectedOrder,
  ] = useState(null);


  /**
   * ============================================================
   * LOAD DELIVERED ORDERS
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
              "/delivery/orders?status=delivered"
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
              "Unable to load delivery history."
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


  const formatShortDate =
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


  const buildAddress =
    (order) => {
      const address =
        order?.shippingAddress;

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


  const getDeliveredDate =
    (order) => {
      return (
        order?.deliveredAt ||
        order?.delivery
          ?.deliveredAt ||
        order?.updatedAt ||
        null
      );
    };


  /**
   * ============================================================
   * DATE RANGE HELPERS
   * ============================================================
   */
  const startOfDay =
    (date) => {
      const result =
        new Date(date);

      result.setHours(
        0,
        0,
        0,
        0
      );

      return result;
    };


  const endOfDay =
    (date) => {
      const result =
        new Date(date);

      result.setHours(
        23,
        59,
        59,
        999
      );

      return result;
    };


  /**
   * ============================================================
   * PERIOD FILTER
   * ============================================================
   */
  const filteredOrders =
    useMemo(
      () => {
        const now =
          new Date();

        const term =
          search
            .trim()
            .toLowerCase();

        return orders.filter(
          (order) => {
            const deliveredValue =
              getDeliveredDate(
                order
              );

            const deliveredDate =
              deliveredValue
                ? new Date(
                    deliveredValue
                  )
                : null;


            let matchesPeriod =
              true;


            if (
              period ===
                "today" &&
              deliveredDate
            ) {
              matchesPeriod =
                deliveredDate >=
                  startOfDay(
                    now
                  ) &&
                deliveredDate <=
                  endOfDay(
                    now
                  );
            }


            if (
              period === "7" &&
              deliveredDate
            ) {
              const start =
                startOfDay(
                  new Date()
                );

              start.setDate(
                start.getDate() -
                  6
              );

              matchesPeriod =
                deliveredDate >=
                start;
            }


            if (
              period === "30" &&
              deliveredDate
            ) {
              const start =
                startOfDay(
                  new Date()
                );

              start.setDate(
                start.getDate() -
                  29
              );

              matchesPeriod =
                deliveredDate >=
                start;
            }


            if (
              period ===
                "custom" &&
              deliveredDate
            ) {
              if (
                customStart
              ) {
                const start =
                  startOfDay(
                    new Date(
                      customStart
                    )
                  );

                if (
                  deliveredDate <
                  start
                ) {
                  matchesPeriod =
                    false;
                }
              }


              if (
                customEnd
              ) {
                const end =
                  endOfDay(
                    new Date(
                      customEnd
                    )
                  );

                if (
                  deliveredDate >
                  end
                ) {
                  matchesPeriod =
                    false;
                }
              }
            }


            if (
              !matchesPeriod
            ) {
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
                order.payment
                  ?.method,
                order.payment
                  ?.status,
                order.delivery
                  ?.deliveryNote,
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
        orders,
        period,
        search,
        customStart,
        customEnd,
      ]
    );


  /**
   * ============================================================
   * TOTAL VALUE
   * ============================================================
   */
  const totalDeliveredValue =
    useMemo(
      () => {
        return filteredOrders.reduce(
          (
            total,
            order
          ) =>
            total +
            getOrderTotal(
              order
            ),
          0
        );
      },
      [
        filteredOrders,
      ]
    );


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
   * PERIOD LABEL
   * ============================================================
   */
  const getPeriodLabel =
    () => {
      if (
        period ===
        "today"
      ) {
        return "Today";
      }

      if (
        period === "7"
      ) {
        return "Last 7 Days";
      }

      if (
        period === "30"
      ) {
        return "Last 30 Days";
      }

      if (
        period === "all"
      ) {
        return "All History";
      }

      if (
        period ===
        "custom"
      ) {
        return `${
          customStart ||
          "Beginning"
        } to ${
          customEnd ||
          "Today"
        }`;
      }

      return "Delivery History";
    };


  /**
   * ============================================================
   * PDF DOWNLOAD
   * ============================================================
   */
  const downloadPdf =
    () => {
      if (
        filteredOrders.length ===
        0
      ) {
        setError(
          "There are no delivery-history records available to download."
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
        "NovaCart Delivery History Report",
        14,
        15
      );


      pdf.setFontSize(
        10
      );

      pdf.text(
        `Period: ${getPeriodLabel()}`,
        14,
        22
      );


      pdf.text(
        `Generated: ${new Date().toLocaleString(
          "en-IN"
        )}`,
        14,
        28
      );


      pdf.text(
        `Total Deliveries: ${filteredOrders.length}`,
        14,
        34
      );


      pdf.text(
        `Order Value: Rs. ${formatPrice(
          totalDeliveredValue
        )}`,
        75,
        34
      );


      autoTable(
        pdf,
        {
          startY:
            40,

          head: [
            [
              "Order",
              "Customer",
              "Phone",
              "Address",
              "Items",
              "Amount",
              "Payment",
              "Payment Status",
              "Delivered",
              "Note",
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

                order.payment
                  ?.status ||
                  "-",

                formatDate(
                  getDeliveredDate(
                    order
                  )
                ),

                order.delivery
                  ?.deliveryNote ||
                  "-",
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
                50,
            },

            9: {
              cellWidth:
                40,
            },
          },
        }
      );


      pdf.save(
        `NovaCart_Delivery_History_${Date.now()}.pdf`
      );
    };


  /**
   * ============================================================
   * CSV DOWNLOAD
   * ============================================================
   */
  const downloadCsv =
    () => {
      if (
        filteredOrders.length ===
        0
      ) {
        setError(
          "There are no delivery-history records available to download."
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
              getDeliveredDate(
                order
              )
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
        `NovaCart_Delivery_History_${Date.now()}.csv`;


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
   * RESET FILTERS
   * ============================================================
   */
  const resetFilters =
    () => {
      setSearch("");
      setPeriod("30");
      setCustomStart("");
      setCustomEnd("");
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
          text="Loading delivery history..."
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
            Completed Work
          </span>

          <h1>
            Delivery History
          </h1>

          <p>
            Review completed deliveries,
            filter by period, inspect order
            details, and download your
            delivery history.
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
          ERROR
      ====================================================== */}

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

        <div className="delivery-history-filters">

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


          <div className="delivery-history-period">

            <FaCalendarAlt />

            <select
              value={
                period
              }
              onChange={(event) =>
                setPeriod(
                  event.target
                    .value
                )
              }
            >

              <option value="today">
                Today
              </option>

              <option value="7">
                Last 7 Days
              </option>

              <option value="30">
                Last 30 Days
              </option>

              <option value="custom">
                Custom Date Range
              </option>

              <option value="all">
                All History
              </option>

            </select>

          </div>


          <button
            type="button"
            className="delivery-filter-reset"
            onClick={
              resetFilters
            }
          >
            <FaSyncAlt />

            Reset
          </button>

        </div>


        {period ===
          "custom" && (
          <div className="delivery-custom-date-range">

            <div>

              <label htmlFor="delivery-history-start">
                From
              </label>

              <input
                id="delivery-history-start"
                type="date"
                value={
                  customStart
                }
                onChange={(event) =>
                  setCustomStart(
                    event.target
                      .value
                  )
                }
              />

            </div>


            <div>

              <label htmlFor="delivery-history-end">
                To
              </label>

              <input
                id="delivery-history-end"
                type="date"
                value={
                  customEnd
                }
                onChange={(event) =>
                  setCustomEnd(
                    event.target
                      .value
                  )
                }
              />

            </div>

          </div>
        )}

      </section>


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="delivery-summary-grid">

        <article className="delivery-summary-card">

          <span>
            Completed Deliveries
          </span>

          <strong>
            {
              filteredOrders.length
            }
          </strong>

        </article>


        <article className="delivery-summary-card">

          <span>
            Total History
          </span>

          <strong>
            {orders.length}
          </strong>

        </article>


        <article className="delivery-summary-card">

          <span>
            Order Value
          </span>

          <strong>
            ₹
            {formatPrice(
              totalDeliveredValue
            )}
          </strong>

        </article>


        <article className="delivery-summary-card">

          <span>
            Period
          </span>

          <strong className="delivery-summary-text">
            {
              getPeriodLabel()
            }
          </strong>

        </article>

      </section>


      {/* ======================================================
          HISTORY LIST
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Completed Orders
            </span>

            <h2>
              Delivery History
            </h2>

          </div>


          <FaHistory />

        </div>


        {filteredOrders.length >
        0 ? (
          <div className="delivery-history-list">

            {filteredOrders.map(
              (
                order
              ) => (
                <article
                  key={
                    order._id
                  }
                  className="delivery-history-card"
                >

                  <div className="delivery-history-card-header">

                    <div>

                      <span>
                        Order
                      </span>

                      <h3>
                        {order.orderNumber ||
                          order._id}
                      </h3>

                    </div>


                    <div className="delivery-history-delivered">

                      <FaCheckCircle />

                      <div>

                        <span>
                          Delivered
                        </span>

                        <strong>
                          {formatShortDate(
                            getDeliveredDate(
                              order
                            )
                          )}
                        </strong>

                      </div>

                    </div>

                  </div>


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

                      <FaCheckCircle />

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


                  <div className="delivery-history-timeline">

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


                    <div>

                      <span>
                        Shipped
                      </span>

                      <strong>
                        {formatDate(
                          order.delivery
                            ?.shippedAt
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Out for Delivery
                      </span>

                      <strong>
                        {formatDate(
                          order.delivery
                            ?.outForDeliveryAt
                        )}
                      </strong>

                    </div>


                    <div>

                      <span>
                        Delivered
                      </span>

                      <strong>
                        {formatDate(
                          getDeliveredDate(
                            order
                          )
                        )}
                      </strong>

                    </div>

                  </div>


                  {order.delivery
                    ?.deliveryNote && (
                    <div className="delivery-history-note">

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

                  </div>

                </article>
              )
            )}

          </div>
        ) : (
          <div className="delivery-empty-state">

            <FaHistory />

            <h3>
              No delivery history found
            </h3>

            <p>
              No completed deliveries match
              the selected date range or search.
            </p>

          </div>
        )}

      </section>


      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}

      {selectedOrder && (
        <div className="delivery-modal-overlay">

          <div className="delivery-order-modal">

            <div className="delivery-modal-header">

              <div>

                <span>
                  Completed Delivery
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
                  {selectedOrder
                    .payment
                    ?.status ||
                    "-"}
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
                  Delivery Timeline
                </h3>

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
                    Delivered:
                  </strong>{" "}
                  {formatDate(
                    getDeliveredDate(
                      selectedOrder
                    )
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
                className="delivery-primary-button"
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  );
};


export default DeliveryHistory;