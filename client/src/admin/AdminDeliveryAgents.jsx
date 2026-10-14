import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCheckCircle,
  FaEdit,
  FaPlus,
  FaSearch,
  FaTimesCircle,
  FaTruck,
  FaUser,
} from "react-icons/fa";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";


const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  vehicleNumber: "",
  deliveryArea: "",
};


const AdminDeliveryAgents = () => {
  const [
    agents,
    setAgents,
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
    successMessage,
    setSuccessMessage,
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
    availabilityFilter,
    setAvailabilityFilter,
  ] = useState("");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editingAgent,
    setEditingAgent,
  ] = useState(null);

  const [
    formData,
    setFormData,
  ] = useState(
    emptyForm
  );

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    actionId,
    setActionId,
  ] = useState("");


  /**
   * ============================================================
   * LOAD DELIVERY AGENTS
   * ============================================================
   */
  const loadAgents =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const params =
            new URLSearchParams();

          if (
            search.trim()
          ) {
            params.set(
              "search",
              search.trim()
            );
          }

          if (
            statusFilter
          ) {
            params.set(
              "status",
              statusFilter
            );
          }

          if (
            availabilityFilter
          ) {
            params.set(
              "availability",
              availabilityFilter
            );
          }

          params.set(
            "limit",
            "100"
          );

          const response =
            await api.get(
              `/admin/delivery-agents?${params.toString()}`
            );

          setAgents(
            Array.isArray(
              response.data
                ?.agents
            )
              ? response.data
                  .agents
              : []
          );
        } catch (error) {
          setAgents([]);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load delivery agents."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [
        search,
        statusFilter,
        availabilityFilter,
      ]
    );


  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          loadAgents();
        },
        250
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    loadAgents,
  ]);


  /**
   * ============================================================
   * SUMMARY
   * ============================================================
   */
  const summary =
    useMemo(
      () => {
        const total =
          agents.length;

        const active =
          agents.filter(
            (agent) =>
              agent.isActive
          ).length;

        const available =
          agents.filter(
            (agent) =>
              agent.isActive &&
              agent
                .deliveryAgentProfile
                ?.isAvailable
          ).length;

        const activeAssignments =
          agents.reduce(
            (
              total,
              agent
            ) =>
              total +
              Number(
                agent.activeAssignments ||
                  0
              ),
            0
          );

        return {
          total,
          active,
          available,
          activeAssignments,
        };
      },
      [agents]
    );


  /**
   * ============================================================
   * FORM HELPERS
   * ============================================================
   */
  const resetForm =
    () => {
      setEditingAgent(
        null
      );

      setFormData(
        emptyForm
      );

      setShowForm(
        false
      );
    };


  const openCreateForm =
    () => {
      setEditingAgent(
        null
      );

      setFormData(
        emptyForm
      );

      setError("");
      setSuccessMessage("");
      setShowForm(true);
    };


  const openEditForm =
    (agent) => {
      setEditingAgent(
        agent
      );

      setFormData({
        name:
          agent.name ||
          "",

        email:
          agent.email ||
          "",

        password:
          "",

        phone:
          agent.phone ||
          "",

        

        vehicleNumber:
          agent
            .deliveryAgentProfile
            ?.vehicleNumber ||
          "",

        deliveryArea:
          agent
            .deliveryAgentProfile
            ?.deliveryArea ||
          "",
      });

      setError("");
      setSuccessMessage("");
      setShowForm(true);

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });
    };


  const handleFormChange =
    (event) => {
      const {
        name,
        value,
      } =
        event.target;

      setFormData(
        (
          current
        ) => ({
          ...current,
          [name]:
            value,
        })
      );
    };


  /**
   * ============================================================
   * FORM VALIDATION
   * ============================================================
   */
  const validateForm =
    () => {
      if (
        formData.name
          .trim()
          .length < 2
      ) {
        return "Delivery agent name is required.";
      }

      const email =
        formData.email
          .trim()
          .toLowerCase();

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        return "Enter a valid email address.";
      }

      if (
        !editingAgent &&
        formData.password
          .length < 6
      ) {
        return "Password must contain at least 6 characters.";
      }

      if (
        editingAgent &&
        formData.password &&
        formData.password
          .length < 6
      ) {
        return "New password must contain at least 6 characters.";
      }

      if (
        !formData.phone
          .trim()
      ) {
        return "Phone number is required.";
      }

      

      return "";
    };


  /**
   * ============================================================
   * CREATE / UPDATE AGENT
   * ============================================================
   */
  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (submitting) {
        return;
      }

      const validationError =
        validateForm();

      if (
        validationError
      ) {
        setError(
          validationError
        );

        return;
      }

      try {
        setSubmitting(true);
        setError("");
        setSuccessMessage("");

        const payload = {
          name:
            formData.name
              .trim(),

          email:
            formData.email
              .trim()
              .toLowerCase(),

          phone:
            formData.phone
              .trim(),

          

          vehicleNumber:
            formData.vehicleNumber
              .trim(),

          deliveryArea:
            formData.deliveryArea
              .trim(),
        };

        if (
          formData.password
        ) {
          payload.password =
            formData.password;
        }

        let response;

        if (
          editingAgent
        ) {
          response =
            await api.put(
              `/admin/delivery-agents/${editingAgent._id}`,
              payload
            );
        } else {
          response =
            await api.post(
              "/admin/delivery-agents",
              {
                ...payload,

                password:
                  formData.password,
              }
            );
        }

        setSuccessMessage(
          response.data
            ?.message ||
            (
              editingAgent
                ? "Delivery agent updated successfully."
                : "Delivery agent created successfully."
            )
        );

        resetForm();

        await loadAgents();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            editingAgent
              ? "Unable to update delivery agent."
              : "Unable to create delivery agent."
          )
        );
      } finally {
        setSubmitting(false);
      }
    };


  /**
   * ============================================================
   * ACTIVE STATUS
   * ============================================================
   */
  const handleStatusChange =
    async (
      agent
    ) => {
      try {
        setActionId(
          agent._id
        );

        setError("");
        setSuccessMessage("");

        const nextStatus =
          !agent.isActive;

        const response =
          await api.patch(
            `/admin/delivery-agents/${agent._id}/status`,
            {
              isActive:
                nextStatus,
            }
          );

        setSuccessMessage(
          response.data
            ?.message ||
            "Delivery agent status updated."
        );

        await loadAgents();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to update delivery agent status."
          )
        );
      } finally {
        setActionId("");
      }
    };


  /**
   * ============================================================
   * AVAILABILITY
   * ============================================================
   */
  const handleAvailabilityChange =
    async (
      agent
    ) => {
      try {
        setActionId(
          agent._id
        );

        setError("");
        setSuccessMessage("");

        const currentAvailability =
          Boolean(
            agent
              .deliveryAgentProfile
              ?.isAvailable
          );

        const response =
          await api.patch(
            `/admin/delivery-agents/${agent._id}/availability`,
            {
              isAvailable:
                !currentAvailability,
            }
          );

        setSuccessMessage(
          response.data
            ?.message ||
            "Availability updated successfully."
        );

        await loadAgents();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to update delivery agent availability."
          )
        );
      } finally {
        setActionId("");
      }
    };


  /**
   * ============================================================
   * DATE FORMAT
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

      return date.toLocaleDateString(
        "en-IN",
        {
          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric",
        }
      );
    };


  if (
    loading &&
    agents.length === 0
  ) {
    return (
      <main className="admin-page">
        <Loader
          fullPage
          text="Loading delivery agents..."
        />
      </main>
    );
  }


  return (
    <main className="admin-page admin-delivery-agents-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="admin-page-header">

        <div>
          <span className="admin-eyebrow">
            Delivery Management
          </span>

          <h1>
            Delivery Agents
          </h1>

          <p>
            Create delivery accounts,
            manage agent availability,
            and monitor active order
            assignments.
          </p>
        </div>


        <button
          type="button"
          className="admin-primary-button"
          onClick={
            openCreateForm
          }
        >
          <FaPlus />

          Add Delivery Agent
        </button>

      </div>


      {/* ======================================================
          MESSAGES
      ====================================================== */}

      {error && (
        <div className="admin-message error">
          {error}
        </div>
      )}


      {successMessage && (
        <div className="admin-message success">
          {successMessage}
        </div>
      )}


      {/* ======================================================
          CREATE / EDIT FORM
      ====================================================== */}

      {showForm && (
        <section className="admin-card admin-delivery-agent-form-card">

          <div className="admin-card-header">

            <div>
              <span className="admin-card-eyebrow">
                {editingAgent
                  ? "Edit Account"
                  : "New Account"}
              </span>

              <h2>
                {editingAgent
                  ? "Update Delivery Agent"
                  : "Create Delivery Agent"}
              </h2>
              {!editingAgent && (
                <p className="admin-form-note">
                  Employee ID will be generated automatically after creating the agent.
                </p>
              )}
            </div>

            <FaTruck className="admin-card-header-icon" />

          </div>


          <form
            className="admin-delivery-agent-form"
            onSubmit={
              handleSubmit
            }
          >

            <div className="admin-form-grid">

              <div className="admin-form-group">

                <label htmlFor="delivery-name">
                  Full Name
                </label>

                <input
                  id="delivery-name"
                  type="text"
                  name="name"
                  value={
                    formData.name
                  }
                  onChange={
                    handleFormChange
                  }
                  
                  maxLength="100"
                  required
                />

              </div>


              <div className="admin-form-group">

                <label htmlFor="delivery-email">
                  Email
                </label>

                <input
                  id="delivery-email"
                  type="email"
                  name="email"
                  value={
                    formData.email
                  }
                  onChange={
                    handleFormChange
                  }
                  
                  maxLength="150"
                  required
                />

              </div>


              <div className="admin-form-group">

                <label htmlFor="delivery-phone">
                  Phone Number
                </label>

                <input
                  id="delivery-phone"
                  type="text"
                  name="phone"
                  value={
                    formData.phone
                  }
                  onChange={
                    handleFormChange
                  }
                  
                  maxLength="20"
                  required
                />

              </div>


              


              <div className="admin-form-group">

                <label htmlFor="delivery-vehicle">
                  Vehicle Number
                </label>

                <input
                  id="delivery-vehicle"
                  type="text"
                  name="vehicleNumber"
                  value={
                    formData.vehicleNumber
                  }
                  onChange={
                    handleFormChange
                  }
                  
                  maxLength="30"
                  required
                />

              </div>


              <div className="admin-form-group">

                <label htmlFor="delivery-area">
                  Delivery Area
                </label>

                <input
                  id="delivery-area"
                  type="text"
                  name="deliveryArea"
                  value={
                    formData.deliveryArea
                  }
                  onChange={
                    handleFormChange
                  }
                  
                  maxLength="150"
                  required
                />

              </div>


              <div className="admin-form-group admin-form-group-full">

                <label htmlFor="delivery-password">
                  {editingAgent
                    ? "New Password (optional)"
                    : "Password"}
                </label>

                <input
                  id="delivery-password"
                  type="password"
                  name="password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleFormChange
                  }
                  placeholder={
                    editingAgent
                      ? "Leave blank to keep current password"
                      : "Minimum 6 characters"
                  }
                  minLength="6"
                  required={
                    !editingAgent
                  }
                />

              </div>

            </div>


            <div className="admin-form-actions">

              <button
                type="button"
                className="admin-secondary-button"
                onClick={
                  resetForm
                }
                disabled={
                  submitting
                }
              >
                Cancel
              </button>


              <button
                type="submit"
                className="admin-primary-button"
                disabled={
                  submitting
                }
              >
                {submitting
                  ? "Saving..."
                  : editingAgent
                    ? "Update Agent"
                    : "Create Agent"}
              </button>

            </div>

          </form>

        </section>
      )}


      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="admin-report-summary-grid">

        <article className="admin-stat-card">

          <div className="admin-stat-icon">
            <FaUser />
          </div>

          <div className="admin-stat-content">

            <span>
              Delivery Agents
            </span>

            <strong>
              {summary.total}
            </strong>

            <small>
              Matching current filters
            </small>

          </div>

        </article>


        <article className="admin-stat-card">

          <div className="admin-stat-icon">
            <FaCheckCircle />
          </div>

          <div className="admin-stat-content">

            <span>
              Active
            </span>

            <strong>
              {summary.active}
            </strong>

            <small>
              Enabled agent accounts
            </small>

          </div>

        </article>


        <article className="admin-stat-card">

          <div className="admin-stat-icon">
            <FaTruck />
          </div>

          <div className="admin-stat-content">

            <span>
              Available
            </span>

            <strong>
              {summary.available}
            </strong>

            <small>
              Ready for assignment
            </small>

          </div>

        </article>


        <article className="admin-stat-card">

          <div className="admin-stat-icon">
            <FaTruck />
          </div>

          <div className="admin-stat-content">

            <span>
              Active Assignments
            </span>

            <strong>
              {
                summary
                  .activeAssignments
              }
            </strong>

            <small>
              Current unfinished deliveries
            </small>

          </div>

        </article>

      </section>


      {/* ======================================================
          FILTERS
      ====================================================== */}

      <section className="admin-card">

        <div className="admin-delivery-agent-filters">

          <div className="admin-search-box">

            <FaSearch />

            <input
              type="text"
              placeholder="Search name, email, employee ID, vehicle..."
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
              All Account Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>


          <select
            value={
              availabilityFilter
            }
            onChange={(event) =>
              setAvailabilityFilter(
                event.target
                  .value
              )
            }
          >
            <option value="">
              All Availability
            </option>

            <option value="available">
              Available
            </option>

            <option value="unavailable">
              Unavailable
            </option>
          </select>

        </div>

      </section>


      {/* ======================================================
          AGENT LIST
      ====================================================== */}

      <section className="admin-card">

        <div className="admin-card-header">

          <div>
            <span className="admin-card-eyebrow">
              Staff Directory
            </span>

            <h2>
              Delivery Agent Accounts
            </h2>
          </div>

          <FaTruck className="admin-card-header-icon" />

        </div>


        {agents.length >
        0 ? (
          <div className="admin-table-wrap">

            <table className="admin-table">

              <thead>
                <tr>
                  <th>
                    Agent
                  </th>

                  <th>
                    Employee ID
                  </th>

                  <th>
                    Vehicle
                  </th>

                  <th>
                    Area
                  </th>

                  <th>
                    Availability
                  </th>

                  <th>
                    Active Orders
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Joined
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>


              <tbody>

                {agents.map(
                  (agent) => {
                    const available =
                      Boolean(
                        agent
                          .deliveryAgentProfile
                          ?.isAvailable
                      );

                    const busy =
                      actionId ===
                      agent._id;


                    return (
                      <tr
                        key={
                          agent._id
                        }
                      >

                        <td>
                          <div className="admin-user-cell">

                            <div className="admin-user-avatar">
                              {String(
                                agent.name ||
                                  "D"
                              )
                                .charAt(
                                  0
                                )
                                .toUpperCase()}
                            </div>


                            <div>

                              <strong>
                                {agent.name ||
                                  "Delivery Agent"}
                              </strong>

                              <span>
                                {agent.email ||
                                  "-"}
                              </span>

                              <small>
                                {agent.phone ||
                                  "-"}
                              </small>

                            </div>

                          </div>
                        </td>


                        <td>
                          <strong>
                            {agent
                              .deliveryAgentProfile
                              ?.employeeId ||
                              "-"}
                          </strong>
                        </td>


                        <td>
                          {agent
                            .deliveryAgentProfile
                            ?.vehicleNumber ||
                            "-"}
                        </td>


                        <td>
                          {agent
                            .deliveryAgentProfile
                            ?.deliveryArea ||
                            "-"}
                        </td>


                        <td>

                          <span
                            className={
                              available
                                ? "admin-status admin-status-delivered"
                                : "admin-status admin-status-cancelled"
                            }
                          >
                            {available
                              ? "Available"
                              : "Unavailable"}
                          </span>

                        </td>


                        <td>
                          <strong>
                            {Number(
                              agent.activeAssignments ||
                                0
                            )}
                          </strong>
                        </td>


                        <td>

                          <span
                            className={
                              agent.isActive
                                ? "admin-status admin-status-delivered"
                                : "admin-status admin-status-cancelled"
                            }
                          >
                            {agent.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </td>


                        <td>
                          {formatDate(
                            agent
                              .deliveryAgentProfile
                              ?.joinedAt ||
                              agent.createdAt
                          )}
                        </td>


                        <td>

                          <div className="admin-delivery-agent-actions">

                            <button
                              type="button"
                              className="admin-icon-button"
                              title="Edit delivery agent"
                              onClick={() =>
                                openEditForm(
                                  agent
                                )
                              }
                              disabled={
                                busy
                              }
                            >
                              <FaEdit />
                            </button>


                            <button
                              type="button"
                              className="admin-small-button"
                              onClick={() =>
                                handleAvailabilityChange(
                                  agent
                                )
                              }
                              disabled={
                                busy ||
                                !agent.isActive
                              }
                            >
                              {available
                                ? "Set Unavailable"
                                : "Set Available"}
                            </button>


                            <button
                              type="button"
                              className={
                                agent.isActive
                                  ? "admin-small-button danger"
                                  : "admin-small-button success"
                              }
                              onClick={() =>
                                handleStatusChange(
                                  agent
                                )
                              }
                              disabled={
                                busy
                              }
                            >
                              {agent.isActive ? (
                                <>
                                  <FaTimesCircle />
                                  Disable
                                </>
                              ) : (
                                <>
                                  <FaCheckCircle />
                                  Activate
                                </>
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
        ) : (
          <div className="admin-empty-state">

            <FaTruck />

            <h3>
              No Delivery Agents
            </h3>

            <p>
              No delivery agents match
              the current filters.
            </p>

            <button
              type="button"
              className="admin-primary-button"
              onClick={
                openCreateForm
              }
            >
              <FaPlus />
              Create Delivery Agent
            </button>

          </div>
        )}

      </section>

    </main>
  );
};


export default AdminDeliveryAgents;