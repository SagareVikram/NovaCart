import {
  FaHeart,
  FaRegHeart,
  FaShoppingCart,
  FaStar,
} from "react-icons/fa";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import {
  useCart,
} from "../context/CartContext.jsx";

import {
  useWishlist,
} from "../context/WishlistContext.jsx";

/**
 * Reusable NovaCart product card.
 *
 * Used on:
 * - Home
 * - Products
 * - Search results
 * - Related products
 * - Best sellers
 * - New arrivals
 * - Featured products
 */
const ProductCard = ({
  product,
}) => {
  const navigate =
    useNavigate();

  const {
    isAuthenticated,
  } = useAuth();

  const {
    addToCart,
    isInCart,
  } = useCart();

  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  if (!product) {
    return null;
  }

  const productId =
    product._id;

  const slug =
    product.slug ||
    productId;

  const image =
    product.images?.[0]
      ?.url || "";

  const regularPrice =
    Number(
      product.price || 0
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
      product.stock || 0
    );

  const outOfStock =
    stock <= 0;

  const lowStock =
    stock > 0 &&
    stock <=
      Number(
        product
          .lowStockThreshold ||
          5
      );

  const rating =
    Number(
      product.ratingAverage ||
        0
    );

  const ratingCount =
    Number(
      product.ratingCount ||
        0
    );

  const productInCart =
    isInCart(
      productId
    );

  const productInWishlist =
    isInWishlist(
      productId
    );

  /**
   * Add product to cart.
   */
  const handleAddToCart =
    async (
      event
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (!isAuthenticated) {
        navigate(
          "/login",
          {
            state: {
              from: {
                pathname:
                  `/products/${slug}`,
              },
            },
          }
        );

        return;
      }

      if (outOfStock) {
        return;
      }

      const result =
        await addToCart(
          productId,
          1
        );

      if (
        !result.success &&
        result.requiresLogin
      ) {
        navigate(
          "/login"
        );
      }
    };

  /**
   * Toggle wishlist.
   */
  const handleWishlist =
    async (
      event
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (!isAuthenticated) {
        navigate(
          "/login",
          {
            state: {
              from: {
                pathname:
                  `/products/${slug}`,
              },
            },
          }
        );

        return;
      }

      await toggleWishlist(
        productId
      );
    };

  return (
    <article className="product-card">
      <div className="product-card-image-wrap">
        <Link
          to={`/products/${slug}`}
          className="product-card-image-link"
          aria-label={`View ${product.name}`}
        >
          {image ? (
            <img
              src={image}
              alt={
                product.images?.[0]
                  ?.altText ||
                product.name
              }
              className="product-card-image"
              loading="lazy"
            />
          ) : (
            <div className="product-card-image-placeholder">
              <span>
                NovaCart
              </span>
            </div>
          )}
        </Link>

        <div className="product-card-badges">
          {discountPercentage >
            0 && (
            <span className="product-badge product-badge-discount">
              -
              {
                discountPercentage
              }
              %
            </span>
          )}

          {product.isFeatured && (
            <span className="product-badge product-badge-featured">
              Featured
            </span>
          )}

          {outOfStock && (
            <span className="product-badge product-badge-out">
              Out of Stock
            </span>
          )}

          {lowStock &&
            !outOfStock && (
              <span className="product-badge product-badge-low">
                Low Stock
              </span>
            )}
        </div>

        <button
          type="button"
          className={`product-card-wishlist ${
            productInWishlist
              ? "active"
              : ""
          }`}
          onClick={
            handleWishlist
          }
          aria-label={
            productInWishlist
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          title={
            productInWishlist
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
        >
          {productInWishlist ? (
            <FaHeart />
          ) : (
            <FaRegHeart />
          )}
        </button>
      </div>

      <div className="product-card-content">
        <div className="product-card-meta">
          {product.category && (
            <span className="product-card-category">
              {
                product.category
              }
            </span>
          )}

          {product.brand && (
            <span className="product-card-brand">
              {
                product.brand
              }
            </span>
          )}
        </div>

        <h3 className="product-card-title">
          <Link
            to={`/products/${slug}`}
          >
            {product.name}
          </Link>
        </h3>

        {product.shortDescription && (
          <p className="product-card-description">
            {
              product.shortDescription
            }
          </p>
        )}

        <div className="product-card-rating">
          <span className="product-card-stars">
            <FaStar />
            <strong>
              {rating.toFixed(
                1
              )}
            </strong>
          </span>

          <span className="product-card-rating-count">
            (
            {
              ratingCount
            }
            )
          </span>
        </div>

        <div className="product-card-price-row">
          <div className="product-card-price">
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

          {!outOfStock && (
            <span className="product-card-stock">
              In Stock
            </span>
          )}
        </div>

        <div className="product-card-actions">
          <Link
            to={`/products/${slug}`}
            className="product-card-view"
          >
            View Details
          </Link>

          <button
            type="button"
            className={`product-card-cart ${
              productInCart
                ? "added"
                : ""
            }`}
            onClick={
              handleAddToCart
            }
            disabled={
              outOfStock ||
              productInCart
            }
          >
            <FaShoppingCart />

            <span>
              {outOfStock
                ? "Out of Stock"
                : productInCart
                  ? "In Cart"
                  : "Add to Cart"}
            </span>
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard; 