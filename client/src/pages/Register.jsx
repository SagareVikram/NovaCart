import {
  useEffect,
  useState,
} from "react";

import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaPhoneAlt,
  FaShoppingBag,
  FaUser,
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

const Register = () => {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const {
    user,
    isAuthenticated,
    isAdmin,
    loading: authLoading,
    register,
    authError,
    clearAuthError,
  } = useAuth();

  const [
    formData,
    setFormData,
  ] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    formError,
    setFormError,
  ] = useState("");

  useEffect(() => {
    clearAuthError?.();

    return () => {
      clearAuthError?.();
    };
  }, [
    clearAuthError,
  ]);

  const handleChange =
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setFormData(
        (
          current
        ) => ({
          ...current,
          [name]: value,
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
      const name =
        formData.name.trim();

      const email =
        formData.email
          .trim()
          .toLowerCase();

      const phone =
        formData.phone.trim();

      const password =
        formData.password;

      const confirmPassword =
        formData.confirmPassword;

      if (!name) {
        return "Please enter your full name.";
      }

      if (
        name.length <
        2
      ) {
        return "Name must contain at least 2 characters.";
      }

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

      if (!phone) {
        return "Please enter your phone number.";
      }

      const cleanedPhone =
        phone.replace(
          /[\s\-()]/g,
          ""
        );

      const phonePattern =
        /^\+?[0-9]{10,15}$/;

      if (
        !phonePattern.test(
          cleanedPhone
        )
      ) {
        return "Please enter a valid phone number.";
      }

      if (!password) {
        return "Please create a password.";
      }

      if (
        password.length <
        6
      ) {
        return "Password must contain at least 6 characters.";
      }

      if (
        password !==
        confirmPassword
      ) {
        return "Passwords do not match.";
      }

      return "";
    };

  const getRedirectPath =
    (
      registeredUser
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
        registeredUser
          ?.role ===
          "admin"
      ) {
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
          await register({
            name:
              formData.name.trim(),

            email:
              formData.email
                .trim()
                .toLowerCase(),

            phone:
              formData.phone.trim(),

            password:
              formData.password,
          });

        if (
          result?.success
        ) {
          const registeredUser =
            result.user ||
            user;

          navigate(
            getRedirectPath(
              registeredUser
            ),
            {
              replace: true,
            }
          );

          return;
        }

        setFormError(
          result?.message ||
            "Unable to create your NovaCart account."
        );
      } catch (error) {
        setFormError(
          error?.message ||
            "Unable to register right now."
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
    <main className="auth-page register-page">
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
                  Join NovaCart
                </span>

                <h1>
                  Create Your Shopping Account
                </h1>

                <p>
                  Register once and enjoy a
                  smoother shopping experience
                  across NovaCart.
                </p>

                <div className="auth-feature-list">
                  <div>
                    <span>
                      ✓
                    </span>

                    Save products to your wishlist
                  </div>

                  <div>
                    <span>
                      ✓
                    </span>

                    Keep your cart across sessions
                  </div>

                  <div>
                    <span>
                      ✓
                    </span>

                    Save multiple delivery addresses
                  </div>

                  <div>
                    <span>
                      ✓
                    </span>

                    Track and manage your orders
                  </div>
                </div>
              </div>

              <div className="auth-visual-footer">
                <span>
                  NovaCart • Shop Smarter
                </span>
              </div>
            </div>

            <div className="auth-form-panel">
              <div className="auth-form-card">
                <div className="auth-form-heading">
                  <span className="section-eyebrow">
                    New Account
                  </span>

                  <h2>
                    Create Account
                  </h2>

                  <p>
                    Enter your details to get
                    started with NovaCart.
                  </p>
                </div>

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
                    <label htmlFor="register-name">
                      Full Name
                    </label>

                    <div className="auth-input-wrap">
                      <FaUser />

                      <input
                        id="register-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        placeholder="Enter your full name"
                        value={
                          formData.name
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          submitting
                        }
                        maxLength="80"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-email">
                      Email Address
                    </label>

                    <div className="auth-input-wrap">
                      <FaEnvelope />

                      <input
                        id="register-email"
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
                    <label htmlFor="register-phone">
                      Phone Number
                    </label>

                    <div className="auth-input-wrap">
                      <FaPhoneAlt />

                      <input
                        id="register-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        placeholder="Enter your phone number"
                        value={
                          formData.phone
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          submitting
                        }
                        maxLength="18"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-password">
                      Password
                    </label>

                    <div className="auth-input-wrap">
                      <FaLock />

                      <input
                        id="register-password"
                        name="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        placeholder="Create a password"
                        value={
                          formData.password
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          submitting
                        }
                        minLength="6"
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

                    <small className="auth-input-help">
                      Use at least 6 characters.
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="register-confirm-password">
                      Confirm Password
                    </label>

                    <div className="auth-input-wrap">
                      <FaLock />

                      <input
                        id="register-confirm-password"
                        name="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        value={
                          formData.confirmPassword
                        }
                        onChange={
                          handleChange
                        }
                        disabled={
                          submitting
                        }
                        minLength="6"
                        required
                      />

                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() =>
                          setShowConfirmPassword(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirmPassword ? (
                          <FaEyeSlash />
                        ) : (
                          <FaEye />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="auth-terms-note">
                    By creating an account,
                    you agree to use NovaCart
                    responsibly for this
                    e-commerce platform.
                  </p>

                  <button
                    type="submit"
                    className="auth-submit-button"
                    disabled={
                      submitting ||
                      authLoading
                    }
                  >
                    {submitting
                      ? "Creating Account..."
                      : "Create Account"}
                  </button>
                </form>

                <div className="auth-divider">
                  <span>
                    Already have an account?
                  </span>
                </div>

                <Link
                  to="/login"
                  className="auth-secondary-button"
                  state={{
                    from:
                      location.state
                        ?.from,
                  }}
                >
                  Sign In
                </Link>

                <div className="auth-store-link">
                  <Link to="/products">
                    Browse the store without registering
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

export default Register;