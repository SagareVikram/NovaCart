import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaMapMarkerAlt,
  FaSyncAlt,
  FaTruck,
  FaUser,
  FaUserCircle,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import Loader from "../components/Loader.jsx";


const DeliveryDashboard = () => {
  const {
    user,
    updateCurrentUser,
  } =
    useAuth();


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
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    availabilityUpdating,
    setAvailabilityUpdating,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");


  /**
   * ============================================================
   * LOAD DASHBOARD
   * ============================================================
   */
  const loadDashboard =
    useCallback(
      async (
        showRefresh = false
      ) => {
        try {
          if (
            showRefresh
          ) {
            setRefreshing(
              true
            );
          } else {
            setLoading(
              true
            );
          }

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


          const profileData =
            profileResponse.data
              ?.user ||
            profileResponse.data
              ?.profile ||
            profileResponse.data ||
            null;


          setProfile(
            profileData
          );
        } catch (
          error
        ) {
          setError(
            getApiErrorMessage(
              error,
              "Unable to load delivery dashboard."
            )
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      []
    );


  useEffect(
    () => {
      loadDashboard();
    },
    [
      loadDashboard,
    ]
  );


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
        new Date(
          value
        );


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
          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric",

          hour:
            "2-digit",

          minute:
            "2-digit",
        }
      );
    };


  const formatStatus =
    (value) => {
      if (!value) {
        return "-";
      }


      return String(
        value
      )
        .replace(
          /_/g,
          " "
        )
        .replace(
          /\b\w/g,
          (
            character
          ) =>
            character.toUpperCase()
        );
    };


  const getCustomerName =
    (order) => {
      return (
        order
          ?.shippingAddress
          ?.fullName ||
        order?.user?.name ||
        "Customer"
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
      ]
        .filter(
          Boolean
        )
        .join(
          ", "
        );
    };


  /**
   * ============================================================
   * ORDER GROUPS
   * ============================================================
   */
  const activeOrders =
    useMemo(
      () => {
        return orders.filter(
          (
            order
          ) =>
            [
              "processing",
              "shipped",
              "out_for_delivery",
            ].includes(
              order.orderStatus
            )
        );
      },
      [
        orders,
      ]
    );


  const deliveredOrders =
    useMemo(
      () => {
        return orders.filter(
          (
            order
          ) =>
            order.orderStatus ===
            "delivered"
        );
      },
      [
        orders,
      ]
    );


  const outForDeliveryOrders =
    useMemo(
      () => {
        return orders.filter(
          (
            order
          ) =>
            order.orderStatus ===
            "out_for_delivery"
        );
      },
      [
        orders,
      ]
    );


  const recentActiveOrders =
    useMemo(
      () => {
        return [
          ...activeOrders,
        ]
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                second
                  .delivery
                  ?.assignedAt ||
                  second.createdAt ||
                  0
              ) -
              new Date(
                first
                  .delivery
                  ?.assignedAt ||
                  first.createdAt ||
                  0
              )
          )
          .slice(
            0,
            5
          );
      },
      [
        activeOrders,
      ]
    );


  /**
   * ============================================================
   * DELIVERED TODAY
   * ============================================================
   */
  const deliveredToday =
    useMemo(
      () => {
        const today =
          new Date();

        today.setHours(
          0,
          0,
          0,
          0
        );


        return deliveredOrders.filter(
          (
            order
          ) => {
            const deliveredAt =
              order.deliveredAt ||
              order.delivery
                ?.deliveredAt;


            if (
              !deliveredAt
            ) {
              return false;
            }


            return (
              new Date(
                deliveredAt
              ) >= today
            );
          }
        ).length;
      },
      [
        deliveredOrders,
      ]
    );


  /**
   * ============================================================
   * AVAILABILITY
   * ============================================================
   */
  const deliveryProfile =
    profile
      ?.deliveryAgentProfile ||
    user
      ?.deliveryAgentProfile ||
    {};


  const isAvailable =
    deliveryProfile
      .isAvailable !==
    false;


  const toggleAvailability =
    async () => {
      const nextValue =
        !isAvailable;


      try {
        setAvailabilityUpdating(
          true
        );

        setError("");
        setMessage("");


        const response =
          await api.patch(
            "/delivery/availability",
            {
              isAvailable:
                nextValue,
            }
          );


        const updatedUser =
          response.data
            ?.user ||
          response.data
            ?.profile ||
          response.data ||
          null;


        if (
          updatedUser?._id
        ) {
          setProfile(
            updatedUser
          );


          if (
            typeof updateCurrentUser ===
            "function"
          ) {
            updateCurrentUser(
              updatedUser
            );
          }
        } else {
          setProfile(
            (
              current
            ) => ({
              ...current,

              deliveryAgentProfile:
                {
                  ...current
                    ?.deliveryAgentProfile,

                  isAvailable:
                    nextValue,
                },
            })
          );
        }


        setMessage(
          `You are now ${
            nextValue
              ? "available"
              : "unavailable"
          } for new delivery assignments.`
        );
      } catch (
        error
      ) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to update availability."
          )
        );
      } finally {
        setAvailabilityUpdating(
          false
        );
      }
    };


  /**
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (
    loading
  ) {
    return (
      <main className="delivery-page">

        <Loader
          fullPage
          text="Loading delivery dashboard..."
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
            Delivery Operations
          </span>


          <h1>
            Welcome,{" "}
            {profile?.name ||
              user?.name ||
              "Delivery Agent"}
          </h1>


          <p>
            Manage your assigned
            NovaCart orders and
            monitor your current
            delivery workload.
          </p>

        </div>


        <div className="delivery-page-header-actions">

          <button
            type="button"
            className="delivery-secondary-button"
            disabled={
              refreshing
            }
            onClick={() =>
              loadDashboard(
                true
              )
            }
          >
            <FaSyncAlt />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </div>

      </section>


      {/* ======================================================
          MESSAGES
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
            onClick={() =>
              loadDashboard(
                true
              )
            }
          >
            Retry
          </button>

        </div>
      )}


      {/* ======================================================
          AVAILABILITY
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-dashboard-availability">

          <div>

            <span className="delivery-page-eyebrow">
              Current Availability
            </span>


            <h2>
              {isAvailable
                ? "Available for Deliveries"
                : "Currently Unavailable"}
            </h2>


            <p>
              {isAvailable
                ? "The administrator can assign new delivery orders to you."
                : "You will not receive new assignments until you become available again."}
            </p>

          </div>


          <div className="delivery-dashboard-availability-actions">

            <span
              className={`delivery-profile-status ${
                isAvailable
                  ? "available"
                  : "unavailable"
              }`}
            >
              <span className="delivery-availability-dot" />

              {isAvailable
                ? "Available"
                : "Unavailable"}
            </span>


            <button
              type="button"
              className={
                isAvailable
                  ? "delivery-secondary-button"
                  : "delivery-primary-button"
              }
              disabled={
                availabilityUpdating
              }
              onClick={
                toggleAvailability
              }
            >
              {availabilityUpdating
                ? "Updating..."
                : isAvailable
                ? "Go Unavailable"
                : "Go Available"}
            </button>

          </div>

        </div>

      </section>


      {/* ======================================================
          STATS
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
              {orders.length}
            </strong>

            <small>
              All assigned orders
            </small>

          </div>

        </article>


        <article className="delivery-performance-card">

          <div className="delivery-performance-icon">
            <FaClock />
          </div>


          <div>

            <span>
              Active Deliveries
            </span>

            <strong>
              {
                activeOrders.length
              }
            </strong>

            <small>
              Orders requiring action
            </small>

          </div>

        </article>


        <article className="delivery-performance-card">

          <div className="delivery-performance-icon">
            <FaTruck />
          </div>


          <div>

            <span>
              Out for Delivery
            </span>

            <strong>
              {
                outForDeliveryOrders.length
              }
            </strong>

            <small>
              Currently being delivered
            </small>

          </div>

        </article>


        <article className="delivery-performance-card">

          <div className="delivery-performance-icon">
            <FaCheckCircle />
          </div>


          <div>

            <span>
              Delivered
            </span>

            <strong>
              {
                deliveredOrders.length
              }
            </strong>

            <small>
              {deliveredToday} delivered today
            </small>

          </div>

        </article>

      </section>


      {/* ======================================================
          DELIVERY AGENT INFORMATION
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Agent Profile
            </span>

            <h2>
              Delivery Information
            </h2>

          </div>


          <FaUserCircle />

        </div>


        <div className="delivery-performance-profile">

          <div>

            <span>
              Employee ID
            </span>

            <strong>
              {deliveryProfile
                .employeeId ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Phone
            </span>

            <strong>
              {profile?.phone ||
                user?.phone ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Vehicle
            </span>

            <strong>
              {deliveryProfile
                .vehicleNumber ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Delivery Area
            </span>

            <strong>
              {deliveryProfile
                .deliveryArea ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Email
            </span>

            <strong>
              {profile?.email ||
                user?.email ||
                "-"}
            </strong>

          </div>


          <div>

            <span>
              Status
            </span>

            <strong>
              {profile
                ?.isActive !==
              false
                ? "Active"
                : "Disabled"}
            </strong>

          </div>

        </div>

      </section>


      {/* ======================================================
          ACTIVE ASSIGNMENTS
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Current Workload
            </span>

            <h2>
              Recent Active Deliveries
            </h2>

          </div>


          <FaTruck />

        </div>


        {recentActiveOrders.length >
        0 ? (
          <div className="delivery-dashboard-order-list">

            {recentActiveOrders.map(
              (
                order
              ) => (
                <article
                  key={
                    order._id
                  }
                  className="delivery-dashboard-order"
                >

                  <div className="delivery-dashboard-order-main">

                    <div>

                      <span>
                        Order
                      </span>

                      <strong>
                        {order.orderNumber ||
                          order._id}
                      </strong>

                    </div>


                    <span
                      className={`delivery-status delivery-status-${order.orderStatus}`}
                    >
                      {formatStatus(
                        order.orderStatus
                      )}
                    </span>

                  </div>


                  <div className="delivery-dashboard-order-details">

                    <div>

                      <FaUser />

                      <span>
                        {getCustomerName(
                          order
                        )}
                      </span>

                    </div>


                    <div>

                      <FaMapMarkerAlt />

                      <span>
                        {buildAddress(
                          order
                        )}
                      </span>

                    </div>


                    <div>

                      <FaBoxOpen />

                      <span>
                        {order.totalItems ||
                          order.items
                            ?.length ||
                          0}{" "}
                        item(s)
                      </span>

                    </div>


                    <div>

                      <strong>
                        ₹
                        {formatPrice(
                          order.totalAmount
                        )}
                      </strong>

                    </div>

                  </div>


                  <div className="delivery-dashboard-order-footer">

                    <span>
                      Assigned:{" "}
                      {formatDate(
                        order.delivery
                          ?.assignedAt
                      )}
                    </span>


                    <Link
                      to="/delivery/active"
                      className="delivery-dashboard-order-link"
                    >
                      Manage Delivery
                    </Link>

                  </div>

                </article>
              )
            )}

          </div>
        ) : (
          <div className="delivery-empty-state">

            <FaTruck />

            <h3>
              No active deliveries
            </h3>

            <p>
              You currently have no
              delivery orders requiring
              action.
            </p>

          </div>
        )}


        {activeOrders.length >
          recentActiveOrders.length && (
          <div className="delivery-dashboard-view-all">

            <Link
              to="/delivery/active"
              className="delivery-primary-button"
            >
              View All Active Deliveries
            </Link>

          </div>
        )}

      </section>


      {/* ======================================================
          QUICK LINKS
      ====================================================== */}

      <section className="delivery-dashboard-quick-grid">

        <Link
          to="/delivery/orders"
          className="delivery-dashboard-quick-card"
        >
          <FaBoxOpen />

          <div>
            <strong>
              Assigned Orders
            </strong>

            <span>
              View all assigned orders
            </span>
          </div>
        </Link>


        <Link
          to="/delivery/active"
          className="delivery-dashboard-quick-card"
        >
          <FaTruck />

          <div>
            <strong>
              Active Deliveries
            </strong>

            <span>
              Manage current deliveries
            </span>
          </div>
        </Link>


        <Link
          to="/delivery/history"
          className="delivery-dashboard-quick-card"
        >
          <FaCheckCircle />

          <div>
            <strong>
              Delivery History
            </strong>

            <span>
              Review completed deliveries
            </span>
          </div>
        </Link>


        <Link
          to="/delivery/performance"
          className="delivery-dashboard-quick-card"
        >
          <FaUserCircle />

          <div>
            <strong>
              Performance
            </strong>

            <span>
              View your delivery statistics
            </span>
          </div>
        </Link>

      </section>

    </main>
  );
};


export default DeliveryDashboard;