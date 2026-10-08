import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api, {
  getApiErrorMessage,
} from "../api/api.js";

import {
  useAuth,
} from "./AuthContext.jsx";

const CartContext =
  createContext(null);

const CartProvider = ({
  children,
}) => {
  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const [cart, setCart] =
    useState({
      items: [],
      subtotal: 0,
      totalItems: 0,
      isEmpty: true,
    });

  const [loading, setLoading] =
    useState(false);

  const [
    cartError,
    setCartError,
  ] = useState("");

  /**
   * Standard empty cart structure.
   */
  const createEmptyCart =
    useCallback(
      () => ({
        items: [],
        subtotal: 0,
        totalItems: 0,
        isEmpty: true,
      }),
      []
    );

  /**
   * Normalize cart data received from
   * the backend.
   *
   * Backend normally returns:
   *
   * {
   *   _id,
   *   user,
   *   items,
   *   subtotal,
   *   totalItems,
   *   isEmpty,
   *   ...
   * }
   *
   * This function protects the UI from
   * malformed or temporarily incomplete
   * responses.
   */
  const normalizeCart =
    useCallback(
      (value) => {
        if (
          !value ||
          typeof value !==
            "object"
        ) {
          return createEmptyCart();
        }

        const items =
          Array.isArray(
            value.items
          )
            ? value.items
            : [];

        const subtotal =
          Number(
            value.subtotal ||
              0
          );

        const totalItems =
          Number(
            value.totalItems ||
              0
          );

        return {
          ...value,

          items,

          subtotal:
            Number.isFinite(
              subtotal
            )
              ? subtotal
              : 0,

          totalItems:
            Number.isFinite(
              totalItems
            )
              ? totalItems
              : 0,

          isEmpty:
            items.length ===
            0,
        };
      },
      [createEmptyCart]
    );

  /**
   * Update cart state from a backend
   * response.
   */
  const applyCart =
    useCallback(
      (nextCart) => {
        const normalized =
          normalizeCart(
            nextCart
          );

        setCart(
          normalized
        );

        return normalized;
      },
      [normalizeCart]
    );

  const clearCartError =
    useCallback(() => {
      setCartError("");
    }, []);

  /**
   * Return a standard login-required
   * result for protected cart actions.
   */
  const requireLogin =
    useCallback(() => {
      const message =
        "Please log in to use your cart.";

      setCartError(
        message
      );

      return {
        success: false,
        requiresLogin: true,
        message,
      };
    }, []);

  /**
   * GET /api/cart
   *
   * Backend synchronizes the cart before
   * returning it.
   */
  const refreshCart =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (
          !isAuthenticated
        ) {
          const emptyCart =
            createEmptyCart();

          setCart(
            emptyCart
          );

          setCartError("");

          return emptyCart;
        }

        try {
          if (!silent) {
            setLoading(true);
          }

          setCartError("");

          const response =
            await api.get(
              "/cart"
            );

          return applyCart(
            response.data?.cart
          );
        } catch (error) {
          const status =
            error.response?.status;

          /**
           * Authentication failure should
           * not leave an old customer's
           * cart visible.
           */
          if (
            status === 401 ||
            status === 403
          ) {
            setCart(
              createEmptyCart()
            );
          }

          const message =
            getApiErrorMessage(
              error,
              "Unable to load your cart."
            );

          setCartError(
            message
          );

          return null;
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      },
      [
        isAuthenticated,
        createEmptyCart,
        applyCart,
      ]
    );

  /**
   * POST /api/cart
   *
   * Body:
   * {
   *   productId,
   *   quantity
   * }
   */
  const addToCart =
    useCallback(
      async (
        productId,
        quantity = 1
      ) => {
        if (
          !isAuthenticated
        ) {
          return requireLogin();
        }

        if (!productId) {
          const message =
            "Product ID is required.";

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        const requestedQuantity =
          Number(quantity);

        if (
          !Number.isInteger(
            requestedQuantity
          ) ||
          requestedQuantity <
            1
        ) {
          const message =
            "Quantity must be a whole number greater than zero.";

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setCartError("");

          const response =
            await api.post(
              "/cart",
              {
                productId,
                quantity:
                  requestedQuantity,
              }
            );

          const updatedCart =
            applyCart(
              response.data?.cart
            );

          return {
            success: true,
            cart:
              updatedCart,

            message:
              response.data
                ?.message ||
              "Product added to cart.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to add product to cart."
            );

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      [
        isAuthenticated,
        requireLogin,
        applyCart,
      ]
    );

  /**
   * PUT /api/cart/:productId
   *
   * Set exact quantity.
   */
  const updateQuantity =
    useCallback(
      async (
        productId,
        quantity
      ) => {
        if (
          !isAuthenticated
        ) {
          return requireLogin();
        }

        if (!productId) {
          const message =
            "Product ID is required.";

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        const requestedQuantity =
          Number(quantity);

        if (
          !Number.isInteger(
            requestedQuantity
          ) ||
          requestedQuantity <
            1
        ) {
          const message =
            "Quantity must be a whole number greater than zero.";

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setCartError("");

          const response =
            await api.put(
              `/cart/${productId}`,
              {
                quantity:
                  requestedQuantity,
              }
            );

          const updatedCart =
            applyCart(
              response.data?.cart
            );

          return {
            success: true,
            cart:
              updatedCart,

            message:
              response.data
                ?.message ||
              "Cart updated successfully.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to update cart."
            );

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      [
        isAuthenticated,
        requireLogin,
        applyCart,
      ]
    );

  /**
   * PATCH
   * /api/cart/:productId/increment
   */
  const incrementItem =
    useCallback(
      async (
        productId
      ) => {
        if (
          !isAuthenticated
        ) {
          return requireLogin();
        }

        if (!productId) {
          const message =
            "Product ID is required.";

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setCartError("");

          const response =
            await api.patch(
              `/cart/${productId}/increment`
            );

          const updatedCart =
            applyCart(
              response.data?.cart
            );

          return {
            success: true,
            cart:
              updatedCart,

            message:
              response.data
                ?.message ||
              "Product quantity increased.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to increase product quantity."
            );

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      [
        isAuthenticated,
        requireLogin,
        applyCart,
      ]
    );

  /**
   * PATCH
   * /api/cart/:productId/decrement
   *
   * Backend removes the item when its
   * quantity reaches zero.
   */
  const decrementItem =
    useCallback(
      async (
        productId
      ) => {
        if (
          !isAuthenticated
        ) {
          return requireLogin();
        }

        if (!productId) {
          const message =
            "Product ID is required.";

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setCartError("");

          const response =
            await api.patch(
              `/cart/${productId}/decrement`
            );

          const updatedCart =
            applyCart(
              response.data?.cart
            );

          return {
            success: true,
            cart:
              updatedCart,

            message:
              response.data
                ?.message ||
              "Product quantity decreased.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to decrease product quantity."
            );

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      [
        isAuthenticated,
        requireLogin,
        applyCart,
      ]
    );

  /**
   * DELETE
   * /api/cart/:productId
   */
  const removeFromCart =
    useCallback(
      async (
        productId
      ) => {
        if (
          !isAuthenticated
        ) {
          return requireLogin();
        }

        if (!productId) {
          const message =
            "Product ID is required.";

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setCartError("");

          const response =
            await api.delete(
              `/cart/${productId}`
            );

          const updatedCart =
            applyCart(
              response.data?.cart
            );

          return {
            success: true,
            cart:
              updatedCart,

            message:
              response.data
                ?.message ||
              "Product removed from cart.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to remove product from cart."
            );

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      [
        isAuthenticated,
        requireLogin,
        applyCart,
      ]
    );

  /**
   * DELETE /api/cart
   */
  const clearCart =
    useCallback(
      async () => {
        if (
          !isAuthenticated
        ) {
          /**
           * Logging out already clears
           * the local cart, so clearing
           * while logged out can simply
           * return an empty cart.
           */
          const emptyCart =
            createEmptyCart();

          setCart(
            emptyCart
          );

          setCartError("");

          return {
            success: true,
            cart:
              emptyCart,
            message:
              "Cart cleared.",
          };
        }

        try {
          setCartError("");

          const response =
            await api.delete(
              "/cart"
            );

          const updatedCart =
            applyCart(
              response.data?.cart
            );

          return {
            success: true,
            cart:
              updatedCart,

            message:
              response.data
                ?.message ||
              "Cart cleared successfully.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to clear cart."
            );

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      [
        isAuthenticated,
        createEmptyCart,
        applyCart,
      ]
    );

  /**
   * GET /api/cart/summary
   *
   * Backend synchronizes products,
   * stock and prices before generating
   * this summary.
   */
  const getCartSummary =
    useCallback(
      async () => {
        if (
          !isAuthenticated
        ) {
          return requireLogin();
        }

        try {
          setCartError("");

          const response =
            await api.get(
              "/cart/summary"
            );

          const updatedCart =
            applyCart(
              response.data?.cart
            );

          const summary =
            response.data?.summary ||
            {
              totalItems:
                updatedCart.totalItems,

              subtotal:
                updatedCart.subtotal,

              isEmpty:
                updatedCart.isEmpty,
            };

          return {
            success: true,

            summary: {
              totalItems:
                Number(
                  summary.totalItems ||
                    0
                ),

              subtotal:
                Number(
                  summary.subtotal ||
                    0
                ),

              isEmpty:
                Boolean(
                  summary.isEmpty
                ),
            },

            cart:
              updatedCart,
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to prepare checkout summary."
            );

          setCartError(
            message
          );

          return {
            success: false,
            message,
          };
        }
      },
      [
        isAuthenticated,
        requireLogin,
        applyCart,
      ]
    );

  /**
   * Refresh cart when authentication
   * finishes or login/logout state
   * changes.
   *
   * Login:
   *   load the user's persistent cart.
   *
   * Logout:
   *   immediately remove the previous
   *   user's cart from the interface.
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (
      isAuthenticated
    ) {
      refreshCart();
    } else {
      setCart(
        createEmptyCart()
      );

      setCartError("");
      setLoading(false);
    }
  }, [
    authLoading,
    isAuthenticated,
    refreshCart,
    createEmptyCart,
  ]);

  /**
   * Derived values.
   */
  const items =
    useMemo(
      () =>
        Array.isArray(
          cart?.items
        )
          ? cart.items
          : [],
      [cart]
    );

  const totalItems =
    useMemo(
      () =>
        Number(
          cart?.totalItems ||
            0
        ),
      [cart]
    );

  const subtotal =
    useMemo(
      () =>
        Number(
          cart?.subtotal ||
            0
        ),
      [cart]
    );

  const isEmpty =
    items.length === 0;

  /**
   * Extract product ID safely from
   * either:
   *
   * product: "mongo-id"
   *
   * OR
   *
   * product: {
   *   _id: "mongo-id",
   *   ...
   * }
   */
  const getProductId =
    useCallback(
      (item) => {
        const product =
          item?.product;

        if (!product) {
          return "";
        }

        if (
          typeof product ===
          "string"
        ) {
          return product;
        }

        return (
          product._id ||
          ""
        );
      },
      []
    );

  const isInCart =
    useCallback(
      (productId) => {
        if (!productId) {
          return false;
        }

        const targetId =
          String(
            productId
          );

        return items.some(
          (item) =>
            String(
              getProductId(
                item
              )
            ) === targetId
        );
      },
      [
        items,
        getProductId,
      ]
    );

  const getItemQuantity =
    useCallback(
      (productId) => {
        if (!productId) {
          return 0;
        }

        const targetId =
          String(
            productId
          );

        const item =
          items.find(
            (cartItem) =>
              String(
                getProductId(
                  cartItem
                )
              ) ===
              targetId
          );

        return Number(
          item?.quantity ||
            0
        );
      },
      [
        items,
        getProductId,
      ]
    );

  /**
   * Useful helper for pages that need
   * the entire cart item rather than
   * only its quantity.
   */
  const getCartItem =
    useCallback(
      (productId) => {
        if (!productId) {
          return null;
        }

        const targetId =
          String(
            productId
          );

        return (
          items.find(
            (item) =>
              String(
                getProductId(
                  item
                )
              ) ===
              targetId
          ) || null
        );
      },
      [
        items,
        getProductId,
      ]
    );

  const value =
    useMemo(
      () => ({
        cart,
        items,

        loading,
        cartError,

        totalItems,
        subtotal,
        isEmpty,

        refreshCart,

        addToCart,
        updateQuantity,
        incrementItem,
        decrementItem,
        removeFromCart,
        clearCart,

        getCartSummary,

        isInCart,
        getItemQuantity,
        getCartItem,

        clearCartError,
      }),
      [
        cart,
        items,

        loading,
        cartError,

        totalItems,
        subtotal,
        isEmpty,

        refreshCart,

        addToCart,
        updateQuantity,
        incrementItem,
        decrementItem,
        removeFromCart,
        clearCart,

        getCartSummary,

        isInCart,
        getItemQuantity,
        getCartItem,

        clearCartError,
      ]
    );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
};

const useCart = () => {
  const context =
    useContext(
      CartContext
    );

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider."
    );
  }

  return context;
};

export {
  CartContext,
  CartProvider,
  useCart,
};