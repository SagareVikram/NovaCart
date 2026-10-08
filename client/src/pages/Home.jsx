import {
  useEffect,
  useState,
} from "react";

import {
  FaArrowRight,
  FaBolt,
  FaBoxOpen,
  FaLayerGroup,
  FaShoppingBag,
  FaStar,
  FaTags,
} from "react-icons/fa";

import {
  Link,
} from "react-router-dom";

import Hero from "../components/Hero.jsx";
import ProductCard from "../components/ProductCard.jsx";
import Loader from "../components/Loader.jsx";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

/**
 * NovaCart Homepage
 *
 * Sections:
 * - Hero
 * - Category highlights
 * - Featured products
 * - Promotional banner
 * - New arrivals
 * - Best sellers
 * - Store advantages
 */
const Home = () => {
  const [
    featuredProducts,
    setFeaturedProducts,
  ] = useState([]);

  const [
    newArrivals,
    setNewArrivals,
  ] = useState([]);

  const [
    bestSellers,
    setBestSellers,
  ] = useState([]);

  const [
    categories,
    setCategories,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /**
   * Load all homepage data.
   */
  useEffect(() => {
    let mounted = true;

    const loadHomeData =
      async () => {
        try {
          setLoading(true);
          setError("");

          const [
            featuredResponse,
            newArrivalsResponse,
            bestSellersResponse,
            categoriesResponse,
          ] =
            await Promise.all([
              api.get(
                "/products/featured?limit=8"
              ),

              api.get(
                "/products/new-arrivals?limit=8"
              ),

              api.get(
                "/products/best-sellers?limit=8"
              ),

              api.get(
                "/products/categories"
              ),
            ]);

          if (!mounted) {
            return;
          }

          setFeaturedProducts(
            featuredResponse
              .data
              ?.products || []
          );

          setNewArrivals(
            newArrivalsResponse
              .data
              ?.products || []
          );

          setBestSellers(
            bestSellersResponse
              .data
              ?.products || []
          );

          setCategories(
            categoriesResponse
              .data
              ?.categories || []
          );
        } catch (error) {
          if (!mounted) {
            return;
          }

          setError(
            getApiErrorMessage(
              error,
              "Unable to load NovaCart homepage."
            )
          );
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

    loadHomeData();

    return () => {
      mounted = false;
    };
  }, []);

  /**
   * Category icon mapping.
   *
   * We keep icons generic so any category
   * from MongoDB can still render properly.
   */
  const getCategoryIcon =
    (index) => {
      const icons = [
        FaShoppingBag,
        FaBolt,
        FaTags,
        FaBoxOpen,
        FaLayerGroup,
        FaStar,
      ];

      return icons[
        index %
          icons.length
      ];
    };

  return (
    <main className="home-page">
      <Hero />

      <section className="home-category-section section-spacing">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-eyebrow">
                Browse by Category
              </span>

              <h2>
                Shop What You Love
              </h2>

              <p>
                Explore NovaCart products
                across popular categories.
              </p>
            </div>

            <Link
              to="/products"
              className="section-link"
            >
              View All Products
              <FaArrowRight />
            </Link>
          </div>

          {categories.length >
          0 ? (
            <div className="home-category-grid">
              {categories
                .slice(0, 6)
                .map(
                  (
                    category,
                    index
                  ) => {
                    const Icon =
                      getCategoryIcon(
                        index
                      );

                    return (
                      <Link
                        key={
                          category
                        }
                        to={`/products?category=${encodeURIComponent(
                          category
                        )}`}
                        className="home-category-card"
                      >
                        <div className="home-category-icon">
                          <Icon />
                        </div>

                        <div>
                          <strong>
                            {
                              category
                            }
                          </strong>

                          <span>
                            Explore products
                          </span>
                        </div>

                        <FaArrowRight className="home-category-arrow" />
                      </Link>
                    );
                  }
                )}
            </div>
          ) : (
            <div className="home-empty-category">
              <FaLayerGroup />

              <div>
                <strong>
                  Product categories
                  will appear here.
                </strong>

                <span>
                  Categories are created
                  automatically from
                  products added by the
                  administrator.
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="home-product-section section-spacing">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-eyebrow">
                Handpicked for You
              </span>

              <h2>
                Featured Products
              </h2>

              <p>
                Discover selected products
                highlighted by NovaCart.
              </p>
            </div>

            <Link
              to="/products?featured=true"
              className="section-link"
            >
              View Featured
              <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <Loader
              text="Loading featured products..."
            />
          ) : error ? (
            <div className="home-error-state">
              <strong>
                Unable to load products
              </strong>

              <p>
                {error}
              </p>
            </div>
          ) : featuredProducts.length >
            0 ? (
            <div className="product-grid">
              {featuredProducts.map(
                (product) => (
                  <ProductCard
                    key={
                      product._id
                    }
                    product={
                      product
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="home-empty-products">
              <FaBoxOpen />

              <h3>
                Featured products coming soon
              </h3>

              <p>
                Products marked as featured
                by the administrator will
                appear here.
              </p>

              <Link
                to="/products"
                className="primary-button"
              >
                Browse Store
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="home-promo-section">
        <div className="container">
          <div className="home-promo-banner">
            <div className="home-promo-content">
              <span className="home-promo-label">
                NovaCart Special
              </span>

              <h2>
                Great Products.
                Better Shopping.
              </h2>

              <p>
                Shop everyday essentials,
                trending products, and
                special offers with a
                smooth checkout experience.
              </p>

              <div className="home-promo-actions">
                <Link
                  to="/products"
                  className="home-promo-primary"
                >
                  Start Shopping
                  <FaArrowRight />
                </Link>

                <Link
                  to="/products?sort=popular"
                  className="home-promo-secondary"
                >
                  Best Sellers
                </Link>
              </div>
            </div>

            <div className="home-promo-visual">
              <div className="home-promo-circle home-promo-circle-one" />
              <div className="home-promo-circle home-promo-circle-two" />

              <div className="home-promo-card home-promo-card-main">
                <FaShoppingBag />

                <strong>
                  NovaCart
                </strong>

                <span>
                  Shop smarter every day
                </span>
              </div>

              <div className="home-promo-card home-promo-card-small">
                <FaTags />

                <span>
                  Deals
                </span>
              </div>

              <div className="home-promo-card home-promo-card-small home-promo-card-right">
                <FaBolt />

                <span>
                  Fast
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-product-section section-spacing">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-eyebrow">
                Fresh in Store
              </span>

              <h2>
                New Arrivals
              </h2>

              <p>
                Explore the latest products
                recently added to NovaCart.
              </p>
            </div>

            <Link
              to="/products?sort=newest"
              className="section-link"
            >
              See New Arrivals
              <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <Loader
              text="Loading new arrivals..."
            />
          ) : newArrivals.length >
            0 ? (
            <div className="product-grid">
              {newArrivals.map(
                (product) => (
                  <ProductCard
                    key={
                      product._id
                    }
                    product={
                      product
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="home-empty-products">
              <FaBoxOpen />

              <h3>
                No new arrivals yet
              </h3>

              <p>
                Newly added products will
                automatically appear here.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="home-product-section home-product-section-alt section-spacing">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-eyebrow">
                Customer Favorites
              </span>

              <h2>
                Best Sellers
              </h2>

              <p>
                Browse popular products
                based on NovaCart sales.
              </p>
            </div>

            <Link
              to="/products?sort=popular"
              className="section-link"
            >
              View Best Sellers
              <FaArrowRight />
            </Link>
          </div>

          {loading ? (
            <Loader
              text="Loading best sellers..."
            />
          ) : bestSellers.length >
            0 ? (
            <div className="product-grid">
              {bestSellers.map(
                (product) => (
                  <ProductCard
                    key={
                      product._id
                    }
                    product={
                      product
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="home-empty-products">
              <FaStar />

              <h3>
                Best sellers will appear here
              </h3>

              <p>
                Products with the highest
                sales will automatically
                move into this section.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="home-benefits-section section-spacing">
        <div className="container">
          <div className="section-heading section-heading-center">
            <span className="section-eyebrow">
              Why NovaCart
            </span>

            <h2>
              Shopping Made Simple
            </h2>

            <p>
              NovaCart combines convenience,
              product variety, and secure
              checkout in one platform.
            </p>
          </div>

          <div className="home-benefits-grid">
            <div className="home-benefit-card">
              <div className="home-benefit-icon">
                <FaShoppingBag />
              </div>

              <h3>
                Easy Shopping
              </h3>

              <p>
                Search, filter, wishlist,
                and purchase products from
                a clean modern interface.
              </p>
            </div>

            <div className="home-benefit-card">
              <div className="home-benefit-icon">
                <FaTags />
              </div>

              <h3>
                Better Value
              </h3>

              <p>
                Discover discounts, featured
                products, and competitive
                pricing across the store.
              </p>
            </div>

            <div className="home-benefit-card">
              <div className="home-benefit-icon">
                <FaBolt />
              </div>

              <h3>
                Fast Experience
              </h3>

              <p>
                Built using React and modern
                APIs for smooth navigation
                and responsive interaction.
              </p>
            </div>

            <div className="home-benefit-card">
              <div className="home-benefit-icon">
                <FaStar />
              </div>

              <h3>
                Customer Focused
              </h3>

              <p>
                Manage your cart, wishlist,
                addresses, profile, and
                orders from one account.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="home-final-cta">
        <div className="container">
          <div className="home-final-cta-inner">
            <div>
              <span>
                Ready to explore?
              </span>

              <h2>
                Find Your Next Favorite Product
              </h2>

              <p>
                Browse the complete NovaCart
                collection and start shopping
                today.
              </p>
            </div>

            <Link
              to="/products"
              className="home-final-cta-button"
            >
              Shop NovaCart
              <FaArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;