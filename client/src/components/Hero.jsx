import {
  FaArrowRight,
  FaBoxOpen,
  FaHeadset,
  FaShieldAlt,
  FaShippingFast,
  FaShoppingBag,
  FaStar,
  FaTags,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

/**
 * NovaCart Homepage Hero
 *
 * Purpose:
 * - establish NovaCart brand identity
 * - promote shopping actions
 * - highlight platform trust points
 * - remain responsive without external libraries
 */
const Hero = () => {
  return (
    <section className="hero-section">
      <div className="hero-background-shape hero-background-shape-one" />
      <div className="hero-background-shape hero-background-shape-two" />

      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <FaStar />

            <span>
              Smart Shopping Starts Here
            </span>
          </div>

          <h1 className="hero-title">
            Discover More.
            <span>
              Shop Smarter.
            </span>
          </h1>

          <p className="hero-description">
            Explore trending products, exclusive deals,
            and everyday essentials in one modern
            shopping destination built for convenience.
          </p>

          <div className="hero-actions">
            <Link
              to="/products"
              className="hero-primary-button"
            >
              <FaShoppingBag />

              <span>
                Shop Now
              </span>

              <FaArrowRight />
            </Link>

            <Link
              to="/products?sort=newest"
              className="hero-secondary-button"
            >
              Explore New Arrivals
            </Link>
          </div>

          <div className="hero-highlights">
            <div className="hero-highlight-item">
              <strong>
                100+
              </strong>

              <span>
                Products
              </span>
            </div>

            <div className="hero-highlight-divider" />

            <div className="hero-highlight-item">
              <strong>
                Fast
              </strong>

              <span>
                Delivery
              </span>
            </div>

            <div className="hero-highlight-divider" />

            <div className="hero-highlight-item">
              <strong>
                Secure
              </strong>

              <span>
                Checkout
              </span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-main-card">
            <div className="hero-main-card-top">
              <div>
                <span className="hero-main-card-label">
                  NOVACART
                </span>

                <h2>
                  Upgrade Your
                  Everyday Shopping
                </h2>
              </div>

              <div className="hero-main-card-icon">
                <FaShoppingBag />
              </div>
            </div>

            <div className="hero-main-card-products">
              <div className="hero-demo-product hero-demo-product-large">
                <div className="hero-demo-icon">
                  <FaBoxOpen />
                </div>

                <div>
                  <span>
                    Featured
                  </span>

                  <strong>
                    Top Picks
                  </strong>
                </div>
              </div>

              <div className="hero-demo-product">
                <div className="hero-demo-icon">
                  <FaTags />
                </div>

                <div>
                  <span>
                    Special
                  </span>

                  <strong>
                    Deals
                  </strong>
                </div>
              </div>

              <div className="hero-demo-product">
                <div className="hero-demo-icon">
                  <FaShippingFast />
                </div>

                <div>
                  <span>
                    Quick
                  </span>

                  <strong>
                    Delivery
                  </strong>
                </div>
              </div>
            </div>

            <div className="hero-main-card-footer">
              <div>
                <span>
                  Starting from
                </span>

                <strong>
                  ₹199
                </strong>
              </div>

              <Link
                to="/products"
                className="hero-card-shop-button"
              >
                Browse Store
                <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container hero-service-strip">
        <div className="hero-service-item">
          <div className="hero-service-icon">
            <FaShippingFast />
          </div>

          <div>
            <strong>
              Fast Delivery
            </strong>

            <span>
              Quick order processing
            </span>
          </div>
        </div>

        <div className="hero-service-item">
          <div className="hero-service-icon">
            <FaShieldAlt />
          </div>

          <div>
            <strong>
              Secure Shopping
            </strong>

            <span>
              Protected transactions
            </span>
          </div>
        </div>

        <div className="hero-service-item">
          <div className="hero-service-icon">
            <FaTags />
          </div>

          <div>
            <strong>
              Great Deals
            </strong>

            <span>
              Competitive product pricing
            </span>
          </div>
        </div>

        <div className="hero-service-item">
          <div className="hero-service-icon">
            <FaHeadset />
          </div>

          <div>
            <strong>
              Customer Support
            </strong>

            <span>
              Help when you need it
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;