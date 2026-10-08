import {
  FaEnvelope,
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaTwitter,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

/**
 * Shared NovaCart footer.
 *
 * Designed for:
 * - storefront pages
 * - authentication pages
 * - user pages
 *
 * Admin pages can later use their own dashboard layout
 * without this storefront footer.
 */
const Footer = () => {
  const currentYear =
    new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-column footer-brand-column">
          <Link
            to="/"
            className="footer-brand"
            aria-label="NovaCart home"
          >
            <span className="footer-brand-mark">
              N
            </span>

            <span className="footer-brand-text">
              Nova
              <strong>
                Cart
              </strong>
            </span>
          </Link>

          <p className="footer-description">
            NovaCart is a modern e-commerce platform
            built to make online shopping simple,
            secure, and convenient.
          </p>

          <div className="footer-contact-list">
            <div className="footer-contact-item">
              <FaMapMarkerAlt />

              <span>
                Maharashtra, India
              </span>
            </div>

            <div className="footer-contact-item">
              <FaPhoneAlt />

              <a href="tel:+919999999999">
                +91 99999 99999
              </a>
            </div>

            <div className="footer-contact-item">
              <FaEnvelope />

              <a href="mailto:support@novacart.com">
                support@novacart.com
              </a>
            </div>
          </div>

          <div className="footer-socials">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>

            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        <div className="footer-column">
          <h3>
            Shop
          </h3>

          <ul className="footer-links">
            <li>
              <Link to="/products">
                All Products
              </Link>
            </li>

            <li>
              <Link to="/products?sort=newest">
                New Arrivals
              </Link>
            </li>

            <li>
              <Link to="/products?sort=popular">
                Best Sellers
              </Link>
            </li>

            <li>
              <Link to="/wishlist">
                Wishlist
              </Link>
            </li>

            <li>
              <Link to="/cart">
                Shopping Cart
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>
            Customer
          </h3>

          <ul className="footer-links">
            <li>
              <Link to="/profile">
                My Account
              </Link>
            </li>

            <li>
              <Link to="/my-orders">
                My Orders
              </Link>
            </li>

            <li>
              <Link to="/checkout">
                Checkout
              </Link>
            </li>

            <li>
              <Link to="/login">
                Login
              </Link>
            </li>

            <li>
              <Link to="/register">
                Register
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-column">
          <h3>
            Information
          </h3>

          <ul className="footer-links">
            <li>
              <Link to="/about">
                About NovaCart
              </Link>
            </li>

            <li>
              <Link to="/contact">
                Contact Us
              </Link>
            </li>

            <li>
              <Link to="/products">
                Browse Store
              </Link>
            </li>

            <li>
              <Link to="/products?inStock=true">
                In-Stock Products
              </Link>
            </li>
          </ul>
        </div>

        <div className="footer-column footer-newsletter-column">
          <h3>
            Stay Updated
          </h3>

          <p>
            Get updates about new products,
            offers, and NovaCart announcements.
          </p>

          <form
            className="footer-newsletter"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <input
              type="email"
              placeholder="Enter your email"
              aria-label="Newsletter email"
            />

            <button type="submit">
              Subscribe
            </button>
          </form>

          <div className="footer-payment-note">
            <span>
              Secure Shopping
            </span>

            <small>
              COD • UPI • Card
            </small>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>
            © {currentYear} NovaCart. All rights reserved.
          </p>

          <p>
            College E-Commerce Project
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;