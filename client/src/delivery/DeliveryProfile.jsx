import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  FaEnvelope,
  FaIdBadge,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaToggleOff,
  FaToggleOn,
  FaTruck,
  FaUserCircle,
} from "react-icons/fa";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import Loader from "../components/Loader.jsx";


const DeliveryProfile = () => {
  const {
    updateCurrentUser,
  } =
    useAuth();


  const [
    profile,
    setProfile,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
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
   * LOAD PROFILE
   * ============================================================
   */
  const loadProfile =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              "/delivery/profile"
            );


          const profileData =
            response.data?.user ||
            response.data?.profile ||
            response.data ||
            null;


          setProfile(
            profileData
          );
        } catch (error) {
          setProfile(null);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load delivery-agent profile."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );


  useEffect(() => {
    loadProfile();
  }, [
    loadProfile,
  ]);


  /**
   * ============================================================
   * FORMAT DATE
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
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
    };


  /**
   * ============================================================
   * UPDATE AVAILABILITY
   * ============================================================
   */
  const updateAvailability =
    async () => {
      if (!profile) {
        return;
      }


      const currentAvailability =
        profile
          ?.deliveryAgentProfile
          ?.isAvailable !==
        false;


      const nextAvailability =
        !currentAvailability;


      try {
        setSaving(true);
        setError("");
        setMessage("");


        const response =
          await api.patch(
            "/delivery/availability",
            {
              isAvailable:
                nextAvailability,
            }
          );


        const updatedProfile =
          response.data?.user ||
          response.data?.profile ||
          response.data ||
          null;


        if (
          updatedProfile &&
          updatedProfile._id
        ) {
          setProfile(
            updatedProfile
          );


          if (
            typeof updateCurrentUser ===
            "function"
          ) {
            updateCurrentUser(
              updatedProfile
            );
          }
        } else {
          setProfile(
            (
              current
            ) => ({
              ...current,

              deliveryAgentProfile: {
                ...current
                  ?.deliveryAgentProfile,

                isAvailable:
                  nextAvailability,
              },
            })
          );


          if (
            typeof updateCurrentUser ===
            "function"
          ) {
            updateCurrentUser(
              (
                current
              ) => ({
                ...current,

                deliveryAgentProfile: {
                  ...current
                    ?.deliveryAgentProfile,

                  isAvailable:
                    nextAvailability,
                },
              })
            );
          }
        }


        setMessage(
          response.data
            ?.message ||
            `You are now ${
              nextAvailability
                ? "available"
                : "unavailable"
            } for new delivery assignments.`
        );
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to update availability."
          )
        );
      } finally {
        setSaving(false);
      }
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
          text="Loading profile..."
        />

      </main>
    );
  }


  if (!profile) {
    return (
      <main className="delivery-page">

        <div className="delivery-empty-state">

          <FaUserCircle />

          <h3>
            Profile unavailable
          </h3>

          <p>
            Your delivery-agent profile could
            not be loaded.
          </p>


          <button
            type="button"
            className="delivery-primary-button"
            onClick={
              loadProfile
            }
          >
            Retry
          </button>

        </div>

      </main>
    );
  }


  const deliveryProfile =
    profile.deliveryAgentProfile ||
    {};


  const isAvailable =
    deliveryProfile.isAvailable !==
    false;


  return (
    <main className="delivery-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <section className="delivery-page-header">

        <div>

          <span className="delivery-page-eyebrow">
            Agent Account
          </span>

          <h1>
            My Profile
          </h1>

          <p>
            View your NovaCart delivery-agent
            information and control whether you
            are available for new assignments.
          </p>

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
              loadProfile();
            }}
          >
            Retry
          </button>

        </div>
      )}


      {/* ======================================================
          PROFILE HERO
      ====================================================== */}

      <section className="delivery-profile-hero">

        <div className="delivery-profile-avatar">

          {String(
            profile.name ||
              "D"
          )
            .charAt(0)
            .toUpperCase()}

        </div>


        <div className="delivery-profile-hero-content">

          <span>
            Delivery Agent
          </span>

          <h2>
            {profile.name ||
              "Delivery Agent"}
          </h2>

          <p>
            {deliveryProfile.employeeId ||
              "Employee ID not available"}
          </p>

        </div>


        <div
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

        </div>

      </section>


      {/* ======================================================
          AVAILABILITY
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Work Status
            </span>

            <h2>
              Availability
            </h2>

          </div>


          {isAvailable ? (
            <FaToggleOn />
          ) : (
            <FaToggleOff />
          )}

        </div>


        <div className="delivery-availability-panel">

          <div>

            <strong>
              {isAvailable
                ? "You are available for new deliveries."
                : "You are currently unavailable."}
            </strong>


            <p>
              {isAvailable
                ? "Administrators can assign new processing orders to your account."
                : "Administrators will not be able to assign new deliveries until you become available again."}
            </p>

          </div>


          <button
            type="button"
            className={
              isAvailable
                ? "delivery-danger-button"
                : "delivery-primary-button"
            }
            disabled={
              saving
            }
            onClick={
              updateAvailability
            }
          >

            {isAvailable ? (
              <FaToggleOff />
            ) : (
              <FaToggleOn />
            )}


            {saving
              ? "Updating..."
              : isAvailable
              ? "Set Unavailable"
              : "Set Available"}

          </button>

        </div>

      </section>


      {/* ======================================================
          PERSONAL INFORMATION
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Personal Information
            </span>

            <h2>
              Account Details
            </h2>

          </div>


          <FaUserCircle />

        </div>


        <div className="delivery-profile-grid">

          <article>

            <div className="delivery-profile-field-icon">
              <FaUserCircle />
            </div>


            <div>

              <span>
                Full Name
              </span>

              <strong>
                {profile.name ||
                  "-"}
              </strong>

            </div>

          </article>


          <article>

            <div className="delivery-profile-field-icon">
              <FaEnvelope />
            </div>


            <div>

              <span>
                Email Address
              </span>

              <strong>
                {profile.email ||
                  "-"}
              </strong>

            </div>

          </article>


          <article>

            <div className="delivery-profile-field-icon">
              <FaPhoneAlt />
            </div>


            <div>

              <span>
                Phone Number
              </span>

              <strong>
                {profile.phone ||
                  "-"}
              </strong>

            </div>

          </article>


          <article>

            <div className="delivery-profile-field-icon">
              <FaIdBadge />
            </div>


            <div>

              <span>
                Employee ID
              </span>

              <strong>
                {deliveryProfile.employeeId ||
                  "-"}
              </strong>

            </div>

          </article>

        </div>

      </section>


      {/* ======================================================
          DELIVERY INFORMATION
      ====================================================== */}

      <section className="delivery-card">

        <div className="delivery-card-header">

          <div>

            <span>
              Work Information
            </span>

            <h2>
              Delivery Details
            </h2>

          </div>


          <FaTruck />

        </div>


        <div className="delivery-profile-grid">

          <article>

            <div className="delivery-profile-field-icon">
              <FaTruck />
            </div>


            <div>

              <span>
                Vehicle Number
              </span>

              <strong>
                {deliveryProfile.vehicleNumber ||
                  "-"}
              </strong>

            </div>

          </article>


          <article>

            <div className="delivery-profile-field-icon">
              <FaMapMarkerAlt />
            </div>


            <div>

              <span>
                Delivery Area
              </span>

              <strong>
                {deliveryProfile.deliveryArea ||
                  "-"}
              </strong>

            </div>

          </article>


          <article>

            <div className="delivery-profile-field-icon">
              <FaIdBadge />
            </div>


            <div>

              <span>
                Account Status
              </span>

              <strong>
                {profile.isActive !==
                false
                  ? "Active"
                  : "Disabled"}
              </strong>

            </div>

          </article>


          <article>

            <div className="delivery-profile-field-icon">
              <FaUserCircle />
            </div>


            <div>

              <span>
                Joined NovaCart
              </span>

              <strong>
                {formatDate(
                  deliveryProfile.joinedAt ||
                    profile.createdAt
                )}
              </strong>

            </div>

          </article>

        </div>

      </section>


      {/* ======================================================
          INFORMATION NOTE
      ====================================================== */}

      <section className="delivery-profile-note">

        <FaIdBadge />


        <div>

          <strong>
            Need to change your official agent information?
          </strong>


          <p>
            Employee ID, vehicle number, delivery
            area, name, email, phone, and account
            status are managed by the NovaCart
            administrator. Contact the administrator
            if any official information needs to be
            updated.
          </p>

        </div>

      </section>

    </main>
  );
};


export default DeliveryProfile;