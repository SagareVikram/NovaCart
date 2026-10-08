import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCalendarAlt,
  FaEnvelope,
  FaEye,
  FaMapMarkerAlt,
  FaPhone,
  FaSearch,
  FaShoppingBag,
  FaTimes,
  FaToggleOff,
  FaToggleOn,
  FaUser,
  FaUsers,
  FaWallet,
} from "react-icons/fa";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("");

  const [page, setPage] = useState(1);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 10,
      totalUsers: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const [detailsError, setDetailsError] =
    useState("");

  const [busyUserId, setBusyUserId] =
    useState("");

  /**
   * Backend-supported filters:
   *
   * page
   * limit
   * search
   * status
   *
   * Role and sorting are intentionally not sent here.
   * Backend currently returns customer accounts only
   * and sorts newest first.
   */
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", "10");

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (statusFilter) {
        params.set(
          "status",
          statusFilter
        );
      }

      const response = await api.get(
        `/admin/users?${params.toString()}`
      );

      setUsers(
        Array.isArray(response.data?.users)
          ? response.data.users
          : []
      );

      setPagination(
        response.data?.pagination || {
          page: 1,
          limit: 10,
          totalUsers: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        }
      );
    } catch (error) {
      setUsers([]);

      setError(
        getApiErrorMessage(
          error,
          "Unable to load customers."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    statusFilter,
  ]);

  /**
   * Debounced customer search.
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers();
    }, 250);

    return () =>
      clearTimeout(timeout);
  }, [loadUsers]);

  /**
   * Reset pagination when filters change.
   */
  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
  ]);

  /**
   * Prevent body scroll while details panel is open.
   */
  useEffect(() => {
    if (selectedUser) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedUser]);

  const activeCount = useMemo(() => {
    return users.filter(
      (user) => user.isActive
    ).length;
  }, [users]);

  const inactiveCount = useMemo(() => {
    return users.filter(
      (user) => !user.isActive
    ).length;
  }, [users]);

  /**
   * Current page only.
   */
  const customersWithPhone =
    useMemo(() => {
      return users.filter(
        (user) =>
          Boolean(
            String(
              user.phone || ""
            ).trim()
          )
      ).length;
    }, [users]);

  const formatPrice = (value) => {
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

  const formatDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

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

  const formatShortDate = (value) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

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

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  /**
   * Activate / deactivate customer.
   *
   * Backend:
   * PATCH /admin/users/:userId/status
   *
   * Body:
   * {
   *   isActive: boolean
   * }
   */
  const handleToggleStatus = async (
    user
  ) => {
    if (!user?._id) {
      return;
    }

    clearFeedback();

    const nextStatus =
      !user.isActive;

    const action =
      nextStatus
        ? "activate"
        : "deactivate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${user.name || "this customer"}'s account?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setBusyUserId(user._id);

      const response = await api.patch(
        `/admin/users/${user._id}/status`,
        {
          isActive: nextStatus,
        }
      );

      setMessage(
        response.data?.message ||
          `Customer ${
            nextStatus
              ? "activated"
              : "deactivated"
          } successfully.`
      );

      /**
       * Keep details panel synchronized.
       */
      if (
        selectedUser?._id ===
        user._id
      ) {
        setSelectedUser(
          (current) => ({
            ...current,

            ...(response.data?.user ||
              {}),

            isActive:
              response.data?.user
                ?.isActive ??
              nextStatus,
          })
        );
      }

      await loadUsers();
    } catch (error) {
      setError(
        getApiErrorMessage(
          error,
          "Unable to update customer status."
        )
      );
    } finally {
      setBusyUserId("");
    }
  };

  /**
   * Actual backend response:
   *
   * {
   *   success: true,
   *   user,
   *   recentOrders,
   *   summary: {
   *     totalOrders,
   *     totalSpent
   *   }
   * }
   *
   * Merge the values into one object so the
   * details panel can use them easily.
   */
  const loadUserDetails = async (
    userId
  ) => {
    if (!userId) {
      return;
    }

    try {
      setDetailsLoading(true);
      setDetailsError("");

      const response = await api.get(
        `/admin/users/${userId}`
      );

      const user =
        response.data?.user;

      if (!user) {
        throw new Error(
          "Customer details were not returned by the server."
        );
      }

      setSelectedUser({
        ...user,

        stats: {
          totalOrders:
            Number(
              response.data?.summary
                ?.totalOrders || 0
            ),

          totalSpent:
            Number(
              response.data?.summary
                ?.totalSpent || 0
            ),
        },

        recentOrders:
          Array.isArray(
            response.data?.recentOrders
          )
            ? response.data
                .recentOrders
            : [],
      });
    } catch (error) {
      setDetailsError(
        getApiErrorMessage(
          error,
          "Unable to load customer details."
        )
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  /**
   * Open panel immediately using row data,
   * then replace it with full server details.
   */
  const openUserDetails = async (
    user
  ) => {
    if (!user?._id) {
      return;
    }

    setDetailsError("");

    setSelectedUser({
      ...user,
      stats: null,
      recentOrders: [],
    });

    await loadUserDetails(
      user._id
    );
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setDetailsError("");
  };

  const getAddressText = (address) => {
    if (!address) {
      return "";
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

  const defaultAddress =
    useMemo(() => {
      if (
        !selectedUser ||
        !Array.isArray(
          selectedUser.addresses
        )
      ) {
        return null;
      }

      return (
        selectedUser.addresses.find(
          (address) =>
            address.isDefault
        ) ||
        selectedUser.addresses[0] ||
        null
      );
    }, [selectedUser]);

  if (
    loading &&
    users.length === 0
  ) {
    return (
      <main className="admin-page admin-users-page">
        <Loader
          fullPage
          text="Loading customers..."
        />
      </main>
    );
  }

  return (
    <main className="admin-page admin-users-page">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">
            Customer Management
          </span>

          <h1>
            Customers
          </h1>

          <p>
            Review customer accounts,
            order activity, spending,
            addresses, and account
            access status.
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
              Customer operation failed
            </strong>

            <p>
              {error}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              loadUsers();
            }}
          >
            Retry
          </button>
        </div>
      )}

      <section className="admin-user-summary-grid">
        <article className="admin-mini-stat">
          <span>
            Total Customers
          </span>

          <strong>
            {pagination.totalUsers}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Active on Page
          </span>

          <strong>
            {activeCount}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Inactive on Page
          </span>

          <strong>
            {inactiveCount}
          </strong>
        </article>

        <article className="admin-mini-stat">
          <span>
            Phone Added on Page
          </span>

          <strong>
            {customersWithPhone}
          </strong>
        </article>
      </section>

      <section className="admin-card">
        <div className="admin-user-filters">
          <div className="admin-search-box">
            <FaSearch />

            <input
              type="search"
              placeholder="Search name, email, phone..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="">
              All Account Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>

          <button
            type="button"
            className="admin-filter-reset"
            onClick={resetFilters}
          >
            Reset Filters
          </button>
        </div>
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="admin-card-eyebrow">
              Customer Accounts
            </span>

            <h2>
              Customer List
            </h2>
          </div>

          <span className="admin-result-count">
            {pagination.totalUsers} total
          </span>
        </div>

        {users.length > 0 ? (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>
                      Customer
                    </th>

                    <th>
                      Phone
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Addresses
                    </th>

                    <th>
                      Joined
                    </th>

                    <th>
                      Last Login
                    </th>

                    <th>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map(
                    (user) => {
                      const isBusy =
                        busyUserId ===
                        user._id;

                      return (
                        <tr
                          key={
                            user._id
                          }
                        >
                          <td>
                            <div className="admin-user-cell">
                              <div className="admin-user-avatar">
                                {String(
                                  user.name ||
                                    "U"
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>
                                <strong>
                                  {user.name ||
                                    "Customer"}
                                </strong>

                                <span>
                                  {user.email ||
                                    "-"}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td>
                            {user.phone ||
                              "-"}
                          </td>

                          <td>
                            <span
                              className={`admin-status ${
                                user.isActive
                                  ? "admin-status-active"
                                  : "admin-status-inactive"
                              }`}
                            >
                              {user.isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </td>

                          <td>
                            {Array.isArray(
                              user.addresses
                            )
                              ? user
                                  .addresses
                                  .length
                              : 0}
                          </td>

                          <td>
                            {formatShortDate(
                              user.createdAt
                            )}
                          </td>

                          <td>
                            {formatDate(
                              user.lastLoginAt
                            )}
                          </td>

                          <td>
                            <div className="admin-table-actions">
                              <button
                                type="button"
                                title="View customer details"
                                onClick={() =>
                                  openUserDetails(
                                    user
                                  )
                                }
                              >
                                <FaEye />
                              </button>

                              <button
                                type="button"
                                className={
                                  user.isActive
                                    ? "danger"
                                    : ""
                                }
                                title={
                                  user.isActive
                                    ? "Deactivate customer"
                                    : "Activate customer"
                                }
                                disabled={
                                  isBusy
                                }
                                onClick={() =>
                                  handleToggleStatus(
                                    user
                                  )
                                }
                              >
                                {user.isActive ? (
                                  <FaToggleOff />
                                ) : (
                                  <FaToggleOn />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )}
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
                    setPage(
                      (current) =>
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
                  ).map(
                    (pageNumber) => (
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
                        {pageNumber}
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
                      (current) =>
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
            <FaUsers />

            <h3>
              No customers found
            </h3>

            <p>
              Customer accounts matching
              your search or status filter
              will appear here.
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

      {selectedUser && (
        <>
          <div
            className="admin-user-detail-overlay"
            onClick={
              closeUserDetails
            }
          />

          <aside className="admin-user-detail-panel">
            <div className="admin-user-detail-header">
              <div>
                <span className="admin-card-eyebrow">
                  Customer Details
                </span>

                <h2>
                  Customer Profile
                </h2>
              </div>

              <button
                type="button"
                aria-label="Close customer details"
                onClick={
                  closeUserDetails
                }
              >
                <FaTimes />
              </button>
            </div>

            {detailsLoading ? (
              <Loader
                text="Loading customer details..."
              />
            ) : (
              <div className="admin-user-detail-body">
                {detailsError && (
                  <div className="admin-message error">
                    <div>
                      <strong>
                        Customer details could not be loaded.
                      </strong>

                      <p>
                        {detailsError}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        loadUserDetails(
                          selectedUser._id
                        )
                      }
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="admin-user-detail-profile">
                  <div className="admin-user-detail-avatar">
                    {String(
                      selectedUser.name ||
                        "U"
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <h3>
                    {selectedUser.name ||
                      "Customer"}
                  </h3>

                  <span>
                    {selectedUser.email ||
                      "-"}
                  </span>

                  <div className="admin-user-detail-badges">
                    <span className="admin-role-badge admin-role-user">
                      <FaUser />
                      Customer
                    </span>

                    <span
                      className={`admin-status ${
                        selectedUser.isActive
                          ? "admin-status-active"
                          : "admin-status-inactive"
                      }`}
                    >
                      {selectedUser.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                </div>

                <section className="admin-user-detail-section">
                  <h3>
                    Account Information
                  </h3>

                  <div className="admin-user-detail-row">
                    <span>
                      <FaEnvelope />
                      Email
                    </span>

                    <strong>
                      {selectedUser.email ||
                        "-"}
                    </strong>
                  </div>

                  <div className="admin-user-detail-row">
                    <span>
                      <FaPhone />
                      Phone
                    </span>

                    <strong>
                      {selectedUser.phone ||
                        "-"}
                    </strong>
                  </div>

                  <div className="admin-user-detail-row">
                    <span>
                      <FaCalendarAlt />
                      Joined
                    </span>

                    <strong>
                      {formatDate(
                        selectedUser.createdAt
                      )}
                    </strong>
                  </div>

                  <div className="admin-user-detail-row">
                    <span>
                      <FaCalendarAlt />
                      Last Login
                    </span>

                    <strong>
                      {formatDate(
                        selectedUser.lastLoginAt
                      )}
                    </strong>
                  </div>
                </section>

                <section className="admin-user-detail-section">
                  <h3>
                    Customer Activity
                  </h3>

                  <div className="admin-user-detail-stats">
                    <div>
                      <span>
                        <FaShoppingBag />
                        Orders
                      </span>

                      <strong>
                        {selectedUser.stats
                          ?.totalOrders ??
                          0}
                      </strong>
                    </div>

                    <div>
                      <span>
                        <FaWallet />
                        Total Spent
                      </span>

                      <strong>
                        ₹
                        {formatPrice(
                          selectedUser.stats
                            ?.totalSpent ||
                            0
                        )}
                      </strong>
                    </div>
                  </div>

                  <small className="admin-user-detail-note">
                    Cancelled orders are excluded
                    from spending totals.
                  </small>
                </section>

                <section className="admin-user-detail-section">
                  <h3>
                    Addresses
                  </h3>

                  <div className="admin-user-address-summary">
                    <div className="admin-user-detail-row">
                      <span>
                        Saved Addresses
                      </span>

                      <strong>
                        {Array.isArray(
                          selectedUser.addresses
                        )
                          ? selectedUser
                              .addresses
                              .length
                          : 0}
                      </strong>
                    </div>

                    {defaultAddress ? (
                      <div className="admin-user-default-address">
                        <div>
                          <FaMapMarkerAlt />

                          <strong>
                            {defaultAddress.label ||
                              "Delivery Address"}
                          </strong>

                          {defaultAddress.isDefault && (
                            <span>
                              Default
                            </span>
                          )}
                        </div>

                        <p>
                          {getAddressText(
                            defaultAddress
                          ) ||
                            "Address details unavailable."}
                        </p>

                        {defaultAddress.phone && (
                          <small>
                            Phone:{" "}
                            {
                              defaultAddress.phone
                            }
                          </small>
                        )}
                      </div>
                    ) : (
                      <p className="admin-user-no-address">
                        No saved delivery
                        address.
                      </p>
                    )}
                  </div>
                </section>

                <section className="admin-user-detail-section">
                  <h3>
                    Recent Orders
                  </h3>

                  {Array.isArray(
                    selectedUser.recentOrders
                  ) &&
                  selectedUser
                    .recentOrders
                    .length > 0 ? (
                    <div className="admin-user-recent-orders">
                      {selectedUser.recentOrders.map(
                        (order) => (
                          <article
                            key={
                              order._id
                            }
                            className="admin-user-recent-order"
                          >
                            <div>
                              <strong>
                                {order.orderNumber ||
                                  order._id}
                              </strong>

                              <span>
                                {formatShortDate(
                                  order.createdAt
                                )}
                              </span>
                            </div>

                            <div>
                              <span
                                className={`admin-status admin-status-${order.orderStatus}`}
                              >
                                {formatStatus(
                                  order.orderStatus
                                )}
                              </span>

                              <strong>
                                ₹
                                {formatPrice(
                                  order.totalAmount
                                )}
                              </strong>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="admin-compact-empty">
                      <FaShoppingBag />

                      <p>
                        No recent orders for
                        this customer.
                      </p>
                    </div>
                  )}
                </section>

                <section className="admin-user-detail-section">
                  <h3>
                    Account Access
                  </h3>

                  <p className="admin-user-status-description">
                    {selectedUser.isActive
                      ? "This customer can currently sign in and use NovaCart."
                      : "This customer account is disabled and cannot sign in."}
                  </p>

                  <button
                    type="button"
                    className={`admin-user-status-button ${
                      selectedUser.isActive
                        ? "danger"
                        : ""
                    }`}
                    disabled={
                      busyUserId ===
                      selectedUser._id
                    }
                    onClick={() =>
                      handleToggleStatus(
                        selectedUser
                      )
                    }
                  >
                    {selectedUser.isActive ? (
                      <>
                        <FaToggleOff />
                        {busyUserId ===
                        selectedUser._id
                          ? "Processing..."
                          : "Deactivate Customer"}
                      </>
                    ) : (
                      <>
                        <FaToggleOn />
                        {busyUserId ===
                        selectedUser._id
                          ? "Processing..."
                          : "Activate Customer"}
                      </>
                    )}
                  </button>
                </section>
              </div>
            )}
          </aside>
        </>
      )}
    </main>
  );
};

export default AdminUsers;