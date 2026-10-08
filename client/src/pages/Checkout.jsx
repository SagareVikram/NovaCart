import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCheckCircle,
  FaCreditCard,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaShieldAlt,
  FaShoppingCart,
  FaTruck,
  FaUniversity,
} from "react-icons/fa";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";

import {
  useCart,
} from "../context/CartContext.jsx";

import {
  useAuth,
} from "../context/AuthContext.jsx";

const initialAddressForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India",
  label: "Home",
  saveAddress: true,
  makeDefault: false,
};

const Checkout = () => {
  const navigate =
    useNavigate();

  const {
    user,
    updateCurrentUser,
  } = useAuth();

  const {
    items,
    subtotal,
    totalItems,
    isEmpty,
    loading: cartLoading,
    getCartSummary,
    refreshCart,
  } = useCart();

  const [
    addresses,
    setAddresses,
  ] = useState([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState("");

  const [
    useNewAddress,
    setUseNewAddress,
  ] = useState(false);

  const [
    addressForm,
    setAddressForm,
  ] = useState({
    ...initialAddressForm,
    fullName:
      user?.name || "",
    phone:
      user?.phone || "",
  });

  const [
    paymentMethod,
    setPaymentMethod,
  ] = useState("cod");

  const [
    customerNote,
    setCustomerNote,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    placingOrder,
    setPlacingOrder,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /**
   * Keep name / phone filled from profile
   * when available.
   */
  useEffect(() => {
    setAddressForm(
      (current) => ({
        ...current,

        fullName:
          current.fullName ||
          user?.name ||
          "",

        phone:
          current.phone ||
          user?.phone ||
          "",
      })
    );
  }, [user]);

  /**
   * Initial checkout preparation:
   *
   * 1. Load saved addresses
   * 2. Synchronize cart against current
   *    product price / stock
   */
  useEffect(() => {
    let mounted = true;

    const loadCheckout =
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            addressResponse,
            cartResponse,
          ] =
            await Promise.all([
              api.get(
                "/users/addresses"
              ),

              getCartSummary(),
            ]);

          if (!mounted) {
            return;
          }

          const savedAddresses =
            Array.isArray(
              addressResponse.data
                ?.addresses
            )
              ? addressResponse.data
                  .addresses
              : [];

          setAddresses(
            savedAddresses
          );

          const defaultAddress =
            savedAddresses.find(
              (address) =>
                address.isDefault
            );

          if (
            defaultAddress?._id
          ) {
            setSelectedAddressId(
              String(
                defaultAddress._id
              )
            );

            setUseNewAddress(
              false
            );
          } else if (
            savedAddresses[0]?._id
          ) {
            setSelectedAddressId(
              String(
                savedAddresses[0]._id
              )
            );

            setUseNewAddress(
              false
            );
          } else {
            setSelectedAddressId(
              ""
            );

            setUseNewAddress(
              true
            );
          }

          if (
            !cartResponse?.success
          ) {
            setError(
              cartResponse
                ?.message ||
                "Unable to prepare checkout."
            );
          }
        } catch (error) {
          if (!mounted) {
            return;
          }

          setError(
            getApiErrorMessage(
              error,
              "Unable to prepare checkout."
            )
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadCheckout();

    return () => {
      mounted = false;
    };
  }, [getCartSummary]);

  /**
   * Shipping policy matches backend:
   *
   * subtotal >= 500 => free
   * subtotal < 500  => ₹50
   */
  const shippingCharge =
    subtotal >= 500 ||
    subtotal === 0
      ? 0
      : 50;

  const taxAmount = 0;

  const discountAmount = 0;

  const totalAmount =
    useMemo(
      () =>
        Number(
          Math.max(
            subtotal +
              shippingCharge +
              taxAmount -
              discountAmount,
            0
          ).toFixed(2)
        ),
      [
        subtotal,
        shippingCharge,
        taxAmount,
        discountAmount,
      ]
    );

  const selectedAddress =
    useMemo(
      () =>
        addresses.find(
          (address) =>
            String(
              address._id
            ) ===
            String(
              selectedAddressId
            )
        ) || null,
      [
        addresses,
        selectedAddressId,
      ]
    );

  const formatPrice = (
    value
  ) => {
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

      setError("");
    };

  const validateNewAddress =
    () => {
      const requiredFields =
        [
          "fullName",
          "phone",
          "addressLine1",
          "city",
          "state",
          "postalCode",
        ];

      for (
        const field of
        requiredFields
      ) {
        if (
          !String(
            addressForm[
              field
            ] || ""
          ).trim()
        ) {
          return "Please complete all required delivery address fields.";
        }
      }

      if (
        addressForm.fullName
          .trim().length >
        100
      ) {
        return "Full name cannot exceed 100 characters.";
      }

      if (
        addressForm.phone
          .trim().length >
        20
      ) {
        return "Phone number cannot exceed 20 characters.";
      }

      if (
        addressForm.addressLine1
          .trim().length >
        200
      ) {
        return "Address line 1 cannot exceed 200 characters.";
      }

      if (
        addressForm.addressLine2
          .trim().length >
        200
      ) {
        return "Address line 2 cannot exceed 200 characters.";
      }

      if (
        addressForm.city
          .trim().length >
        100
      ) {
        return "City cannot exceed 100 characters.";
      }

      if (
        addressForm.state
          .trim().length >
        100
      ) {
        return "State cannot exceed 100 characters.";
      }

      if (
        addressForm.postalCode
          .trim().length >
        20
      ) {
        return "Postal code cannot exceed 20 characters.";
      }

      if (
        addressForm.country
          .trim().length >
        100
      ) {
        return "Country cannot exceed 100 characters.";
      }

      return "";
    };

  /**
   * Save address through user API.
   *
   * POST /api/users/addresses
   */
  const saveNewAddress =
    async () => {
      const response =
        await api.post(
          "/users/addresses",
          {
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
              Boolean(
                addressForm.makeDefault
              ),
          }
        );

      const updatedAddresses =
        Array.isArray(
          response.data
            ?.addresses
        )
          ? response.data
              .addresses
          : [];

      setAddresses(
        updatedAddresses
      );

      /**
       * New address is pushed at the end
       * by userController.addAddress().
       */
      const newlyAddedAddress =
        updatedAddresses[
          updatedAddresses.length -
            1
        ] || null;

      if (
        newlyAddedAddress?._id
      ) {
        setSelectedAddressId(
          String(
            newlyAddedAddress._id
          )
        );
      }

      /**
       * Keep AuthContext profile/address
       * state synchronized.
       */
      const profileResponse =
        await api.get(
          "/users/profile"
        );

      if (
        profileResponse.data
          ?.user
      ) {
        updateCurrentUser(
          profileResponse.data
            .user
        );
      }

      return newlyAddedAddress;
    };

  const handlePlaceOrder =
    async (event) => {
      event.preventDefault();

      if (placingOrder) {
        return;
      }

      setError("");
      setSuccessMessage("");

      /**
       * Re-synchronize cart immediately
       * before creating the order.
       *
       * This catches price / stock changes
       * that happened while the customer was
       * filling checkout.
       */
      const latestCartResult =
        await getCartSummary();

      if (
        !latestCartResult
          ?.success
      ) {
        setError(
          latestCartResult
            ?.message ||
            "Unable to verify your cart."
        );

        return;
      }

      if (
        latestCartResult
          .summary?.isEmpty
      ) {
        setError(
          "Your cart is empty."
        );

        return;
      }

      if (
        useNewAddress
      ) {
        const addressError =
          validateNewAddress();

        if (addressError) {
          setError(
            addressError
          );

          return;
        }
      }

      if (
        !useNewAddress &&
        !selectedAddressId
      ) {
        setError(
          "Please select a delivery address."
        );

        return;
      }

      if (
        ![
          "cod",
          "upi",
          "card",
        ].includes(
          paymentMethod
        )
      ) {
        setError(
          "Please select a valid payment method."
        );

        return;
      }

      try {
        setPlacingOrder(
          true
        );

        let savedAddressId =
          selectedAddressId;

        if (
          useNewAddress &&
          addressForm.saveAddress
        ) {
          const savedAddress =
            await saveNewAddress();

          if (
            !savedAddress?._id
          ) {
            throw new Error(
              "Address was saved but its ID was not returned."
            );
          }

          savedAddressId =
            String(
              savedAddress._id
            );
        }

        const payload = {
          paymentMethod,

          customerNote:
            customerNote.trim(),
        };

        /**
         * Order controller accepts either:
         *
         * savedAddressId
         *
         * OR
         *
         * shippingAddress
         */
        if (
          useNewAddress &&
          !addressForm.saveAddress
        ) {
          payload.shippingAddress =
            {
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
            };
        } else {
          payload.savedAddressId =
            savedAddressId;
        }

        const response =
          await api.post(
            "/orders",
            payload
          );

        const order =
          response.data?.order;

        if (!order?._id) {
          throw new Error(
            "Order was created but complete order details were not returned."
          );
        }

        setSuccessMessage(
          response.data
            ?.message ||
            "Order placed successfully."
        );

        /**
         * Backend empties cart inside the
         * same successful order transaction.
         */
        await refreshCart({
          silent: true,
        });

        /**
         * Customer order details endpoint
         * supports both MongoDB _id and
         * orderNumber.
         *
         * Prefer human-readable orderNumber.
         */
        navigate(
          `/orders/${
            order.orderNumber ||
            order._id
          }`,
          {
            replace: true,

            state: {
              justPlaced:
                true,
            },
          }
        );
      } catch (error) {
        /**
         * If stock changed during checkout,
         * refresh cart so the customer sees
         * current values immediately.
         */
        if (
          error.response
            ?.status === 409 ||
          error.response
            ?.status === 400
        ) {
          await refreshCart({
            silent: true,
          });
        }

        setError(
          getApiErrorMessage(
            error,
            error.message ||
              "Unable to place your order."
          )
        );
      } finally {
        setPlacingOrder(
          false
        );
      }
    };

  if (
    loading ||
    cartLoading
  ) {
    return (
      <main className="checkout-page">
        <Loader
          fullPage
          text="Preparing checkout..."
        />
      </main>
    );
  }

  if (isEmpty) {
    return (
      <main className="checkout-page">
        <section className="checkout-empty-section section-spacing">
          <div className="container">
            <div className="checkout-empty-card">
              <div className="checkout-empty-icon">
                <FaShoppingCart />
              </div>

              <h1>
                Nothing to Checkout
              </h1>

              <p>
                Your shopping cart is
                currently empty.
              </p>

              <Link
                to="/products"
                className="primary-button"
              >
                Browse Products
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="checkout-page-header">
        <div className="container">
          <span className="section-eyebrow">
            Secure Checkout
          </span>

          <h1>
            Complete Your Order
          </h1>

          <p>
            Confirm your delivery details
            and choose a payment method.
          </p>
        </div>
      </section>

      <section className="checkout-main-section section-spacing">
        <div className="container">
          {error && (
            <div className="checkout-message error">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="checkout-message success">
              {
                successMessage
              }
            </div>
          )}

          <form
            className="checkout-layout"
            onSubmit={
              handlePlaceOrder
            }
          >
            <div className="checkout-left-column">
              {/* =============================================
                  DELIVERY ADDRESS
              ============================================== */}

              <section className="checkout-card">
                <div className="checkout-card-heading">
                  <div className="checkout-step-number">
                    1
                  </div>

                  <div>
                    <h2>
                      Delivery Address
                    </h2>

                    <p>
                      Choose where you want
                      your order delivered.
                    </p>
                  </div>
                </div>

                {addresses.length >
                  0 && (
                  <div className="checkout-saved-addresses">
                    {addresses.map(
                      (
                        address
                      ) => {
                        const selected =
                          !useNewAddress &&
                          String(
                            selectedAddressId
                          ) ===
                            String(
                              address._id
                            );

                        return (
                          <label
                            key={
                              address._id
                            }
                            className={`checkout-address-card ${
                              selected
                                ? "selected"
                                : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="selectedAddress"
                              checked={
                                selected
                              }
                              onChange={() => {
                                setUseNewAddress(
                                  false
                                );

                                setSelectedAddressId(
                                  String(
                                    address._id
                                  )
                                );

                                setError(
                                  ""
                                );
                              }}
                            />

                            <div className="checkout-address-icon">
                              <FaMapMarkerAlt />
                            </div>

                            <div className="checkout-address-content">
                              <div className="checkout-address-top">
                                <strong>
                                  {
                                    address.fullName
                                  }
                                </strong>

                                <span>
                                  {address.label ||
                                    "Home"}
                                </span>

                                {address.isDefault && (
                                  <small>
                                    Default
                                  </small>
                                )}
                              </div>

                              <p>
                                {
                                  address.addressLine1
                                }

                                {address.addressLine2
                                  ? `, ${address.addressLine2}`
                                  : ""}
                              </p>

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
                                {address.country ||
                                  "India"}
                              </p>

                              <span className="checkout-address-phone">
                                {
                                  address.phone
                                }
                              </span>
                            </div>

                            {selected && (
                              <FaCheckCircle className="checkout-address-selected-icon" />
                            )}
                          </label>
                        );
                      }
                    )}
                  </div>
                )}

                <button
                  type="button"
                  className={`checkout-new-address-toggle ${
                    useNewAddress
                      ? "active"
                      : ""
                  }`}
                  onClick={() => {
                    setUseNewAddress(
                      true
                    );

                    setError(
                      ""
                    );
                  }}
                >
                  <FaPlus />

                  Add New Address
                </button>

                {useNewAddress && (
                  <div className="checkout-address-form">
                    <div className="checkout-form-grid">
                      <div className="form-group">
                        <label htmlFor="fullName">
                          Full Name *
                        </label>

                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          maxLength={100}
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
                        <label htmlFor="phone">
                          Phone *
                        </label>

                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          maxLength={20}
                          value={
                            addressForm.phone
                          }
                          onChange={
                            handleAddressChange
                          }
                          required
                        />
                      </div>

                      <div className="form-group checkout-form-full">
                        <label htmlFor="addressLine1">
                          Address Line 1 *
                        </label>

                        <input
                          id="addressLine1"
                          name="addressLine1"
                          type="text"
                          maxLength={200}
                          value={
                            addressForm.addressLine1
                          }
                          onChange={
                            handleAddressChange
                          }
                          placeholder="House no., building, street"
                          required
                        />
                      </div>

                      <div className="form-group checkout-form-full">
                        <label htmlFor="addressLine2">
                          Address Line 2
                        </label>

                        <input
                          id="addressLine2"
                          name="addressLine2"
                          type="text"
                          maxLength={200}
                          value={
                            addressForm.addressLine2
                          }
                          onChange={
                            handleAddressChange
                          }
                          placeholder="Area, landmark"
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="city">
                          City *
                        </label>

                        <input
                          id="city"
                          name="city"
                          type="text"
                          maxLength={100}
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
                        <label htmlFor="state">
                          State *
                        </label>

                        <input
                          id="state"
                          name="state"
                          type="text"
                          maxLength={100}
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
                        <label htmlFor="postalCode">
                          Postal Code *
                        </label>

                        <input
                          id="postalCode"
                          name="postalCode"
                          type="text"
                          maxLength={20}
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
                        <label htmlFor="country">
                          Country
                        </label>

                        <input
                          id="country"
                          name="country"
                          type="text"
                          maxLength={100}
                          value={
                            addressForm.country
                          }
                          onChange={
                            handleAddressChange
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="label">
                          Address Label
                        </label>

                        <select
                          id="label"
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
                    </div>

                    <div className="checkout-address-options">
                      <label>
                        <input
                          type="checkbox"
                          name="saveAddress"
                          checked={
                            addressForm.saveAddress
                          }
                          onChange={
                            handleAddressChange
                          }
                        />

                        Save this address to
                        my account
                      </label>

                      {addressForm.saveAddress && (
                        <label>
                          <input
                            type="checkbox"
                            name="makeDefault"
                            checked={
                              addressForm.makeDefault
                            }
                            onChange={
                              handleAddressChange
                            }
                          />

                          Make this my default
                          address
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </section>

              {/* =============================================
                  PAYMENT
              ============================================== */}

              <section className="checkout-card">
                <div className="checkout-card-heading">
                  <div className="checkout-step-number">
                    2
                  </div>

                  <div>
                    <h2>
                      Payment Method
                    </h2>

                    <p>
                      Choose how you want
                      to pay.
                    </p>
                  </div>
                </div>

                <div className="checkout-payment-options">
                  <label
                    className={`checkout-payment-card ${
                      paymentMethod ===
                      "cod"
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={
                        paymentMethod ===
                        "cod"
                      }
                      onChange={(
                        event
                      ) =>
                        setPaymentMethod(
                          event.target
                            .value
                        )
                      }
                    />

                    <div className="checkout-payment-icon">
                      <FaMoneyBillWave />
                    </div>

                    <div>
                      <strong>
                        Cash on Delivery
                      </strong>

                      <span>
                        Pay when your order
                        is delivered.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`checkout-payment-card ${
                      paymentMethod ===
                      "upi"
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={
                        paymentMethod ===
                        "upi"
                      }
                      onChange={(
                        event
                      ) =>
                        setPaymentMethod(
                          event.target
                            .value
                        )
                      }
                    />

                    <div className="checkout-payment-icon">
                      <FaUniversity />
                    </div>

                    <div>
                      <strong>
                        UPI
                      </strong>

                      <span>
                        Demo UPI payment for
                        this college project.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`checkout-payment-card ${
                      paymentMethod ===
                      "card"
                        ? "selected"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={
                        paymentMethod ===
                        "card"
                      }
                      onChange={(
                        event
                      ) =>
                        setPaymentMethod(
                          event.target
                            .value
                        )
                      }
                    />

                    <div className="checkout-payment-icon">
                      <FaCreditCard />
                    </div>

                    <div>
                      <strong>
                        Card
                      </strong>

                      <span>
                        Demo card payment for
                        this college project.
                      </span>
                    </div>
                  </label>
                </div>

                {(paymentMethod ===
                  "upi" ||
                  paymentMethod ===
                    "card") && (
                  <div className="checkout-demo-payment-note">
                    <FaShieldAlt />

                    <div>
                      <strong>
                        Demo Payment
                      </strong>

                      <p>
                        No real banking or
                        card information is
                        required. NovaCart
                        simulates successful
                        payment for this
                        college project.
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* =============================================
                  NOTE
              ============================================== */}

              <section className="checkout-card">
                <div className="checkout-card-heading">
                  <div className="checkout-step-number">
                    3
                  </div>

                  <div>
                    <h2>
                      Order Note
                    </h2>

                    <p>
                      Optional delivery
                      instructions.
                    </p>
                  </div>
                </div>

                <textarea
                  className="checkout-note-input"
                  rows={4}
                  maxLength={500}
                  value={
                    customerNote
                  }
                  onChange={(
                    event
                  ) => {
                    setCustomerNote(
                      event.target
                        .value
                    );

                    setError(
                      ""
                    );
                  }}
                  placeholder="Example: Please call before delivery."
                />

                <small className="checkout-note-count">
                  {
                    customerNote.length
                  }
                  /500
                </small>
              </section>
            </div>

            {/* ===============================================
                ORDER SUMMARY
            ================================================ */}

            <aside className="checkout-right-column">
              <div className="checkout-summary-card">
                <h2>
                  Order Summary
                </h2>

                <div className="checkout-summary-items">
                  {items.map(
                    (item) => {
                      const product =
                        item.product;

                      if (
                        !product ||
                        !product._id
                      ) {
                        return null;
                      }

                      const image =
                        product.images?.[0]
                          ?.url ||
                        "";

                      const itemTotal =
                        Number(
                          item.unitPrice ||
                            0
                        ) *
                        Number(
                          item.quantity ||
                            0
                        );

                      return (
                        <div
                          key={
                            product._id
                          }
                          className="checkout-summary-product"
                        >
                          <div className="checkout-summary-product-image">
                            {image ? (
                              <img
                                src={
                                  image
                                }
                                alt={
                                  product.name ||
                                  "Product"
                                }
                              />
                            ) : (
                              <span>
                                N
                              </span>
                            )}

                            <small>
                              {
                                item.quantity
                              }
                            </small>
                          </div>

                          <div className="checkout-summary-product-info">
                            <strong>
                              {
                                product.name
                              }
                            </strong>

                            <span>
                              Qty:{" "}
                              {
                                item.quantity
                              }
                            </span>
                          </div>

                          <strong className="checkout-summary-product-price">
                            ₹
                            {formatPrice(
                              itemTotal
                            )}
                          </strong>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="checkout-summary-divider" />

                <div className="checkout-summary-row">
                  <span>
                    Items (
                    {
                      totalItems
                    }
                    )
                  </span>

                  <strong>
                    ₹
                    {formatPrice(
                      subtotal
                    )}
                  </strong>
                </div>

                <div className="checkout-summary-row">
                  <span>
                    Shipping
                  </span>

                  <strong
                    className={
                      shippingCharge ===
                      0
                        ? "checkout-free"
                        : ""
                    }
                  >
                    {shippingCharge ===
                    0
                      ? "FREE"
                      : `₹${formatPrice(
                          shippingCharge
                        )}`}
                  </strong>
                </div>

                <div className="checkout-summary-row">
                  <span>
                    Tax
                  </span>

                  <strong>
                    Included
                  </strong>
                </div>

                <div className="checkout-summary-divider" />

                <div className="checkout-summary-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    ₹
                    {formatPrice(
                      totalAmount
                    )}
                  </strong>
                </div>

                <button
                  type="submit"
                  className="checkout-place-order-button"
                  disabled={
                    placingOrder
                  }
                >
                  {placingOrder
                    ? "Placing Order..."
                    : `Place Order • ₹${formatPrice(
                        totalAmount
                      )}`}
                </button>

                <div className="checkout-security-note">
                  <FaShieldAlt />

                  <span>
                    Secure checkout protected
                    by NovaCart.
                  </span>
                </div>

                <div className="checkout-delivery-note">
                  <FaTruck />

                  <div>
                    <strong>
                      Estimated Delivery
                    </strong>

                    <span>
                      Approximately 5 days
                      after order placement.
                    </span>
                  </div>
                </div>

                {selectedAddress &&
                  !useNewAddress && (
                    <div className="checkout-selected-address-summary">
                      <FaMapMarkerAlt />

                      <div>
                        <strong>
                          Delivering to
                        </strong>

                        <span>
                          {
                            selectedAddress.fullName
                          }
                          ,{" "}
                          {
                            selectedAddress.city
                          }
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </aside>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Checkout;