import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  FaBars,
  FaChevronDown,
  FaHeart,
  FaSearch,
  FaShoppingCart,
  FaTimes,
  FaUser,
} from "react-icons/fa";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import {
  useCart,
} from "../context/CartContext.jsx";

import {
  useWishlist,
} from "../context/WishlistContext.jsx";

import api from "../api/api.js";

/**
 * Shared NovaCart Navbar
 *
 * Features:
 * - NovaCart branding
 * - desktop navigation
 * - responsive mobile menu
 * - search
 * - dynamic product categories
 * - login/register
 * - customer account menu
 * - admin dashboard link
 * - cart count
 * - wishlist count
 * - logout
 */
const Navbar = () => {
  const navigate =
    useNavigate();

  const location =
    useLocation();

  const accountRef =
    useRef(null);

  const categoryRef =
    useRef(null);

  const {
    user,
    isAuthenticated,
    isAdmin,
    logout,
  } = useAuth();

  const {
    totalItems:
      cartCount,
  } = useCart();

  const {
    totalItems:
      wishlistCount,
  } =
    useWishlist();

  const [
    searchTerm,
    setSearchTerm,
  ] = useState("");

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    accountMenuOpen,
    setAccountMenuOpen,
  ] = useState(false);

  const [
    categoryMenuOpen,
    setCategoryMenuOpen,
  ] = useState(false);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    categoriesLoading,
    setCategoriesLoading,
  ] = useState(false);

  /**
   * Load product categories from backend.
   */
  useEffect(() => {
    let mounted = true;

    const loadCategories =
      async () => {
        try {
          setCategoriesLoading(
            true
          );

          const response =
            await api.get(
              "/products/categories"
            );

          if (mounted) {
            setCategories(
              Array.isArray(
                response.data
                  ?.categories
              )
                ? response.data
                    .categories
                : []
            );
          }
        } catch (error) {
          console.error(
            "Unable to load navbar categories:",
            error
          );

          if (mounted) {
            setCategories(
              []
            );
          }
        } finally {
          if (mounted) {
            setCategoriesLoading(
              false
            );
          }
        }
      };

    loadCategories();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Close navigation overlays when route changes.
   */
  useEffect(() => {
    setMobileMenuOpen(
      false
    );

    setAccountMenuOpen(
      false
    );

    setCategoryMenuOpen(
      false
    );
  }, [location.pathname]);

  /**
   * Close dropdowns when user clicks outside.
   */
  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          accountRef.current &&
          !accountRef.current.contains(
            event.target
          )
        ) {
          setAccountMenuOpen(
            false
          );
        }

        if (
          categoryRef.current &&
          !categoryRef.current.contains(
            event.target
          )
        ) {
          setCategoryMenuOpen(
            false
          );
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /**
   * Prevent body scrolling while mobile menu is open.
   */
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.classList.add(
        "mobile-menu-active"
      );
    } else {
      document.body.classList.remove(
        "mobile-menu-active"
      );
    }

    return () => {
      document.body.classList.remove(
        "mobile-menu-active"
      );
    };
  }, [mobileMenuOpen]);

  /**
   * Search products.
   */
  const handleSearch =
    (event) => {
      event.preventDefault();

      const cleanSearch =
        searchTerm.trim();

      if (!cleanSearch) {
        navigate(
          "/products"
        );

        return;
      }

      navigate(
        `/products?search=${encodeURIComponent(
          cleanSearch
        )}`
      );
    };

  /**
   * Navigate to selected category.
   */
  const handleCategoryClick =
    (category) => {
      setCategoryMenuOpen(
        false
      );

      navigate(
        `/products?category=${encodeURIComponent(
          category
        )}`
      );
    };

  /**
   * Logout current user.
   */
  const handleLogout =
    async () => {
      await logout();

      setAccountMenuOpen(
        false
      );

      navigate("/");
    };

  const firstName =
    user?.name
      ?.trim()
      ?.split(/\s+/)?.[0] ||
    "Account";

  return (
    <>
      <header className="site-header">
        <div className="navbar-top">
          <div className="container navbar-top-inner">
            <p className="navbar-promo">
              Free shipping on orders above ₹500
            </p>

            <div className="navbar-top-links">
              <Link to="/about">
                About
              </Link>

              <Link to="/contact">
                Contact
              </Link>
            </div>
          </div>
        </div>

        <div className="navbar-main">
          <div className="container navbar-main-inner">
            <Link
              to="/"
              className="navbar-brand"
              aria-label="NovaCart home"
            >
              <span className="navbar-brand-mark">
                N
              </span>

              <span className="navbar-brand-text">
                Nova
                <strong>
                  Cart
                </strong>
              </span>
            </Link>

            <form
              className="navbar-search"
              onSubmit={
                handleSearch
              }
            >
              <input
                type="search"
                placeholder="Search products, brands and categories..."
                value={
                  searchTerm
                }
                onChange={(
                  event
                ) =>
                  setSearchTerm(
                    event.target
                      .value
                  )
                }
                aria-label="Search NovaCart"
              />

              <button
                type="submit"
                aria-label="Search"
              >
                <FaSearch />
              </button>
            </form>

            <div className="navbar-actions">
              <Link
                to="/wishlist"
                className="navbar-action"
                aria-label="Wishlist"
              >
                <span className="navbar-action-icon">
                  <FaHeart />
                </span>

                <span className="navbar-action-text">
                  Wishlist
                </span>

                {wishlistCount >
                  0 && (
                  <span className="navbar-count">
                    {wishlistCount >
                    99
                      ? "99+"
                      : wishlistCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cart"
                className="navbar-action"
                aria-label="Shopping cart"
              >
                <span className="navbar-action-icon">
                  <FaShoppingCart />
                </span>

                <span className="navbar-action-text">
                  Cart
                </span>

                {cartCount >
                  0 && (
                  <span className="navbar-count">
                    {cartCount >
                    99
                      ? "99+"
                      : cartCount}
                  </span>
                )}
              </Link>

              <div
                className="navbar-account"
                ref={accountRef}
              >
                <button
                  type="button"
                  className="navbar-account-button"
                  onClick={() =>
                    setAccountMenuOpen(
                      (current) =>
                        !current
                    )
                  }
                  aria-expanded={
                    accountMenuOpen
                  }
                >
                  <span className="navbar-action-icon">
                    <FaUser />
                  </span>

                  <span className="navbar-account-copy">
                    <small>
                      {isAuthenticated
                        ? "Hello"
                        : "Welcome"}
                    </small>

                    <strong>
                      {isAuthenticated
                        ? firstName
                        : "Sign in"}
                    </strong>
                  </span>

                  <FaChevronDown className="navbar-account-chevron" />
                </button>

                {accountMenuOpen && (
                  <div className="navbar-account-menu">
                    {!isAuthenticated ? (
                      <>
                        <Link
                          to="/login"
                          className="account-menu-primary"
                        >
                          Login
                        </Link>

                        <Link
                          to="/register"
                        >
                          Create Account
                        </Link>
                      </>
                    ) : (
                      <>
                        {isAdmin ? (
                          <Link to="/admin">
                            Admin Dashboard
                          </Link>
                        ) : (
                          <>
                            <Link to="/profile">
                              My Profile
                            </Link>

                            <Link to="/my-orders">
                              My Orders
                            </Link>

                            <Link to="/wishlist">
                              Wishlist
                            </Link>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={
                            handleLogout
                          }
                          className="account-menu-logout"
                        >
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                className="navbar-mobile-toggle"
                onClick={() =>
                  setMobileMenuOpen(
                    true
                  )
                }
                aria-label="Open navigation menu"
              >
                <FaBars />
              </button>
            </div>
          </div>
        </div>

        <nav className="navbar-navigation">
          <div className="container navbar-navigation-inner">
            <div
              className="navbar-category-menu"
              ref={categoryRef}
            >
              <button
                type="button"
                className="navbar-category-button"
                onClick={() =>
                  setCategoryMenuOpen(
                    (current) =>
                      !current
                  )
                }
                aria-expanded={
                  categoryMenuOpen
                }
              >
                Shop by Category
                <FaChevronDown />
              </button>

              {categoryMenuOpen && (
                <div className="navbar-category-dropdown">
                  {categoriesLoading ? (
                    <p className="navbar-category-status">
                      Loading categories...
                    </p>
                  ) : categories.length >
                    0 ? (
                    categories.map(
                      (
                        category
                      ) => (
                        <button
                          type="button"
                          key={
                            category
                          }
                          onClick={() =>
                            handleCategoryClick(
                              category
                            )
                          }
                        >
                          {
                            category
                          }
                        </button>
                      )
                    )
                  ) : (
                    <p className="navbar-category-status">
                      Categories will appear here.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="navbar-links">
              <NavLink
                to="/"
                end
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "active"
                    : ""
                }
              >
                Home
              </NavLink>

              <NavLink
                to="/products"
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "active"
                    : ""
                }
              >
                Shop
              </NavLink>

              <Link to="/products?sort=newest">
                New Arrivals
              </Link>

              <Link to="/products?sort=popular">
                Best Sellers
              </Link>

              <NavLink
                to="/about"
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "active"
                    : ""
                }
              >
                About
              </NavLink>

              <NavLink
                to="/contact"
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "active"
                    : ""
                }
              >
                Contact
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({
                    isActive,
                  }) =>
                    isActive
                      ? "active"
                      : ""
                  }
                >
                  Admin
                </NavLink>
              )}
            </div>
          </div>
        </nav>
      </header>

      <div
        className={`mobile-nav-overlay ${
          mobileMenuOpen
            ? "open"
            : ""
        }`}
        onClick={() =>
          setMobileMenuOpen(
            false
          )
        }
        aria-hidden={
          !mobileMenuOpen
        }
      />

      <aside
        className={`mobile-nav ${
          mobileMenuOpen
            ? "open"
            : ""
        }`}
        aria-hidden={
          !mobileMenuOpen
        }
      >
        <div className="mobile-nav-header">
          <Link
            to="/"
            className="navbar-brand"
          >
            <span className="navbar-brand-mark">
              N
            </span>

            <span className="navbar-brand-text">
              Nova
              <strong>
                Cart
              </strong>
            </span>
          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(
                false
              )
            }
            aria-label="Close navigation menu"
          >
            <FaTimes />
          </button>
        </div>

        <form
          className="mobile-nav-search"
          onSubmit={
            handleSearch
          }
        >
          <input
            type="search"
            placeholder="Search products..."
            value={
              searchTerm
            }
            onChange={(
              event
            ) =>
              setSearchTerm(
                event.target
                  .value
              )
            }
          />

          <button
            type="submit"
            aria-label="Search"
          >
            <FaSearch />
          </button>
        </form>

        <div className="mobile-nav-links">
          <NavLink
            to="/"
            end
          >
            Home
          </NavLink>

          <NavLink to="/products">
            Shop
          </NavLink>

          <Link to="/products?sort=newest">
            New Arrivals
          </Link>

          <Link to="/products?sort=popular">
            Best Sellers
          </Link>

          <NavLink to="/wishlist">
            Wishlist
            {wishlistCount >
              0 && (
              <span>
                {
                  wishlistCount
                }
              </span>
            )}
          </NavLink>

          <NavLink to="/cart">
            Cart
            {cartCount >
              0 && (
              <span>
                {cartCount}
              </span>
            )}
          </NavLink>

          {isAuthenticated &&
            !isAdmin && (
              <>
                <NavLink to="/profile">
                  My Profile
                </NavLink>

                <NavLink to="/my-orders">
                  My Orders
                </NavLink>
              </>
            )}

          {isAdmin && (
            <NavLink to="/admin">
              Admin Dashboard
            </NavLink>
          )}

          <NavLink to="/about">
            About
          </NavLink>

          <NavLink to="/contact">
            Contact
          </NavLink>
        </div>

        <div className="mobile-nav-account">
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                className="mobile-nav-login"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="mobile-nav-register"
              >
                Create Account
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={
                handleLogout
              }
              className="mobile-nav-logout"
            >
              Logout
            </button>
          )}
        </div>

        <div className="mobile-nav-categories">
          <h4>
            Categories
          </h4>

          {categoriesLoading ? (
            <p>
              Loading...
            </p>
          ) : categories.length >
            0 ? (
            categories.map(
              (category) => (
                <button
                  type="button"
                  key={
                    category
                  }
                  onClick={() =>
                    handleCategoryClick(
                      category
                    )
                  }
                >
                  {category}
                </button>
              )
            )
          ) : (
            <p>
              No categories available.
            </p>
          )}
        </div>
      </aside>
    </>
  );
};

export default Navbar;