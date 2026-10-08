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

  useEffect(() => {
    clearAuthError?.();

    return () => {
      clearAuthError?.();
    };
  }, [
    clearAuthError,
  ]);

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

  const getRedirectPath =
    (
      loggedInUser
    ) => {
      const requestedPath =
        location.state
          ?.from
          ?.pathname;

      const requestedSearch =
        location.state
          ?.from
          ?.search || "";

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

      if (
        requestedPath &&
        !requestedPath.startsWith(
          "/admin"
        )
      ) {
        return `${requestedPath}${requestedSearch}`;
      }

      return "/";
    };

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

  if (
    !authLoading &&
    isAuthenticated
  ) {
    return (
      <Navigate
        to={
          isAdmin
            ? "/admin"
            : "/"
        }
        replace
      />
    );
  }

  return (
    <main className="auth-page login-page">
      <section className="auth-section">
        <div className="container">
          <div className="auth-layout">
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
                  Sign in to manage your
                  profile, cart, wishlist,
                  addresses, and orders from
                  one secure account.
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

                    Saved delivery addresses
                  </div>
                </div>
              </div>

              <div className="auth-visual-footer">
                <span>
                  Secure • Simple • Smart
                </span>
              </div>
            </div>

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
                    Enter your NovaCart account
                    details to continue.
                  </p>
                </div>

                {successMessage && (
                  <div className="auth-message success">
                    {
                      successMessage
                    }
                  </div>
                )}

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