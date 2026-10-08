import {
  FaArrowLeft,
  FaHeart,
  FaShoppingCart,
  FaTrash,
} from "react-icons/fa";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Loader from "../components/Loader.jsx";

import {
  useWishlist,
} from "../context/WishlistContext.jsx";

/**
 * NovaCart Wishlist Page
 *
 * Features:
 * - persistent wishlist
 * - remove product
 * - clear wishlist
 * - move to cart
 * - stock awareness
 * - empty state
 */
const Wishlist = () => {
  const navigate =
    useNavigate();

  const {
    items,
    loading,
    wishlistError,
    totalItems,
    isEmpty,

    removeFromWishlist,
    clearWishlist,
    moveToCart,
  } = useWishlist();

  const handleMoveToCart =
    async (
      productId
    ) => {
      const result =
        await moveToCart(
          productId,
          1
        );

      if (result.success) {
        return;
      }

      if (
        result.requiresLogin
      ) {
        navigate(
          "/login"
        );
      }
    };

  if (loading) {
    return (
      <main className="wishlist-page">
        <Loader
          fullPage
          text="Loading your wishlist..."
        />
      </main>
    );
  }

  if (isEmpty) {
    return (
      <main className="wishlist-page">
        <section className="wishlist-empty-section section-spacing">
          <div className="container">
            <div className="wishlist-empty-card">
              <div className="wishlist-empty-icon">
                <FaHeart />
              </div>

              <h1>
                Your Wishlist is Empty
              </h1>

              <p>
                Save products you like and
                they will appear here for
                easy access later.
              </p>

              <Link
                to="/products"
                className="primary-button"
              >
                Explore Products
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="wishlist-page">
      <section className="wishlist-page-header">
        <div className="container">
          <div className="wishlist-page-header-content">
            <div>
              <span className="section-eyebrow">
                Saved for Later
              </span>

              <h1>
                My Wishlist
              </h1>

              <p>
                Keep track of products you
                love and move them to your
                cart whenever you're ready.
              </p>
            </div>

            <Link
              to="/products"
              className="wishlist-continue-shopping"
            >
              <FaArrowLeft />

              Continue Shopping
            </Link>
          </div>
        </div>
      </section>

      <section className="wishlist-main-section section-spacing">
        <div className="container">
          {wishlistError && (
            <div className="wishlist-error-message">
              {
                wishlistError
              }
            </div>
          )}

          <div className="wishlist-toolbar">
            <div>
              <h2>
                Saved Products
              </h2>

              <span>
                {
                  totalItems
                }{" "}
                item
                {totalItems ===
                1
                  ? ""
                  : "s"}
              </span>
            </div>

            <button
              type="button"
              className="wishlist-clear-button"
              onClick={
                clearWishlist
              }
            >
              <FaTrash />

              Clear Wishlist
            </button>
          </div>

          <div className="wishlist-grid">
            {items.map(
              (
                item
              ) => {
                const product =
                  item.product;

                if (
                  !product
                ) {
                  return null;
                }

                const productId =
                  product._id;

                const slug =
                  product.slug ||
                  productId;

                const image =
                  product.images?.[0]
                    ?.url ||
                  "";

                const regularPrice =
                  Number(
                    product.price ||
                      0
                  );

                const discountPrice =
                  product.discountPrice !==
                    null &&
                  product.discountPrice !==
                    undefined
                    ? Number(
                        product.discountPrice
                      )
                    : null;

                const hasDiscount =
                  discountPrice !==
                    null &&
                  discountPrice <
                    regularPrice;

                const finalPrice =
                  hasDiscount
                    ? discountPrice
                    : regularPrice;

                const discountPercentage =
                  hasDiscount &&
                  regularPrice >
                    0
                    ? Math.round(
                        ((regularPrice -
                          discountPrice) /
                          regularPrice) *
                          100
                      )
                    : 0;

                const stock =
                  Number(
                    product.stock ||
                      0
                  );

                const outOfStock =
                  stock <= 0;

                return (
                  <article
                    key={
                      productId
                    }
                    className="wishlist-card"
                  >
                    <div className="wishlist-card-image-wrap">
                      <Link
                        to={`/products/${slug}`}
                        className="wishlist-card-image"
                      >
                        {image ? (
                          <img
                            src={
                              image
                            }
                            alt={
                              product.name
                            }
                            loading="lazy"
                          />
                        ) : (
                          <div className="wishlist-card-image-placeholder">
                            N
                          </div>
                        )}
                      </Link>

                      {discountPercentage >
                        0 && (
                        <span className="wishlist-card-discount">
                          -
                          {
                            discountPercentage
                          }
                          %
                        </span>
                      )}

                      {outOfStock && (
                        <span className="wishlist-card-stock-badge">
                          Out of Stock
                        </span>
                      )}

                      <button
                        type="button"
                        className="wishlist-card-remove-top"
                        onClick={() =>
                          removeFromWishlist(
                            productId
                          )
                        }
                        aria-label={`Remove ${product.name} from wishlist`}
                        title="Remove from wishlist"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <div className="wishlist-card-content">
                      <div className="wishlist-card-meta">
                        {product.category && (
                          <span>
                            {
                              product.category
                            }
                          </span>
                        )}

                        {product.brand && (
                          <span>
                            {
                              product.brand
                            }
                          </span>
                        )}
                      </div>

                      <h3>
                        <Link
                          to={`/products/${slug}`}
                        >
                          {
                            product.name
                          }
                        </Link>
                      </h3>

                      {product.shortDescription && (
                        <p className="wishlist-card-description">
                          {
                            product.shortDescription
                          }
                        </p>
                      )}

                      <div className="wishlist-card-price">
                        <strong>
                          ₹
                          {finalPrice.toLocaleString(
                            "en-IN",
                            {
                              maximumFractionDigits:
                                2,
                            }
                          )}
                        </strong>

                        {hasDiscount && (
                          <span>
                            ₹
                            {regularPrice.toLocaleString(
                              "en-IN",
                              {
                                maximumFractionDigits:
                                  2,
                              }
                            )}
                          </span>
                        )}
                      </div>

                      <div className="wishlist-card-stock">
                        {outOfStock ? (
                          <span className="out">
                            Currently unavailable
                          </span>
                        ) : (
                          <span className="in">
                            In Stock
                          </span>
                        )}
                      </div>

                      <div className="wishlist-card-actions">
                        <button
                          type="button"
                          className="wishlist-card-cart-button"
                          onClick={() =>
                            handleMoveToCart(
                              productId
                            )
                          }
                          disabled={
                            outOfStock
                          }
                        >
                          <FaShoppingCart />

                          {outOfStock
                            ? "Out of Stock"
                            : "Move to Cart"}
                        </button>

                        <button
                          type="button"
                          className="wishlist-card-remove-button"
                          onClick={() =>
                            removeFromWishlist(
                              productId
                            )
                          }
                        >
                          <FaTrash />

                          Remove
                        </button>
                      </div>

                      <small className="wishlist-card-added-date">
                        Saved{" "}
                        {item.addedAt
                          ? new Date(
                              item.addedAt
                            ).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )
                          : ""}
                      </small>
                    </div>
                  </article>
                );
              }
            )}
          </div>

          <div className="wishlist-bottom-cta">
            <div>
              <FaHeart />

              <div>
                <strong>
                  Still looking?
                </strong>

                <span>
                  Discover more products and
                  add your favorites here.
                </span>
              </div>
            </div>

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
};

export default Wishlist;