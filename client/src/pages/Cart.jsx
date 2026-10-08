import {
  FaArrowLeft,
  FaMinus,
  FaPlus,
  FaShoppingBag,
  FaTrash,
} from "react-icons/fa";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import Loader from "../components/Loader.jsx";

import {
  useCart,
} from "../context/CartContext.jsx";

/**
 * NovaCart Cart Page
 *
 * Features:
 * - persistent cart
 * - quantity controls
 * - exact quantity input
 * - remove item
 * - clear cart
 * - subtotal
 * - shipping charge preview
 * - order total preview
 * - checkout navigation
 */
const Cart = () => {
  const navigate =
    useNavigate();

  const {
    items,
    loading,
    cartError,
    subtotal,
    totalItems,
    isEmpty,

    updateQuantity,
    incrementItem,
    decrementItem,
    removeFromCart,
    clearCart,
  } = useCart();

  /**
   * Free shipping on ₹500 or above.
   *
   * This matches the orderController.js logic.
   */
  const shippingCharge =
    subtotal >= 500 ||
    subtotal === 0
      ? 0
      : 50;

  const totalAmount =
    Number(
      (
        subtotal +
        shippingCharge
      ).toFixed(2)
    );

  const handleQuantityInput =
    async (
      productId,
      value,
      stock
    ) => {
      let quantity =
        Number(value);

      if (
        Number.isNaN(
          quantity
        )
      ) {
        return;
      }

      quantity =
        Math.floor(
          quantity
        );

      if (
        quantity < 1
      ) {
        quantity = 1;
      }

      if (
        quantity >
        stock
      ) {
        quantity = stock;
      }

      await updateQuantity(
        productId,
        quantity
      );
    };

  const handleCheckout =
    () => {
      if (
        isEmpty
      ) {
        return;
      }

      navigate(
        "/checkout"
      );
    };

  if (loading) {
    return (
      <main className="cart-page">
        <Loader
          fullPage
          text="Loading your cart..."
        />
      </main>
    );
  }

  if (isEmpty) {
    return (
      <main className="cart-page">
        <section className="cart-empty-section section-spacing">
          <div className="container">
            <div className="cart-empty-card">
              <div className="cart-empty-icon">
                <FaShoppingBag />
              </div>

              <h1>
                Your Cart is Empty
              </h1>

              <p>
                Add products to your cart
                and they will appear here
                ready for checkout.
              </p>

              <Link
                to="/products"
                className="primary-button"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="cart-page">
      <section className="cart-page-header">
        <div className="container">
          <div className="cart-page-header-content">
            <div>
              <span className="section-eyebrow">
                Your Shopping Bag
              </span>

              <h1>
                Shopping Cart
              </h1>

              <p>
                Review your products before
                proceeding to checkout.
              </p>
            </div>

            <Link
              to="/products"
              className="cart-continue-shopping"
            >
              <FaArrowLeft />

              Continue Shopping
            </Link>
          </div>
        </div>
      </section>

      <section className="cart-main-section section-spacing">
        <div className="container">
          {cartError && (
            <div className="cart-error-message">
              {cartError}
            </div>
          )}

          <div className="cart-layout">
            <div className="cart-items-column">
              <div className="cart-list-header">
                <div>
                  <h2>
                    Cart Items
                  </h2>

                  <span>
                    {totalItems}{" "}
                    item
                    {totalItems ===
                    1
                      ? ""
                      : "s"}
                  </span>
                </div>

                <button
                  type="button"
                  className="cart-clear-button"
                  onClick={
                    clearCart
                  }
                >
                  <FaTrash />

                  Clear Cart
                </button>
              </div>

              <div className="cart-items-list">
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

                    const stock =
                      Number(
                        product.stock ||
                          0
                      );

                    const lineTotal =
                      Number(
                        (
                          finalPrice *
                          item.quantity
                        ).toFixed(
                          2
                        )
                      );

                    return (
                      <article
                        key={
                          productId
                        }
                        className="cart-item"
                      >
                        <Link
                          to={`/products/${
                            product.slug ||
                            productId
                          }`}
                          className="cart-item-image"
                        >
                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                product.name
                              }
                            />
                          ) : (
                            <div className="cart-item-image-placeholder">
                              N
                            </div>
                          )}
                        </Link>

                        <div className="cart-item-content">
                          <div className="cart-item-main">
                            <div className="cart-item-details">
                              <span className="cart-item-category">
                                {
                                  product.category
                                }
                              </span>

                              <h3>
                                <Link
                                  to={`/products/${
                                    product.slug ||
                                    productId
                                  }`}
                                >
                                  {
                                    product.name
                                  }
                                </Link>
                              </h3>

                              {product.brand && (
                                <span className="cart-item-brand">
                                  {
                                    product.brand
                                  }
                                </span>
                              )}

                              <div className="cart-item-price">
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
                            </div>

                            <button
                              type="button"
                              className="cart-item-remove"
                              onClick={() =>
                                removeFromCart(
                                  productId
                                )
                              }
                              aria-label={`Remove ${product.name}`}
                              title="Remove product"
                            >
                              <FaTrash />
                            </button>
                          </div>

                          <div className="cart-item-bottom">
                            <div className="cart-item-quantity-wrap">
                              <span>
                                Quantity
                              </span>

                              <div className="cart-item-quantity">
                                <button
                                  type="button"
                                  onClick={() =>
                                    decrementItem(
                                      productId
                                    )
                                  }
                                  aria-label="Decrease quantity"
                                >
                                  <FaMinus />
                                </button>

                                <input
                                  type="number"
                                  min="1"
                                  max={
                                    stock
                                  }
                                  value={
                                    item.quantity
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleQuantityInput(
                                      productId,
                                      event.target
                                        .value,
                                      stock
                                    )
                                  }
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    incrementItem(
                                      productId
                                    )
                                  }
                                  disabled={
                                    item.quantity >=
                                    stock
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

                            <div className="cart-item-total">
                              <span>
                                Item Total
                              </span>

                              <strong>
                                ₹
                                {lineTotal.toLocaleString(
                                  "en-IN",
                                  {
                                    maximumFractionDigits:
                                      2,
                                  }
                                )}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>

              <div className="cart-shopping-note">
                <FaShoppingBag />

                <div>
                  <strong>
                    Keep Shopping
                  </strong>

                  <span>
                    You can continue adding
                    products before checkout.
                  </span>
                </div>

                <Link to="/products">
                  Browse Products
                </Link>
              </div>
            </div>

            <aside className="cart-summary">
              <div className="cart-summary-card">
                <h2>
                  Order Summary
                </h2>

                <div className="cart-summary-row">
                  <span>
                    Items
                  </span>

                  <strong>
                    {
                      totalItems
                    }
                  </strong>
                </div>

                <div className="cart-summary-row">
                  <span>
                    Subtotal
                  </span>

                  <strong>
                    ₹
                    {subtotal.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}
                  </strong>
                </div>

                <div className="cart-summary-row">
                  <span>
                    Shipping
                  </span>

                  <strong
                    className={
                      shippingCharge ===
                      0
                        ? "cart-summary-free"
                        : ""
                    }
                  >
                    {shippingCharge ===
                    0
                      ? "FREE"
                      : `₹${shippingCharge.toLocaleString(
                          "en-IN"
                        )}`}
                  </strong>
                </div>

                {subtotal <
                  500 &&
                  subtotal >
                    0 && (
                    <div className="cart-free-shipping-message">
                      Add ₹
                      {(
                        500 -
                        subtotal
                      ).toLocaleString(
                        "en-IN",
                        {
                          maximumFractionDigits:
                            2,
                        }
                      )}{" "}
                      more for free
                      shipping.
                    </div>
                  )}

                <div className="cart-summary-divider" />

                <div className="cart-summary-total">
                  <span>
                    Total
                  </span>

                  <strong>
                    ₹
                    {totalAmount.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}
                  </strong>
                </div>

                <p className="cart-summary-tax-note">
                  Taxes are included in
                  product prices.
                </p>

                <button
                  type="button"
                  className="cart-checkout-button"
                  onClick={
                    handleCheckout
                  }
                >
                  Proceed to Checkout
                </button>

                <Link
                  to="/products"
                  className="cart-summary-continue"
                >
                  Continue Shopping
                </Link>

                <div className="cart-payment-info">
                  <span>
                    Available payment methods
                  </span>

                  <strong>
                    COD • UPI • Card
                  </strong>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Cart;