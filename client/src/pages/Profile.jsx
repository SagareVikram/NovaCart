import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCheck,
  FaEdit,
  FaEnvelope,
  FaHome,
  FaKey,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaPlus,
  FaSave,
  FaTrash,
  FaUser,
} from "react-icons/fa";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

import {
  useAuth,
} from "../context/AuthContext.jsx";

const emptyAddress = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  label: "Home",
  isDefault: false,
};

const Profile = () => {
  const {
    user,
    loading: authLoading,
    refreshUser,
    updateCurrentUser,
  } = useAuth();

  const [
    activeTab,
    setActiveTab,
  ] = useState("profile");

  const [
    profileForm,
    setProfileForm,
  ] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [
    passwordForm,
    setPasswordForm,
  ] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [
    addresses,
    setAddresses,
  ] = useState([]);

  const [
    addressForm,
    setAddressForm,
  ] = useState(emptyAddress);

  const [
    editingAddressId,
    setEditingAddressId,
  ] = useState("");

  const [
    showAddressForm,
    setShowAddressForm,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm({
      name:
        user.name || "",
      email:
        user.email || "",
      phone:
        user.phone || "",
    });
  }, [user]);

  useEffect(() => {
    let mounted = true;

    const loadAddresses =
      async () => {
        try {
          setLoading(true);

          const response =
            await api.get(
              "/users/addresses"
            );

          if (!mounted) {
            return;
          }

          setAddresses(
            response.data
              ?.addresses || []
          );
        } catch (error) {
          if (!mounted) {
            return;
          }

          setError(
            getApiErrorMessage(
              error,
              "Unable to load profile information."
            )
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadAddresses();

    return () => {
      mounted = false;
    };
  }, []);

  const defaultAddress =
    useMemo(
      () =>
        addresses.find(
          (address) =>
            address.isDefault
        ) || null,
      [addresses]
    );

  const resetMessages =
    () => {
      setMessage("");
      setError("");
    };

  const handleProfileChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setProfileForm(
        (current) => ({
          ...current,
          [name]: value,
        })
      );

      resetMessages();
    };

  const handlePasswordChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setPasswordForm(
        (current) => ({
          ...current,
          [name]: value,
        })
      );

      resetMessages();
    };

  const handleAddressChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setAddressForm(
        (current) => ({
          ...current,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );

      resetMessages();
    };

  const handleProfileSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      resetMessages();

      if (
        !profileForm.name.trim()
      ) {
        setError(
          "Please enter your name."
        );

        return;
      }

      try {
        setSaving(true);

        const response =
          await api.put(
            "/users/profile",
            {
              name:
                profileForm.name.trim(),

              phone:
                profileForm.phone.trim(),
            }
          );

        if (
          response.data?.user
        ) {
          updateCurrentUser(
            response.data.user
          );
        } else {
          await refreshUser();
        }

        setMessage(
          response.data
            ?.message ||
            "Profile updated successfully."
        );
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to update profile."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const handlePasswordSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      resetMessages();

      if (
        !passwordForm.currentPassword ||
        !passwordForm.newPassword ||
        !passwordForm.confirmPassword
      ) {
        setError(
          "Please complete all password fields."
        );

        return;
      }

      if (
        passwordForm.newPassword.length <
        6
      ) {
        setError(
          "New password must contain at least 6 characters."
        );

        return;
      }

      if (
        passwordForm.newPassword !==
        passwordForm.confirmPassword
      ) {
        setError(
          "New passwords do not match."
        );

        return;
      }

      try {
        setSaving(true);

        const response =
          await api.put(
            "/users/change-password",
            {
              currentPassword:
                passwordForm.currentPassword,

              newPassword:
                passwordForm.newPassword,
            }
          );

        setMessage(
          response.data
            ?.message ||
            "Password changed successfully."
        );

        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to change password."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const validateAddress =
    () => {
      const required = [
        "fullName",
        "phone",
        "addressLine1",
        "city",
        "state",
        "postalCode",
      ];

      return required.every(
        (field) =>
          String(
            addressForm[field] ||
              ""
          ).trim()
      );
    };

  const openNewAddressForm =
    () => {
      resetMessages();

      setEditingAddressId("");

      setAddressForm({
        ...emptyAddress,

        fullName:
          user?.name || "",

        phone:
          user?.phone || "",
      });

      setShowAddressForm(
        true
      );
    };

  const openEditAddress =
    (address) => {
      resetMessages();

      setEditingAddressId(
        address._id
      );

      setAddressForm({
        fullName:
          address.fullName ||
          "",

        phone:
          address.phone ||
          "",

        addressLine1:
          address.addressLine1 ||
          "",

        addressLine2:
          address.addressLine2 ||
          "",

        city:
          address.city ||
          "",

        state:
          address.state ||
          "",

        postalCode:
          address.postalCode ||
          "",

        country:
          address.country ||
          "India",

        label:
          address.label ||
          "Home",

        isDefault:
          Boolean(
            address.isDefault
          ),
      });

      setShowAddressForm(
        true
      );
    };

  const closeAddressForm =
    () => {
      setShowAddressForm(
        false
      );

      setEditingAddressId(
        ""
      );

      setAddressForm(
        emptyAddress
      );
    };

  const refreshAddresses =
    async () => {
      const response =
        await api.get(
          "/users/addresses"
        );

      const updated =
        response.data
          ?.addresses || [];

      setAddresses(
        updated
      );

      return updated;
    };

  const handleAddressSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      resetMessages();

      if (
        !validateAddress()
      ) {
        setError(
          "Please complete all required address fields."
        );

        return;
      }

      try {
        setSaving(true);

        const payload = {
          fullName:
            addressForm.fullName.trim(),

          phone:
            addressForm.phone.trim(),

          addressLine1:
            addressForm.addressLine1.trim(),

          addressLine2:
            addressForm.addressLine2.trim(),

          city:
            addressForm.city.trim(),

          state:
            addressForm.state.trim(),

          postalCode:
            addressForm.postalCode.trim(),

          country:
            addressForm.country.trim() ||
            "India",

          label:
            addressForm.label,

          isDefault:
            addressForm.isDefault,
        };

        let response;

        if (
          editingAddressId
        ) {
          response =
            await api.put(
              `/users/addresses/${editingAddressId}`,
              payload
            );
        } else {
          response =
            await api.post(
              "/users/addresses",
              payload
            );
        }

        if (
          response.data
            ?.addresses
        ) {
          setAddresses(
            response.data.addresses
          );
        } else {
          await refreshAddresses();
        }

        setMessage(
          response.data
            ?.message ||
            (editingAddressId
              ? "Address updated successfully."
              : "Address added successfully.")
        );

        closeAddressForm();

        await refreshUser();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to save address."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const handleDeleteAddress =
    async (
      addressId
    ) => {
      resetMessages();

      const confirmed =
        window.confirm(
          "Are you sure you want to delete this address?"
        );

      if (!confirmed) {
        return;
      }

      try {
        setSaving(true);

        const response =
          await api.delete(
            `/users/addresses/${addressId}`
          );

        if (
          response.data
            ?.addresses
        ) {
          setAddresses(
            response.data.addresses
          );
        } else {
          await refreshAddresses();
        }

        setMessage(
          response.data
            ?.message ||
            "Address deleted successfully."
        );

        await refreshUser();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to delete address."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  const handleSetDefault =
    async (
      addressId
    ) => {
      resetMessages();

      try {
        setSaving(true);

        const response =
          await api.patch(
            `/users/addresses/${addressId}/default`
          );

        if (
          response.data
            ?.addresses
        ) {
          setAddresses(
            response.data.addresses
          );
        } else {
          await refreshAddresses();
        }

        setMessage(
          response.data
            ?.message ||
            "Default address updated."
        );

        await refreshUser();
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Unable to set default address."
          )
        );
      } finally {
        setSaving(false);
      }
    };

  if (
    loading ||
    authLoading
  ) {
    return (
      <main className="profile-page">
        <Loader
          fullPage
          text="Loading your account..."
        />
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-page-header">
        <div className="container">
          <span className="section-eyebrow">
            My Account
          </span>

          <h1>
            Account Settings
          </h1>

          <p>
            Manage your personal details,
            password, and delivery addresses.
          </p>
        </div>
      </section>

      <section className="profile-main-section section-spacing">
        <div className="container">
          <div className="profile-layout">
            <aside className="profile-sidebar">
              <div className="profile-summary-card">
                <div className="profile-avatar">
                  <FaUser />
                </div>

                <h2>
                  {user?.name}
                </h2>

                <span>
                  {user?.email}
                </span>

                <small>
                  Customer Account
                </small>
              </div>

              <div className="profile-tabs">
                <button
                  type="button"
                  className={
                    activeTab ===
                    "profile"
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    resetMessages();
                    setActiveTab(
                      "profile"
                    );
                  }}
                >
                  <FaUser />

                  Profile
                </button>

                <button
                  type="button"
                  className={
                    activeTab ===
                    "addresses"
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    resetMessages();
                    setActiveTab(
                      "addresses"
                    );
                  }}
                >
                  <FaMapMarkerAlt />

                  Addresses
                </button>

                <button
                  type="button"
                  className={
                    activeTab ===
                    "password"
                      ? "active"
                      : ""
                  }
                  onClick={() => {
                    resetMessages();
                    setActiveTab(
                      "password"
                    );
                  }}
                >
                  <FaKey />

                  Password
                </button>
              </div>

              {defaultAddress && (
                <div className="profile-default-address-preview">
                  <div>
                    <FaHome />

                    <strong>
                      Default Address
                    </strong>
                  </div>

                  <p>
                    {
                      defaultAddress.addressLine1
                    }
                  </p>

                  <span>
                    {
                      defaultAddress.city
                    }
                    ,{" "}
                    {
                      defaultAddress.state
                    }
                  </span>
                </div>
              )}
            </aside>

            <div className="profile-content">
              {message && (
                <div className="profile-message success">
                  {message}
                </div>
              )}

              {error && (
                <div className="profile-message error">
                  {error}
                </div>
              )}

              {activeTab ===
                "profile" && (
                <section className="profile-card">
                  <div className="profile-card-heading">
                    <div>
                      <span className="section-eyebrow">
                        Personal Information
                      </span>

                      <h2>
                        My Profile
                      </h2>

                      <p>
                        Keep your account
                        information up to
                        date.
                      </p>
                    </div>

                    <FaUser />
                  </div>

                  <form
                    className="profile-form"
                    onSubmit={
                      handleProfileSubmit
                    }
                  >
                    <div className="profile-form-grid">
                      <div className="form-group">
                        <label htmlFor="profile-name">
                          Full Name
                        </label>

                        <div className="profile-input-wrap">
                          <FaUser />

                          <input
                            id="profile-name"
                            name="name"
                            type="text"
                            value={
                              profileForm.name
                            }
                            onChange={
                              handleProfileChange
                            }
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="profile-email">
                          Email Address
                        </label>

                        <div className="profile-input-wrap">
                          <FaEnvelope />

                          <input
                            id="profile-email"
                            name="email"
                            type="email"
                            value={
                              profileForm.email
                            }
                            disabled
                          />
                        </div>

                        <small>
                          Email is used as
                          your login ID.
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="profile-phone">
                          Phone Number
                        </label>

                        <div className="profile-input-wrap">
                          <FaPhoneAlt />

                          <input
                            id="profile-phone"
                            name="phone"
                            type="tel"
                            value={
                              profileForm.phone
                            }
                            onChange={
                              handleProfileChange
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="primary-button profile-save-button"
                      disabled={
                        saving
                      }
                    >
                      <FaSave />

                      {saving
                        ? "Saving..."
                        : "Save Changes"}
                    </button>
                  </form>
                </section>
              )}

              {activeTab ===
                "addresses" && (
                <section className="profile-card">
                  <div className="profile-card-heading profile-address-heading">
                    <div>
                      <span className="section-eyebrow">
                        Delivery Details
                      </span>

                      <h2>
                        Saved Addresses
                      </h2>

                      <p>
                        Manage addresses used
                        during checkout.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="primary-button"
                      onClick={
                        openNewAddressForm
                      }
                    >
                      <FaPlus />

                      Add Address
                    </button>
                  </div>

                  {showAddressForm && (
                    <form
                      className="profile-address-form"
                      onSubmit={
                        handleAddressSubmit
                      }
                    >
                      <div className="profile-address-form-title">
                        <h3>
                          {editingAddressId
                            ? "Edit Address"
                            : "Add New Address"}
                        </h3>

                        <button
                          type="button"
                          onClick={
                            closeAddressForm
                          }
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="profile-form-grid">
                        <div className="form-group">
                          <label>
                            Full Name *
                          </label>

                          <input
                            name="fullName"
                            type="text"
                            value={
                              addressForm.fullName
                            }
                            onChange={
                              handleAddressChange
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            Phone *
                          </label>

                          <input
                            name="phone"
                            type="tel"
                            value={
                              addressForm.phone
                            }
                            onChange={
                              handleAddressChange
                            }
                            required
                          />
                        </div>

                        <div className="form-group profile-form-full">
                          <label>
                            Address Line 1 *
                          </label>

                          <input
                            name="addressLine1"
                            type="text"
                            value={
                              addressForm.addressLine1
                            }
                            onChange={
                              handleAddressChange
                            }
                            required
                          />
                        </div>

                        <div className="form-group profile-form-full">
                          <label>
                            Address Line 2
                          </label>

                          <input
                            name="addressLine2"
                            type="text"
                            value={
                              addressForm.addressLine2
                            }
                            onChange={
                              handleAddressChange
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            City *
                          </label>

                          <input
                            name="city"
                            type="text"
                            value={
                              addressForm.city
                            }
                            onChange={
                              handleAddressChange
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            State *
                          </label>

                          <input
                            name="state"
                            type="text"
                            value={
                              addressForm.state
                            }
                            onChange={
                              handleAddressChange
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            Postal Code *
                          </label>

                          <input
                            name="postalCode"
                            type="text"
                            value={
                              addressForm.postalCode
                            }
                            onChange={
                              handleAddressChange
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            Country
                          </label>

                          <input
                            name="country"
                            type="text"
                            value={
                              addressForm.country
                            }
                            onChange={
                              handleAddressChange
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>
                            Label
                          </label>

                          <select
                            name="label"
                            value={
                              addressForm.label
                            }
                            onChange={
                              handleAddressChange
                            }
                          >
                            <option value="Home">
                              Home
                            </option>

                            <option value="Work">
                              Work
                            </option>

                            <option value="Other">
                              Other
                            </option>
                          </select>
                        </div>

                        <div className="form-group profile-address-default">
                          <label>
                            <input
                              name="isDefault"
                              type="checkbox"
                              checked={
                                addressForm.isDefault
                              }
                              onChange={
                                handleAddressChange
                              }
                            />

                            Make default address
                          </label>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="primary-button"
                        disabled={
                          saving
                        }
                      >
                        <FaSave />

                        {saving
                          ? "Saving..."
                          : editingAddressId
                            ? "Update Address"
                            : "Save Address"}
                      </button>
                    </form>
                  )}

                  {addresses.length >
                  0 ? (
                    <div className="profile-address-grid">
                      {addresses.map(
                        (
                          address
                        ) => (
                          <article
                            key={
                              address._id
                            }
                            className={`profile-address-card ${
                              address.isDefault
                                ? "default"
                                : ""
                            }`}
                          >
                            <div className="profile-address-card-top">
                              <div className="profile-address-label">
                                <FaMapMarkerAlt />

                                <span>
                                  {
                                    address.label
                                  }
                                </span>
                              </div>

                              {address.isDefault && (
                                <span className="profile-default-badge">
                                  <FaCheck />

                                  Default
                                </span>
                              )}
                            </div>

                            <h3>
                              {
                                address.fullName
                              }
                            </h3>

                            <p>
                              {
                                address.addressLine1
                              }
                            </p>

                            {address.addressLine2 && (
                              <p>
                                {
                                  address.addressLine2
                                }
                              </p>
                            )}

                            <p>
                              {
                                address.city
                              }
                              ,{" "}
                              {
                                address.state
                              }{" "}
                              -{" "}
                              {
                                address.postalCode
                              }
                            </p>

                            <p>
                              {
                                address.country
                              }
                            </p>

                            <span className="profile-address-phone">
                              <FaPhoneAlt />

                              {
                                address.phone
                              }
                            </span>

                            <div className="profile-address-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  openEditAddress(
                                    address
                                  )
                                }
                              >
                                <FaEdit />

                                Edit
                              </button>

                              {!address.isDefault && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSetDefault(
                                      address._id
                                    )
                                  }
                                >
                                  <FaCheck />

                                  Set Default
                                </button>
                              )}

                              <button
                                type="button"
                                className="danger"
                                onClick={() =>
                                  handleDeleteAddress(
                                    address._id
                                  )
                                }
                              >
                                <FaTrash />

                                Delete
                              </button>
                            </div>
                          </article>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="profile-empty-addresses">
                      <FaMapMarkerAlt />

                      <h3>
                        No saved addresses
                      </h3>

                      <p>
                        Add an address now or
                        save one during checkout.
                      </p>

                      <button
                        type="button"
                        className="primary-button"
                        onClick={
                          openNewAddressForm
                        }
                      >
                        <FaPlus />

                        Add Address
                      </button>
                    </div>
                  )}
                </section>
              )}

              {activeTab ===
                "password" && (
                <section className="profile-card">
                  <div className="profile-card-heading">
                    <div>
                      <span className="section-eyebrow">
                        Account Security
                      </span>

                      <h2>
                        Change Password
                      </h2>

                      <p>
                        Update your NovaCart
                        login password securely.
                      </p>
                    </div>

                    <FaKey />
                  </div>

                  <form
                    className="profile-form"
                    onSubmit={
                      handlePasswordSubmit
                    }
                  >
                    <div className="profile-form-grid">
                      <div className="form-group profile-form-full">
                        <label htmlFor="current-password">
                          Current Password
                        </label>

                        <input
                          id="current-password"
                          name="currentPassword"
                          type="password"
                          autoComplete="current-password"
                          value={
                            passwordForm.currentPassword
                          }
                          onChange={
                            handlePasswordChange
                          }
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="new-password">
                          New Password
                        </label>

                        <input
                          id="new-password"
                          name="newPassword"
                          type="password"
                          autoComplete="new-password"
                          value={
                            passwordForm.newPassword
                          }
                          onChange={
                            handlePasswordChange
                          }
                          minLength="6"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirm-new-password">
                          Confirm New Password
                        </label>

                        <input
                          id="confirm-new-password"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          value={
                            passwordForm.confirmPassword
                          }
                          onChange={
                            handlePasswordChange
                          }
                          minLength="6"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="primary-button profile-save-button"
                      disabled={
                        saving
                      }
                    >
                      <FaKey />

                      {saving
                        ? "Updating..."
                        : "Change Password"}
                    </button>
                  </form>
                </section>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Profile;