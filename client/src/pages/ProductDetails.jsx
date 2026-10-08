import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaCheck,
  FaHeart,
  FaMinus,
  FaPlus,
  FaRegHeart,
  FaShieldAlt,
  FaShoppingCart,
  FaStar,
  FaTruck,
} from "react-icons/fa";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import Loader from "../components/Loader.jsx";
import ProductCard from "../components/ProductCard.jsx";

import {
  useAuth,
} from "../context/AuthContext.jsx";

import {
  useCart,
} from "../context/CartContext.jsx";

import {
  useWishlist,
} from "../context/WishlistContext.jsx";

const ProductDetails = () => {
  const {
    identifier,
  } = useParams();

  const navigate =
    useNavigate();

  const {
    isAuthenticated,
  } = useAuth();

  const {
    addToCart,
    isInCart,
    getItemQuantity,
  } = useCart();

  const {
    toggleWishlist,
    isInWishlist,
  } = useWishlist();

  const [
    product,
    setProduct,
  ] = useState(null);

  const [
    relatedProducts,
    setRelatedProducts,
  ] = useState([]);

  const [
    selectedImageIndex,
    setSelectedImageIndex,
  ] = useState(0);

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    relatedLoading,
    setRelatedLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    actionMessage,
    setActionMessage,
  ] = useState("");

  const [
    actionError,
    setActionError,
  ] = useState("");

  const loadProduct =
    useCallback(
      async () => {
        try {
          setLoading(true);
          setError("");

          const response =
            await api.get(
              `/products/${encodeURIComponent(
                identifier
              )}`
            );

          const loadedProduct =
            response.data?.product ||
            null;

          setProduct(
            loadedProduct
          );

          setSelectedImageIndex(
            0
          );

          setQuantity(1);
        } catch (error) {
          setProduct(null);

          setError(
            getApiErrorMessage(
              error,
              "Unable to load product details."
            )
          );
        } finally {
          setLoading(false);
        }
      },
      [identifier]
    );

  const loadRelatedProducts =
    useCallback(
      async () => {
        try {
          setRelatedLoading(
            true
          );

          const response =
            await api.get(
              `/products/${encodeURIComponent(
                identifier
              )}/related?limit=4`
            );

          setRelatedProducts(
            response.data
              ?.products || []
          );
        } catch (error) {
          console.error(
            "Unable to load related products:",
            error
          );

          setRelatedProducts(
            []
          );
        } finally {
          setRelatedLoading(
            false
          );
        }
      },
      [identifier]
    );

  useEffect(() => {
    loadProduct();
    loadRelatedProducts();

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [
    loadProduct,
    loadRelatedProducts,
  ]);

  const images =
    useMemo(
      () =>
        Array.isArray(
          product?.images
        )
          ? product.images
          : [],
      [product]
    );

  const selectedImage =
    images[
      selectedImageIndex
    ] || null;

  const regularPrice =
    Number(
      product?.price || 0
    );

  const discountPrice =
    product?.discountPrice !==
      null &&
    product?.discountPrice !==
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
    regularPrice > 0
      ? Math.round(
          ((regularPrice -
            discountPrice) /
            regularPrice) *
            100
        )
      : 0;

  const stock =
    Number(
      product?.stock || 0
    );

  const outOfStock =
    stock <= 0;

  const productInCart =
    product
      ? isInCart(
          product._id
        )
      : false;

  const cartQuantity =
    product
      ? getItemQuantity(
          product._id
        )
      : 0;

  const productInWishlist =
    product
      ? isInWishlist(
          product._id
        )
      : false;

  const maxQuantity =
    Math.max(
      stock,
      1
    );

  const increaseQuantity =
    () => {
      setQuantity(
        (current) =>
          Math.min(
            current + 1,
            maxQuantity
          )
      );
    };

  const decreaseQuantity =
    () => {
      setQuantity(
        (current) =>
          Math.max(
            current - 1,
            1
          )
      );
    };

  const handleQuantityChange =
    (event) => {
      const value =
        Number(
          event.target.value
        );

      if (
        Number.isNaN(value)
      ) {
        return;
      }

      setQuantity(
        Math.min(
          Math.max(
            Math.floor(value),
            1
          ),
          maxQuantity
        )
      );
    };

  const redirectToLogin =
    () => {
      navigate(
        "/login",
        {
          state: {
            from: {
              pathname:
                `/products/${identifier}`,
            },
          },
        }
      );
    };

  const handleAddToCart =
    async () => {
      setActionMessage("");
      setActionError("");

      if (!product) {
        return;
      }

      if (!isAuthenticated) {
        redirectToLogin();
        return;
      }

      if (outOfStock) {
        setActionError(
          "This product is currently out of stock."
        );
        return;
      }

      if (productInCart) {
        navigate("/cart");
        return;
      }

      const result =
        await addToCart(
          product._id,
          quantity
        );

      if (result.success) {
        setActionMessage(
          result.message ||
            "Product added to cart."
        );
      } else {
        setActionError(
          result.message ||
            "Unable to add product to cart."
        );
      }
    };

  const handleWishlist =
    async () => {
      setActionMessage("");
      setActionError("");

      if (!product) {
        return;
      }

      if (!isAuthenticated) {
        redirectToLogin();
        return;
      }

      const result =
        await toggleWishlist(
          product._id
        );

      if (result.success) {
        setActionMessage(
          result.message ||
            "Wishlist updated."
        );
      } else {
        setActionError(
          result.message ||
            "Unable to update wishlist."
        );
      }
    };

  const handleBuyNow =
    async () => {
      setActionMessage("");
      setActionError("");

      if (!product) {
        return;
      }

      if (!isAuthenticated) {
        redirectToLogin();
        return;
      }

      if (outOfStock) {
        setActionError(
          "This product is currently out of stock."
        );
        return;
      }

      if (productInCart) {
        navigate(
          "/checkout"
        );

        return;
      }

      const result =
        await addToCart(
          product._id,
          quantity
        );

      if (result.success) {
        navigate(
          "/checkout"
        );
      } else {
        setActionError(
          result.message ||
            "Unable to continue to checkout."
        );
      }
    };

  if (loading) {
    return (
      <main className="product-details-page">
        <Loader
          fullPage
          text="Loading product details..."
        />
      </main>
    );
  }

  if (
    error ||
    !product
  ) {
    return (
      <main className="product-details-page">
        <section className="product-details-error">
          <div className="container">
            <h1>
              Product Not Available
            </h1>

            <p>
              {error ||
                "The product you are looking for could not be found."}
            </p>

            <Link
              to="/products"
              className="primary-button"
            >
              Back to Products
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="product-details-page">
      <section className="product-details-breadcrumb-section">
        <div className="container">
          <nav className="product-details-breadcrumb">
            <Link to="/">
              Home
            </Link>

            <span>
              /
            </span>

            <Link to="/products">
              Products
            </Link>

            {product.category && (
              <>
                <span>
                  /
                </span>

                <Link
                  to={`/products?category=${encodeURIComponent(
                    product.category
                  )}`}
                >
                  {
                    product.category
                  }
                </Link>
              </>
            )}

            <span>
              /
            </span>

            <strong>
              {product.name}
            </strong>
          </nav>
        </div>
      </section>

      <section className="product-details-main section-spacing">
        <div className="container">
          <div className="product-details-layout">
            <div className="product-details-gallery">
              <div className="product-details-thumbnails">
                {images.length >
                0 ? (
                  images.map(
                    (
                      image,
                      index
                    ) => (
                      <button
                        type="button"
                        key={`${image.publicId || image.url}-${index}`}
                        className={
                          selectedImageIndex ===
                          index
                            ? "active"
                            : ""
                        }
                        onClick={() =>
                          setSelectedImageIndex(
                            index
                          )
                        }
                        aria-label={`View image ${
                          index +
                          1
                        }`}
                      >
                        <img
                          src={
                            image.url
                          }
                          alt={
                            image.altText ||
                            `${product.name} ${
                              index +
                              1
                            }`
                          }
                        />
                      </button>
                    )
                  )
                ) : (
                  <div className="product-details-no-thumbnail">
                    N
                  </div>
                )}
              </div>

              <div className="product-details-main-image">
                {selectedImage ? (
                  <img
                    src={
                      selectedImage.url
                    }
                    alt={
                      selectedImage.altText ||
                      product.name
                    }
                  />
                ) : (
                  <div className="product-details-image-placeholder">
                    <span>
                      NovaCart
                    </span>

                    <small>
                      Product Image
                    </small>
                  </div>
                )}

                {discountPercentage >
                  0 && (
                  <span className="product-details-discount-badge">
                    -
                    {
                      discountPercentage
                    }
                    %
                  </span>
                )}
              </div>
            </div>

            <div className="product-details-info">
              <div className="product-details-meta">
                {product.category && (
                  <Link
                    to={`/products?category=${encodeURIComponent(
                      product.category
                    )}`}
                  >
                    {
                      product.category
                    }
                  </Link>
                )}

                {product.brand && (
                  <span>
                    {
                      product.brand
                    }
                  </span>
                )}
              </div>

              <h1>
                {product.name}
              </h1>

              <div className="product-details-rating-row">
                <div className="product-details-rating">
                  <FaStar />

                  <strong>
                    {Number(
                      product.ratingAverage ||
                        0
                    ).toFixed(
                      1
                    )}
                  </strong>
                </div>

                <span>
                  {
                    product.ratingCount ||
                    0
                  }{" "}
                  ratings
                </span>

                <span className="product-details-separator">
                  •
                </span>

                <span>
                  {
                    product.soldCount ||
                    0
                  }{" "}
                  sold
                </span>
              </div>

              <p className="product-details-short-description">
                {
                  product.shortDescription
                }
              </p>

              <div className="product-details-price-block">
                <div className="product-details-price">
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

                {hasDiscount && (
                  <span className="product-details-saving">
                    Save ₹
                    {(
                      regularPrice -
                      discountPrice
                    ).toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}
                  </span>
                )}
              </div>

              <div
                className={`product-details-stock ${
                  outOfStock
                    ? "out"
                    : ""
                }`}
              >
                {outOfStock ? (
                  <>
                    <span className="product-details-stock-dot" />

                    Out of Stock
                  </>
                ) : (
                  <>
                    <FaCheck />

                    In Stock

                    {stock <=
                      Number(
                        product.lowStockThreshold ||
                          5
                      ) && (
                      <span>
                        Only{" "}
                        {stock}{" "}
                        left
                      </span>
                    )}
                  </>
                )}
              </div>

              {!outOfStock && (
                <div className="product-details-quantity-section">
                  <span>
                    Quantity
                  </span>

                  <div className="product-details-quantity">
                    <button
                      type="button"
                      onClick={
                        decreaseQuantity
                      }
                      disabled={
                        quantity <=
                        1
                      }
                      aria-label="Decrease quantity"
                    >
                      <FaMinus />
                    </button>

                    <input
                      type="number"
                      min="1"
                      max={
                        maxQuantity
                      }
                      value={
                        quantity
                      }
                      onChange={
                        handleQuantityChange
                      }
                    />

                    <button
                      type="button"
                      onClick={
                        increaseQuantity
                      }
                      disabled={
                        quantity >=
                        maxQuantity
                      }
                      aria-label="Increase quantity"
                    >
                      <FaPlus />
                    </button>
                  </div>

                  <small>
                    {
                      stock
                    }{" "}
                    available
                  </small>
                </div>
              )}

              {actionMessage && (
                <div className="product-details-action-message success">
                  {
                    actionMessage
                  }
                </div>
              )}

              {actionError && (
                <div className="product-details-action-message error">
                  {
                    actionError
                  }
                </div>
              )}

              <div className="product-details-actions">
                <button
                  type="button"
                  className="product-details-add-cart"
                  onClick={
                    handleAddToCart
                  }
                  disabled={
                    outOfStock
                  }
                >
                  <FaShoppingCart />

                  {outOfStock
                    ? "Out of Stock"
                    : productInCart
                      ? `View Cart${
                          cartQuantity >
                          0
                            ? ` (${cartQuantity})`
                            : ""
                        }`
                      : "Add to Cart"}
                </button>

                <button
                  type="button"
                  className="product-details-buy-now"
                  onClick={
                    handleBuyNow
                  }
                  disabled={
                    outOfStock
                  }
                >
                  Buy Now
                </button>

                <button
                  type="button"
                  className={`product-details-wishlist ${
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
                >
                  {productInWishlist ? (
                    <FaHeart />
                  ) : (
                    <FaRegHeart />
                  )}
                </button>
              </div>

              <div className="product-details-service-box">
                <div>
                  <FaTruck />

                  <div>
                    <strong>
                      Free Shipping
                    </strong>

                    <span>
                      On orders above ₹500
                    </span>
                  </div>
                </div>

                <div>
                  <FaShieldAlt />

                  <div>
                    <strong>
                      Secure Checkout
                    </strong>

                    <span>
                      COD, UPI and Card
                    </span>
                  </div>
                </div>
              </div>

              <div className="product-details-basic-info">
                <div>
                  <span>
                    SKU
                  </span>

                  <strong>
                    {
                      product.sku
                    }
                  </strong>
                </div>

                {product.brand && (
                  <div>
                    <span>
                      Brand
                    </span>

                    <strong>
                      {
                        product.brand
                      }
                    </strong>
                  </div>
                )}

                <div>
                  <span>
                    Category
                  </span>

                  <strong>
                    {
                      product.category
                    }
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="product-details-content-section section-spacing">
        <div className="container">
          <div className="product-details-content-grid">
            <div className="product-details-description-card">
              <span className="section-eyebrow">
                Product Information
              </span>

              <h2>
                Description
              </h2>

              <div className="product-details-description-text">
                {String(
                  product.description ||
                    ""
                )
                  .split(
                    "\n"
                  )
                  .filter(
                    Boolean
                  )
                  .map(
                    (
                      paragraph,
                      index
                    ) => (
                      <p
                        key={`${paragraph}-${index}`}
                      >
                        {
                          paragraph
                        }
                      </p>
                    )
                  )}
              </div>
            </div>

            <div className="product-details-specifications-card">
              <span className="section-eyebrow">
                Details
              </span>

              <h2>
                Specifications
              </h2>

              {product.specifications
                ?.length >
              0 ? (
                <div className="product-details-specifications">
                  {product.specifications.map(
                    (
                      specification,
                      index
                    ) => (
                      <div
                        key={`${specification.key}-${index}`}
                      >
                        <span>
                          {
                            specification.key
                          }
                        </span>

                        <strong>
                          {
                            specification.value
                          }
                        </strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="product-details-no-specifications">
                  <p>
                    Detailed specifications
                    have not been added for
                    this product yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {product.tags?.length >
            0 && (
            <div className="product-details-tags">
              <strong>
                Tags:
              </strong>

              <div>
                {product.tags.map(
                  (tag) => (
                    <Link
                      key={
                        tag
                      }
                      to={`/products?search=${encodeURIComponent(
                        tag
                      )}`}
                    >
                      {tag}
                    </Link>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="product-related-section section-spacing">
        <div className="container">
          <div className="section-heading section-heading-row">
            <div>
              <span className="section-eyebrow">
                You May Also Like
              </span>

              <h2>
                Related Products
              </h2>

              <p>
                Explore more products from
                the same category.
              </p>
            </div>

            <Link
              to={`/products?category=${encodeURIComponent(
                product.category
              )}`}
              className="section-link"
            >
              View Category
            </Link>
          </div>

          {relatedLoading ? (
            <Loader
              text="Loading related products..."
            />
          ) : relatedProducts.length >
            0 ? (
            <div className="product-grid">
              {relatedProducts.map(
                (
                  relatedProduct
                ) => (
                  <ProductCard
                    key={
                      relatedProduct._id
                    }
                    product={
                      relatedProduct
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="product-details-related-empty">
              <p>
                No related products are
                available yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default ProductDetails;