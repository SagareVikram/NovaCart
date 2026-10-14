import {
  useEffect,
  useState,
} from "react";

import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaShoppingBag,
} from "react-icons/fa";

import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";


const Login = () => {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
    isAuthenticated,
    isAdmin,
    isDeliveryAgent,
    loading: authLoading,
    login,
    authError,
    clearAuthError,
  } = useAuth();


  const [
    formData,
    setFormData,
  ] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });


  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [
    formError,
    setFormError,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState(
    location.state
      ?.message || ""
  );


  /**
   * ============================================================
   * CLEAR OLD AUTH ERRORS
   * ============================================================
   */
  useEffect(() => {
    clearAuthError?.();

    return () => {
      clearAuthError?.();
    };
  }, [
    clearAuthError,
  ]);


  /**
   * ============================================================
   * SUCCESS MESSAGE
   * ============================================================
   */
  useEffect(() => {
    if (
      location.state
        ?.message
    ) {
      setSuccessMessage(
        location.state
          .message
      );
    }
  }, [
    location.state,
  ]);


  /**
   * ============================================================
   * FORM CHANGE
   * ============================================================
   */
  const handleChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;


      setFormData(
        (
          current
        ) => ({
          ...current,

          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );


      if (formError) {
        setFormError("");
      }


      if (authError) {
        clearAuthError?.();
      }
    };


  /**
   * ============================================================
   * VALIDATION
   * ============================================================
   */
  const validateForm =
    () => {
      const email =
        formData.email
          .trim()
          .toLowerCase();

      const password =
        formData.password;


      if (!email) {
        return "Please enter your email address.";
      }


      const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


      if (
        !emailPattern.test(
          email
        )
      ) {
        return "Please enter a valid email address.";
      }


      if (!password) {
        return "Please enter your password.";
      }


      if (
        password.length <
        6
      ) {
        return "Password must contain at least 6 characters.";
      }


      return "";
    };


  /**
   * ============================================================
   * EXTRACT REQUESTED PATH
   * ============================================================
   *
   * Protected routes may send:
   *
   * state.from = {
   *   pathname: "...",
   *   search: "..."
   * }
   *
   * or:
   *
   * state.from = "/delivery"
   */
  const getRequestedLocation =
    () => {
      const from =
        location.state
          ?.from;


      if (
        typeof from ===
        "string"
      ) {
        return {
          pathname:
            from,

          search:
            "",
        };
      }


      if (
        from &&
        typeof from ===
          "object"
      ) {
        return {
          pathname:
            from.pathname ||
            "",

          search:
            from.search ||
            "",
        };
      }


      return {
        pathname: "",
        search: "",
      };
    };


  /**
   * ============================================================
   * ROLE BASED LOGIN REDIRECT
   * ============================================================
   *
   * Customer:
   * /
   *
   * Admin:
   * /admin
   *
   * Delivery Agent:
   * /delivery
   */
  const getRedirectPath =
    (
      loggedInUser
    ) => {
      const {
        pathname:
          requestedPath,

        search:
          requestedSearch,
      } =
        getRequestedLocation();


      /**
       * ADMIN
       */
      if (
        loggedInUser
          ?.role ===
          "admin"
      ) {
        if (
          requestedPath &&
          requestedPath.startsWith(
            "/admin"
          )
        ) {
          return `${requestedPath}${requestedSearch}`;
        }

        return "/admin";
      }


      /**
       * DELIVERY AGENT
       */
      if (
        loggedInUser
          ?.role ===
          "delivery_agent"
      ) {
        if (
          requestedPath &&
          requestedPath.startsWith(
            "/delivery"
          )
        ) {
          return `${requestedPath}${requestedSearch}`;
        }

        return "/delivery";
      }


      /**
       * CUSTOMER
       */
      if (
        requestedPath &&
        !requestedPath.startsWith(
          "/admin"
        ) &&
        !requestedPath.startsWith(
          "/delivery"
        )
      ) {
        return `${requestedPath}${requestedSearch}`;
      }


      return "/";
    };


  /**
   * ============================================================
   * LOGIN SUBMIT
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


      setFormError("");
      setSuccessMessage("");

      clearAuthError?.();


      const validationError =
        validateForm();


      if (
        validationError
      ) {
        setFormError(
          validationError
        );

        return;
      }


      try {
        setSubmitting(
          true
        );


        const result =
          await login({
            email:
              formData.email
                .trim()
                .toLowerCase(),

            password:
              formData.password,

            rememberMe:
              formData.rememberMe,
          });


        if (
          result?.success
        ) {
          const loggedInUser =
            result.user ||
            user;


          navigate(
            getRedirectPath(
              loggedInUser
            ),
            {
              replace: true,
            }
          );


          return;
        }


        setFormError(
          result?.message ||
            "Login failed. Please check your email and password."
        );
      } catch (error) {
        setFormError(
          error?.message ||
            "Unable to login right now."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };


  /**
   * ============================================================
   * ALREADY LOGGED-IN USER
   * ============================================================
   */
  if (
    !authLoading &&
    isAuthenticated
  ) {
    /**
     * Admin
     */
    if (isAdmin) {
      return (
        <Navigate
          to="/admin"
          replace
        />
      );
    }


    /**
     * Delivery Agent
     */
    if (
      isDeliveryAgent
    ) {
      return (
        <Navigate
          to="/delivery"
          replace
        />
      );
    }


    /**
     * Normal Customer
     */
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  /**
   * ============================================================
   * LOGIN PAGE
   * ============================================================
   */
  return (
    <main className="auth-page login-page">
      <section className="auth-section">

        <div className="container">

          <div className="auth-layout">

            {/* =================================================
                LEFT VISUAL PANEL
            ================================================= */}

            <div className="auth-visual-panel">

              <Link
                to="/"
                className="auth-brand"
              >
                <span className="auth-brand-mark">
                  N
                </span>

                <span className="auth-brand-name">
                  Nova
                  <strong>
                    Cart
                  </strong>
                </span>
              </Link>


              <div className="auth-visual-content">

                <div className="auth-visual-icon">
                  <FaShoppingBag />
                </div>


                <span className="section-eyebrow">
                  Welcome Back
                </span>


                <h1>
                  Continue Your NovaCart Journey
                </h1>


                <p>
                  Sign in to access your
                  NovaCart account, manage
                  shopping activities, or
                  continue your assigned
                  delivery work.
                </p>


                <div className="auth-feature-list">

                  <div>
                    <span>
                      ✓
                    </span>

                    Persistent shopping cart
                  </div>


                  <div>
                    <span>
                      ✓
                    </span>

                    Personal wishlist
                  </div>


                  <div>
                    <span>
                      ✓
                    </span>

                    Order tracking
                  </div>


                  <div>
                    <span>
                      ✓
                    </span>

                    Secure role-based access
                  </div>

                </div>

              </div>


              <div className="auth-visual-footer">
                <span>
                  Secure • Simple • Smart
                </span>
              </div>

            </div>


            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <div className="auth-form-panel">

              <div className="auth-form-card">

                <div className="auth-form-heading">

                  <span className="section-eyebrow">
                    Account Login
                  </span>


                  <h2>
                    Sign In
                  </h2>


                  <p>
                    Customers, administrators,
                    and delivery agents can
                    sign in using their
                    NovaCart account.
                  </p>

                </div>


                {/* SUCCESS MESSAGE */}

                {successMessage && (
                  <div className="auth-message success">
                    {
                      successMessage
                    }
                  </div>
                )}


                {/* ERROR MESSAGE */}

                {(formError ||
                  authError) && (
                  <div className="auth-message error">
                    {formError ||
                      authError}
                  </div>
                )}


                <form
                  className="auth-form"
                  onSubmit={
                    handleSubmit
                  }
                  noValidate
                >

                  {/* EMAIL */}

                  <div className="form-group">

                    <label htmlFor="login-email">
                      Email Address
                    </label>


                    <div className="auth-input-wrap">

                      <FaEnvelope />


                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Enter your email"
                        value={
                          formData.email
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          submitting
                        }
                        required
                      />

                    </div>

                  </div>


                  {/* PASSWORD */}

                  <div className="form-group">

                    <div className="auth-label-row">

                      <label htmlFor="login-password">
                        Password
                      </label>

                    </div>


                    <div className="auth-input-wrap">

                      <FaLock />


                      <input
                        id="login-password"
                        name="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        value={
                          formData.password
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          submitting
                        }
                        required
                      />


                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() =>
                          setShowPassword(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>

                    </div>

                  </div>


                  {/* REMEMBER ME */}

                  <div className="auth-form-options">

                    <label className="auth-remember">

                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={
                          formData.rememberMe
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          submitting
                        }
                      />


                      <span>
                        Keep me signed in
                      </span>

                    </label>

                  </div>


                  {/* SUBMIT */}

                  <button
                    type="submit"
                    className="auth-submit-button"
                    disabled={
                      submitting ||
                      authLoading
                    }
                  >
                    {submitting
                      ? "Signing In..."
                      : "Sign In"}
                  </button>

                </form>


                {/* CUSTOMER REGISTRATION */}

                <div className="auth-divider">
                  <span>
                    New to NovaCart?
                  </span>
                </div>


                <Link
                  to="/register"
                  className="auth-secondary-button"
                  state={{
                    from:
                      location.state
                        ?.from,
                  }}
                >
                  Create New Account
                </Link>


                <div className="auth-store-link">

                  <Link to="/products">
                    Continue shopping without signing in
                  </Link>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>
    </main>
  );
};


export default Login;