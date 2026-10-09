import {
  FaBolt,
  FaBoxOpen,
  FaCheckCircle,
  FaHeart,
  FaShieldAlt,
  FaShoppingBag,
  FaStar,
  FaTruck,
  FaUsers,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

const About = () => {
  return (
    <main className="about-page">
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-layout">
            <div className="about-hero-content">
              <span className="section-eyebrow">
                About NovaCart
              </span>

              <h1>
                A Smarter Way to Shop Online
              </h1>

              <p>
                NovaCart is a modern e-commerce
                platform designed to provide a
                simple, secure, and convenient
                online shopping experience.
              </p>

              <p>
                From product discovery to secure
                checkout and order tracking,
                NovaCart brings the complete
                shopping journey together in one
                responsive web application.
              </p>

              <div className="about-hero-actions">
                <Link
                  to="/products"
                  className="primary-button"
                >
                  <FaShoppingBag />

                  Explore Products
                </Link>

                <Link
                  to="/contact"
                  className="secondary-button"
                >
                  Contact Us
                </Link>
              </div>
            </div>

            <div className="about-hero-visual">
              <div className="about-visual-main-card">
                <div className="about-visual-logo">
                  N
                </div>

                <h2>
                  NovaCart
                </h2>

                <span>
                  Shop Smarter
                </span>

                <div className="about-visual-stats">
                  <div>
                    <strong>
                      Easy
                    </strong>

                    <span>
                      Shopping
                    </span>
                  </div>

                  <div>
                    <strong>
                      Secure
                    </strong>

                    <span>
                      Checkout
                    </span>
                  </div>

                  <div>
                    <strong>
                      Fast
                    </strong>

                    <span>
                      Experience
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-story-section section-spacing">
        <div className="container">
          <div className="about-story-grid">
            <div className="about-story-content">
              <span className="section-eyebrow">
                Our Purpose
              </span>

              <h2>
                Making E-Commerce Simple
              </h2>

              <p>
                NovaCart was created as a complete
                e-commerce management system that
                connects customers, products,
                orders, payments, and administration
                through one platform.
              </p>

              <p>
                Customers can browse products,
                search and filter the catalog,
                maintain a wishlist, manage their
                shopping cart, save delivery
                addresses, place orders, and track
                order progress.
              </p>

              <p>
                Administrators can manage products,
                users, inventory, orders, and
                business reports from a dedicated
                dashboard.
              </p>
            </div>

            <div className="about-story-points">
              <div className="about-story-point">
                <FaCheckCircle />

                <div>
                  <h3>
                    Complete Storefront
                  </h3>

                  <p>
                    Product browsing, search,
                    filtering, cart, wishlist,
                    checkout, and customer accounts.
                  </p>
                </div>
              </div>

              <div className="about-story-point">
                <FaCheckCircle />

                <div>
                  <h3>
                    Customer Management
                  </h3>

                  <p>
                    Profiles, addresses, order
                    history, payment information,
                    and delivery tracking.
                  </p>
                </div>
              </div>

              <div className="about-story-point">
                <FaCheckCircle />

                <div>
                  <h3>
                    Admin Management
                  </h3>

                  <p>
                    Product, user, order, inventory,
                    and reporting tools from one
                    administrative interface.
                  </p>
                </div>
              </div>

              <div className="about-story-point">
                <FaCheckCircle />

                <div>
                  <h3>
                    Responsive Experience
                  </h3>

                  <p>
                    Designed for desktop, tablet,
                    and mobile shopping.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-features-section section-spacing">
        <div className="container">
          <div className="section-heading section-heading-center">
            <span className="section-eyebrow">
              What NovaCart Offers
            </span>

            <h2>
              Built Around the Shopping Experience
            </h2>

            <p>
              Every part of NovaCart is designed
              to make online shopping easier for
              customers and store management
              simpler for administrators.
            </p>
          </div>

          <div className="about-features-grid">
            <article className="about-feature-card">
              <div className="about-feature-icon">
                <FaBoxOpen />
              </div>

              <h3>
                Product Discovery
              </h3>

              <p>
                Browse categories, brands,
                featured items, new arrivals,
                and best-selling products.
              </p>
            </article>

            <article className="about-feature-card">
              <div className="about-feature-icon">
                <FaHeart />
              </div>

              <h3>
                Wishlist
              </h3>

              <p>
                Save favorite products and move
                them directly to the shopping cart.
              </p>
            </article>

            <article className="about-feature-card">
              <div className="about-feature-icon">
                <FaShoppingBag />
              </div>

              <h3>
                Smart Cart
              </h3>

              <p>
                Manage quantities, stock limits,
                pricing, and checkout preparation.
              </p>
            </article>

            <article className="about-feature-card">
              <div className="about-feature-icon">
                <FaShieldAlt />
              </div>

              <h3>
                Secure Accounts
              </h3>

              <p>
                Protected authentication with
                customer and administrator
                access control.
              </p>
            </article>

            <article className="about-feature-card">
              <div className="about-feature-icon">
                <FaTruck />
              </div>

              <h3>
                Order Tracking
              </h3>

              <p>
                Follow every order from placement
                through processing and delivery.
              </p>
            </article>

            <article className="about-feature-card">
              <div className="about-feature-icon">
                <FaBolt />
              </div>

              <h3>
                Modern Performance
              </h3>

              <p>
                Built with a modern frontend and
                API-driven backend for smooth
                navigation and interaction.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="about-values-section section-spacing">
        <div className="container">
          <div className="about-values-layout">
            <div className="about-values-heading">
              <span className="section-eyebrow">
                Our Focus
              </span>

              <h2>
                What NovaCart Stands For
              </h2>

              <p>
                The platform focuses on usability,
                reliability, security, and a clean
                customer experience.
              </p>
            </div>

            <div className="about-values-grid">
              <div className="about-value-card">
                <FaUsers />

                <h3>
                  Customer First
                </h3>

                <p>
                  Simple navigation and account
                  management for a better customer
                  experience.
                </p>
              </div>

              <div className="about-value-card">
                <FaShieldAlt />

                <h3>
                  Security
                </h3>

                <p>
                  Authentication and protected
                  account actions help keep user
                  data and orders secure.
                </p>
              </div>

              <div className="about-value-card">
                <FaStar />

                <h3>
                  Quality
                </h3>

                <p>
                  A clean, responsive interface
                  designed to feel professional
                  across the entire platform.
                </p>
              </div>

              <div className="about-value-card">
                <FaBolt />

                <h3>
                  Simplicity
                </h3>

                <p>
                  Features are designed to remain
                  easy to understand and efficient
                  to use.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-technology-section section-spacing">
        <div className="container">
          <div className="section-heading section-heading-center">
            <span className="section-eyebrow">
              Technology
            </span>

            <h2>
              Built with the MERN Stack
            </h2>

            <p>
              NovaCart uses modern technologies
              across the frontend, backend, and
              database.
            </p>
          </div>

          <div className="about-tech-grid">
            <div className="about-tech-card">
              <span>
                Frontend
              </span>

              <h3>
                React.js
              </h3>

              <p>
                Responsive user interfaces with
                Vite, React Router, Axios, and
                reusable React components.
              </p>
            </div>

            <div className="about-tech-card">
              <span>
                Backend
              </span>

              <h3>
                Node.js + Express
              </h3>

              <p>
                REST APIs for authentication,
                products, carts, wishlists,
                orders, users, and administration.
              </p>
            </div>

            <div className="about-tech-card">
              <span>
                Database
              </span>

              <h3>
                MongoDB
              </h3>

              <p>
                Flexible data storage for users,
                products, carts, wishlists,
                and customer orders.
              </p>
            </div>

            <div className="about-tech-card">
              <span>
                Media
              </span>

              <h3>
                Cloudinary
              </h3>

              <p>
                Cloud-based storage and delivery
                for NovaCart product images.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-final-cta">
        <div className="container">
          <div className="about-final-cta-inner">
            <div>
              <span>
                Start Shopping
              </span>

              <h2>
                Discover NovaCart Today
              </h2>

              <p>
                Browse the complete product
                catalog and experience the
                NovaCart shopping platform.
              </p>
            </div>

            <Link
              to="/products"
              className="about-final-cta-button"
            >
              <FaShoppingBag />

              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;