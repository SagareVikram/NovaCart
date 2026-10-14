import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaFilePdf,
  FaPercentage,
  FaTruck,
} from "react-icons/fa";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";


const DeliveryPerformance = () => {
  const [
    orders,
    setOrders,
  ] = useState([]);

  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  /**
   * ============================================================
   * LOAD PERFORMANCE DATA
   * ============================================================
   */
  const loadPerformance =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            ordersResponse,
            profileResponse,
          ] =
            await Promise.all([
              api.get(
                "/delivery/orders"
              ),

              api.get(
                "/delivery/profile"
              ),
            ]);


          setOrders(
            Array.isArray(
              ordersResponse.data
                ?.orders
            )
              ? ordersResponse
                  .data
                  .orders
              : []
          );


          setProfile(
            profileResponse.data
              ?.user ||
              profileResponse.data
                ?.profile ||
              profileResponse.data ||
              null
          );
        } catch (error) {
          setOrders([]);
          setProfile(null);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load delivery performance."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    loadPerformance();
  }, [
    loadPerformance,
  ]);


  /**
   * ============================================================
   * HELPERS
   * ============================================================
   */
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


  /**
   * ============================================================
   * BASE COUNTS
   * ============================================================
   */
  const totalAssigned =
    orders.length;


  const completedOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.orderStatus ===
            "delivered"
        ),
      [
        orders,
      ]
    );


  const activeOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            [
              "processing",
              "shipped",
              "out_for_delivery",
            ].includes(
              order.orderStatus
            )
        ),
      [
        orders,
      ]
    );


  const processingOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.orderStatus ===
            "processing"
        ),
      [
        orders,
      ]
    );


  const shippedOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.orderStatus ===
            "shipped"
        ),
      [
        orders,
      ]
    );


  const outForDeliveryOrders =
    useMemo(
      () =>
        orders.filter(
          (order) =>
            order.orderStatus ===
            "out_for_delivery"
        ),
      [
        orders,
      ]
    );


  /**
   * ============================================================
   * COMPLETION RATE
   * ============================================================
   */
  const completionRate =
    totalAssigned > 0
      ? Math.round(
          (
            completedOrders.length /
            totalAssigned
          ) *
            100
        )
      : 0;


  /**
   * ============================================================
   * TODAY / WEEK / MONTH
   * ============================================================
   */
  const deliveredToday =
    useMemo(
      () => {
        const today =
          startOfDay(
            new Date()
          );

        return completedOrders.filter(
          (order) => {
            const delivered =
              getDeliveredDate(
                order
              );

            if (!delivered) {
              return false;
            }

            return (
              new Date(
                delivered
              ) >= today
            );
          }
        ).length;
      },
      [
        completedOrders,
      ]
    );


  const deliveredThisWeek =
    useMemo(
      () => {
        const start =
          startOfDay(
            new Date()
          );

        start.setDate(
          start.getDate() -
            6
        );

        return completedOrders.filter(
          (order) => {
            const delivered =
              getDeliveredDate(
                order
              );

            if (!delivered) {
              return false;
            }

            return (
              new Date(
                delivered
              ) >= start
            );
          }
        ).length;
      },
      [
        completedOrders,
      ]
    );


  const deliveredThisMonth =
    useMemo(
      () => {
        const now =
          new Date();

        const start =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1
          );

        return completedOrders.filter(
          (order) => {
            const delivered =
              getDeliveredDate(
                order
              );

            if (!delivered) {
              return false;
            }

            return (
              new Date(
                delivered
              ) >= start
            );
          }
        ).length;
      },
      [
        completedOrders,
      ]
    );


  /**
   * ============================================================
   * AVERAGE DELIVERY TIME
   * ============================================================
   */
  const averageDeliveryHours =
    useMemo(
      () => {
        const durations =
          completedOrders
            .map(
              (order) => {
                const start =
                  order.delivery
                    ?.acceptedAt ||
                  order.delivery
                    ?.assignedAt;

                const end =
                  getDeliveredDate(
                    order
                  );

                if (
                  !start ||
                  !end
                ) {
                  return null;
                }

                const difference =
                  new Date(
                    end
                  ).getTime() -
                  new Date(
                    start
                  ).getTime();

                if (
                  difference <=
                  0
                ) {
                  return null;
                }

                return (
                  difference /
                  (
                    1000 *
                    60 *
                    60
                  )
                );
              }
            )
            .filter(
              (value) =>
                value !== null
            );


        if (
          durations.length ===
          0
        ) {
          return 0;
        }


        const total =
          durations.reduce(
            (
              sum,
              value
            ) =>
              sum +
              value,
            0
          );


        return Number(
          (
            total /
            durations.length
          ).toFixed(1)
        );
      },
      [
        completedOrders,
      ]
    );


  /**
   * ============================================================
   * RECENT COMPLETED ORDERS
   * ============================================================
   */
  const recentCompleted =
    useMemo(
      () => {
        return [
          ...completedOrders,
        ]
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                getDeliveredDate(
                  second
                ) || 0
              ) -
              new Date(
                getDeliveredDate(
                  first
                ) || 0
              )
          )
          .slice(
            0,
            8
          );
      },
      [
        completedOrders,
      ]
    );


  /**
   * ============================================================
   * DOWNLOAD PERFORMANCE REPORT
   * ============================================================
   */
  const downloadPerformancePdf =
    () => {
      const pdf =
        new jsPDF({
          orientation:
            "portrait",

          unit:
            "mm",

          format:
            "a4",
        });


      const agentName =
        profile?.name ||
        "Delivery Agent";


      const employeeId =
        profile
          ?.deliveryAgentProfile
          ?.employeeId ||
        "-";


      const vehicleNumber =
        profile
          ?.deliveryAgentProfile
          ?.vehicleNumber ||
        "-";


      const deliveryArea =
        profile
          ?.deliveryAgentProfile
          ?.deliveryArea ||
        "-";


      pdf.setFontSize(
        18
      );

      pdf.text(
        "NovaCart Delivery Performance Report",
        14,
        18
      );


      pdf.setFontSize(
        10
      );

      pdf.text(
        `Agent: ${agentName}`,
        14,
        27
      );

      pdf.text(
        `Employee ID: ${employeeId}`,
        14,
        33
      );

      pdf.text(
        `Vehicle: ${vehicleNumber}`,
        14,
        39
      );

      pdf.text(
        `Delivery Area: ${deliveryArea}`,
        14,
        45
      );

      pdf.text(
        `Generated: ${new Date().toLocaleString(
          "en-IN"
        )}`,
        14,
        51
      );


      autoTable(
        pdf,
        {
          startY:
            58,

          head: [
            [
              "Performance Metric",
              "Value",
            ],
          ],

          body: [
            [
              "Total Assigned Orders",
              totalAssigned,
            ],

            [
              "Completed Deliveries",
              completedOrders.length,
            ],

            [
              "Active Deliveries",
              activeOrders.length,
            ],

            [
              "Processing",
              processingOrders.length,
            ],

            [
              "Shipped",
              shippedOrders.length,
            ],

            [
              "Out for Delivery",
              outForDeliveryOrders.length,
            ],

            [
              "Delivered Today",
              deliveredToday,
            ],

            [
              "Delivered Last 7 Days",
              deliveredThisWeek,
            ],

            [
              "Delivered This Month",
              deliveredThisMonth,
            ],

            [
              "Completion Rate",
              `${completionRate}%`,
            ],

            [
              "Average Delivery Time",
              averageDeliveryHours >
              0
                ? `${averageDeliveryHours} hours`
                : "Not enough data",
            ],
          ],

          styles: {
            fontSize:
              9,

            cellPadding:
              3,
          },
        }
      );


      if (
        recentCompleted.length >
        0
      ) {
        const nextY =
          pdf.lastAutoTable
            ?.finalY
            ? pdf.lastAutoTable
                .finalY +
              10
            : 140;


        pdf.setFontSize(
          13
        );

        pdf.text(
          "Recent Completed Deliveries",
          14,
          nextY
        );


        autoTable(
          pdf,
          {
            startY:
              nextY +
              5,

            head: [
              [
                "Order",
                "Customer",
                "Delivered",
              ],
            ],

            body:
              recentCompleted.map(
                (
                  order
                ) => [
                  order.orderNumber ||
                    order._id,

                  order
                    .shippingAddress
                    ?.fullName ||
                    order.user
                      ?.name ||
                    "Customer",

                  formatDate(
                    getDeliveredDate(
                      order
                    )
                  ),
                ]
              ),

            styles: {
              fontSize:
                8,

              cellPadding:
                2,
            },
          }
        );
      }


      pdf.save(
        `NovaCart_Delivery_Performance_${Date.now()}.pdf`
      );
    };


  /**
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (loading) {
    return (
      <main className="delivery-page">

        <Loader
          fullPage
          text="Loading performance..."
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
            Personal Analytics
          </span>

          <h1>
            Performance
          </h1>

          <p>
            Review your delivery progress,
            completed assignments, active
            workload, and recent performance.
          </p>

        </div>


        <div className="delivery-page-header-actions">

          <button
            type="button"
            className="delivery-primary-button"
            onClick={
              downloadPerformancePdf
            }
          >
            <FaFilePdf />

            Download Performance PDF
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
              loadPerformance();
            }}
          >
            Retry
          </button>

        </div>
      )}


      {/* ======================================================
          PRIMARY STATISTICS
      ====================================================== */}

      <section className="delivery-performance-grid">

        <article className="delivery-performance-card">

          <div className="delivery-performance-icon">
            <FaBoxOpen />
          </div>


          <div>

            <span>
              Total Assigned
            </span>

            <strong>
              {totalAssigned}
            </strong>

            <small>
              All orders assigned to you
            </small>

          </div>

        </article>


        <article className="delivery-performance-card">

          <div className="delivery-performance-icon">
            <FaCheckCircle />
          </div>


          <div>

            <span>
              Completed
            </span>

            <strong>
              {
                completedOrders.length
              }
            </strong>

            <small>
              Successfully delivered
            </small>

          </div>

        </article>


        <article className="delivery-performance-card">

          <div className="delivery-performance-icon">
            <FaTruck />
          </div>


          <div>

            <span>
              Active
            </span>

            <strong>
              {
                activeOrders.length
              }
            </strong>

            <small>
              Deliveries still in progress
            </small>

          </div>

        </article>


        <article className="delivery-performance-card">

          <div className="delivery-performance-icon">
            <FaPercentage />
          </div>


          <div>

            <span>
              Completion Rate
            </span>

            <strong>
              {completionRate}%
            </strong>

            <small>
              Delivered / total assigned
            </small>

          </div>

        </article>

      </section>


      {/* ======================================================
          PERIOD PERFORMANCE
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Delivery Activity
            </span>

            <h2>
              Recent Performance
            </h2>

          </div>


          <FaChartLine />

        </div>


        <div className="delivery-period-performance-grid">

          <article>

            <FaCalendarAlt />

            <span>
              Delivered Today
            </span>

            <strong>
              {deliveredToday}
            </strong>

          </article>


          <article>

            <FaCalendarAlt />

            <span>
              Last 7 Days
            </span>

            <strong>
              {
                deliveredThisWeek
              }
            </strong>

          </article>


          <article>

            <FaCalendarAlt />

            <span>
              This Month
            </span>

            <strong>
              {
                deliveredThisMonth
              }
            </strong>

          </article>


          <article>

            <FaClock />

            <span>
              Avg. Delivery Time
            </span>

            <strong>
              {averageDeliveryHours >
              0
                ? `${averageDeliveryHours} hrs`
                : "-"}
            </strong>

          </article>

        </div>

      </section>


      {/* ======================================================
          DELIVERY PIPELINE
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Current Workload
            </span>

            <h2>
              Delivery Pipeline
            </h2>

          </div>


          <FaTruck />

        </div>


        <div className="delivery-pipeline-grid">

          <article>

            <span>
              Processing
            </span>

            <strong>
              {
                processingOrders.length
              }
            </strong>

            <div className="delivery-pipeline-bar">

              <span
                style={{
                  width:
                    totalAssigned >
                    0
                      ? `${Math.min(
                          (
                            processingOrders.length /
                            totalAssigned
                          ) *
                            100,
                          100
                        )}%`
                      : "0%",
                }}
              />

            </div>

          </article>


          <article>

            <span>
              Shipped
            </span>

            <strong>
              {
                shippedOrders.length
              }
            </strong>

            <div className="delivery-pipeline-bar">

              <span
                style={{
                  width:
                    totalAssigned >
                    0
                      ? `${Math.min(
                          (
                            shippedOrders.length /
                            totalAssigned
                          ) *
                            100,
                          100
                        )}%`
                      : "0%",
                }}
              />

            </div>

          </article>


          <article>

            <span>
              Out for Delivery
            </span>

            <strong>
              {
                outForDeliveryOrders.length
              }
            </strong>

            <div className="delivery-pipeline-bar">

              <span
                style={{
                  width:
                    totalAssigned >
                    0
                      ? `${Math.min(
                          (
                            outForDeliveryOrders.length /
                            totalAssigned
                          ) *
                            100,
                          100
                        )}%`
                      : "0%",
                }}
              />

            </div>

          </article>


          <article>

            <span>
              Delivered
            </span>

            <strong>
              {
                completedOrders.length
              }
            </strong>

            <div className="delivery-pipeline-bar">

              <span
                style={{
                  width:
                    `${completionRate}%`,
                }}
              />

            </div>

          </article>

        </div>

      </section>


      {/* ======================================================
          AGENT INFORMATION
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Agent Information
            </span>

            <h2>
              Performance Profile
            </h2>

          </div>

        </div>


        <div className="delivery-performance-profile">

          <div>

            <span>
              Agent Name
            </span>

            <strong>
              {profile?.name ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Employee ID
            </span>

            <strong>
              {profile
                ?.deliveryAgentProfile
                ?.employeeId ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Vehicle
            </span>

            <strong>
              {profile
                ?.deliveryAgentProfile
                ?.vehicleNumber ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Delivery Area
            </span>

            <strong>
              {profile
                ?.deliveryAgentProfile
                ?.deliveryArea ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Joined
            </span>

            <strong>
              {formatShortDate(
                profile
                  ?.deliveryAgentProfile
                  ?.joinedAt ||
                  profile?.createdAt
              )}
            </strong>

          </div>


          <div>

            <span>
              Availability
            </span>

            <strong>
              {profile
                ?.deliveryAgentProfile
                ?.isAvailable !==
              false
                ? "Available"
                : "Unavailable"}
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================================
          RECENT COMPLETED DELIVERIES
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Recent Activity
            </span>

            <h2>
              Latest Completed Deliveries
            </h2>

          </div>


          <FaCheckCircle />

        </div>


        {recentCompleted.length >
        0 ? (
          <div className="delivery-performance-history">

            {recentCompleted.map(
              (
                order
              ) => (
                <article
                  key={
                    order._id
                  }
                >

                  <div>

                    <span>
                      Order
                    </span>

                    <strong>
                      {order.orderNumber ||
                        order._id}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Customer
                    </span>

                    <strong>
                      {order
                        .shippingAddress
                        ?.fullName ||
                        order.user
                          ?.name ||
                        "Customer"}
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

                </article>
              )
            )}

          </div>
        ) : (
          <div className="delivery-empty-state">

            <FaChartLine />

            <h3>
              No completed deliveries yet
            </h3>

            <p>
              Performance history will appear
              after you complete deliveries.
            </p>

          </div>
        )}

      </section>

    </main>
  );
};


export default DeliveryPerformance;