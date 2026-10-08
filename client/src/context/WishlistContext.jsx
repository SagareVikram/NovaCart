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

import {
  useCart,
} from "./CartContext.jsx";

const WishlistContext =
  createContext(null);

const WishlistProvider = ({
  children,
}) => {
  const {
    isAuthenticated,
    loading: authLoading,
  } = useAuth();

  const {
    refreshCart,
  } = useCart();

  const [
    wishlist,
    setWishlist,
  ] = useState({
    items: [],
    totalItems: 0,
    isEmpty: true,
  });

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    wishlistError,
    setWishlistError,
  ] = useState("");

  /**
   * Standard empty wishlist.
   */
  const createEmptyWishlist =
    useCallback(
      () => ({
        items: [],
        totalItems: 0,
        isEmpty: true,
      }),
      []
    );

  /**
   * Normalize every wishlist response
   * before storing it in React state.
   *
   * Backend Wishlist model returns:
   *
   * {
   *   _id,
   *   user,
   *   items,
   *   totalItems,
   *   createdAt,
   *   updatedAt
   * }
   *
   * totalItems is a Mongoose virtual.
   */
  const normalizeWishlist =
    useCallback(
      (value) => {
        if (
          !value ||
          typeof value !==
            "object"
        ) {
          return createEmptyWishlist();
        }

        const items =
          Array.isArray(
            value.items
          )
            ? value.items
            : [];

        const backendTotal =
          Number(
            value.totalItems
          );

        const totalItems =
          Number.isFinite(
            backendTotal
          )
            ? backendTotal
            : items.length;

        return {
          ...value,

          items,

          totalItems,

          isEmpty:
            items.length ===
            0,
        };
      },
      [
        createEmptyWishlist,
      ]
    );

  const applyWishlist =
    useCallback(
      (value) => {
        const normalized =
          normalizeWishlist(
            value
          );

        setWishlist(
          normalized
        );

        return normalized;
      },
      [
        normalizeWishlist,
      ]
    );

  const clearWishlistError =
    useCallback(() => {
      setWishlistError("");
    }, []);

  /**
   * Standard login-required result.
   */
  const requireLogin =
    useCallback(
      (
        message =
          "Please log in to use your wishlist."
      ) => {
        setWishlistError(
          message
        );

        return {
          success: false,
          requiresLogin: true,
          message,
        };
      },
      []
    );

  /**
   * GET /api/wishlist
   *
   * Backend automatically removes:
   * - deleted products
   * - inactive products
   *
   * before returning the wishlist.
   */
  const refreshWishlist =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (
          !isAuthenticated
        ) {
          const emptyWishlist =
            createEmptyWishlist();

          setWishlist(
            emptyWishlist
          );

          setWishlistError("");

          return emptyWishlist;
        }

        try {
          if (!silent) {
            setLoading(true);
          }

          setWishlistError("");

          const response =
            await api.get(
              "/wishlist"
            );

          return applyWishlist(
            response.data
              ?.wishlist
          );
        } catch (error) {
          const status =
            error.response?.status;

          /**
           * Never leave another user's
           * wishlist visible after auth
           * becomes invalid.
           */
          if (
            status === 401 ||
            status === 403
          ) {
            setWishlist(
              createEmptyWishlist()
            );
          }

          const message =
            getApiErrorMessage(
              error,
              "Unable to load your wishlist."
            );

          setWishlistError(
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
        createEmptyWishlist,
        applyWishlist,
      ]
    );

  /**
   * POST /api/wishlist
   *
   * Body:
   * {
   *   productId
   * }
   */
  const addToWishlist =
    useCallback(
      async (
        productId
      ) => {
        if (
          !isAuthenticated
        ) {
          return requireLogin(
            "Please log in to add products to your wishlist."
          );
        }

        if (!productId) {
          const message =
            "Product ID is required.";

          setWishlistError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setWishlistError("");

          const response =
            await api.post(
              "/wishlist",
              {
                productId,
              }
            );

          const updatedWishlist =
            applyWishlist(
              response.data
                ?.wishlist
            );

          return {
            success: true,

            wishlist:
              updatedWishlist,

            inWishlist: true,

            message:
              response.data
                ?.message ||
              "Product added to wishlist.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to add product to wishlist."
            );

          setWishlistError(
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
        applyWishlist,
      ]
    );

  /**
   * DELETE
   * /api/wishlist/:productId
   */
  const removeFromWishlist =
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

          setWishlistError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setWishlistError("");

          const response =
            await api.delete(
              `/wishlist/${productId}`
            );

          const updatedWishlist =
            applyWishlist(
              response.data
                ?.wishlist
            );

          return {
            success: true,

            wishlist:
              updatedWishlist,

            inWishlist: false,

            message:
              response.data
                ?.message ||
              "Product removed from wishlist.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to remove product from wishlist."
            );

          setWishlistError(
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
        applyWishlist,
      ]
    );

  /**
   * PATCH
   * /api/wishlist/:productId/toggle
   *
   * Backend response:
   *
   * {
   *   success,
   *   inWishlist,
   *   message,
   *   wishlist
   * }
   */
  const toggleWishlist =
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

          setWishlistError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setWishlistError("");

          const response =
            await api.patch(
              `/wishlist/${productId}/toggle`
            );

          const updatedWishlist =
            applyWishlist(
              response.data
                ?.wishlist
            );

          return {
            success: true,

            inWishlist:
              Boolean(
                response.data
                  ?.inWishlist
              ),

            wishlist:
              updatedWishlist,

            message:
              response.data
                ?.message ||
              "Wishlist updated.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to update wishlist."
            );

          setWishlistError(
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
        applyWishlist,
      ]
    );

  /**
   * GET
   * /api/wishlist/check/:productId
   *
   * Direct server-side wishlist check.
   *
   * Most components can use
   * isInWishlist() instead.
   */
  const checkWishlistItem =
    useCallback(
      async (
        productId
      ) => {
        if (
          !isAuthenticated ||
          !productId
        ) {
          return false;
        }

        try {
          const response =
            await api.get(
              `/wishlist/check/${productId}`
            );

          return Boolean(
            response.data
              ?.inWishlist
          );
        } catch (error) {
          /**
           * Heart-state checks should not
           * produce global error noise.
           */
          return false;
        }
      },
      [
        isAuthenticated,
      ]
    );

  /**
   * DELETE /api/wishlist
   */
  const clearWishlist =
    useCallback(
      async () => {
        if (
          !isAuthenticated
        ) {
          const emptyWishlist =
            createEmptyWishlist();

          setWishlist(
            emptyWishlist
          );

          setWishlistError("");

          return {
            success: true,

            wishlist:
              emptyWishlist,

            message:
              "Wishlist cleared.",
          };
        }

        try {
          setWishlistError("");

          const response =
            await api.delete(
              "/wishlist"
            );

          const updatedWishlist =
            applyWishlist(
              response.data
                ?.wishlist
            );

          return {
            success: true,

            wishlist:
              updatedWishlist,

            message:
              response.data
                ?.message ||
              "Wishlist cleared successfully.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to clear wishlist."
            );

          setWishlistError(
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
        createEmptyWishlist,
        applyWishlist,
      ]
    );

  /**
   * POST
   * /api/wishlist/:productId/move-to-cart
   *
   * Body:
   * {
   *   quantity
   * }
   *
   * Backend:
   * - verifies product is active
   * - checks stock
   * - adds/increments cart item
   * - refreshes current unit price
   * - removes item from wishlist
   * - returns both cart + wishlist
   */
  const moveToCart =
    useCallback(
      async (
        productId,
        quantity = 1
      ) => {
        if (
          !isAuthenticated
        ) {
          return requireLogin(
            "Please log in to move products to your cart."
          );
        }

        if (!productId) {
          const message =
            "Product ID is required.";

          setWishlistError(
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

          setWishlistError(
            message
          );

          return {
            success: false,
            message,
          };
        }

        try {
          setWishlistError("");

          const response =
            await api.post(
              `/wishlist/${productId}/move-to-cart`,
              {
                quantity:
                  requestedQuantity,
              }
            );

          const updatedWishlist =
            applyWishlist(
              response.data
                ?.wishlist
            );

          /**
           * Backend already returns the
           * updated cart.
           *
           * CartContext owns cart state,
           * so we refresh it there instead
           * of duplicating cart state inside
           * WishlistContext.
           *
           * This keeps:
           * - Navbar cart count
           * - Cart page
           * - Checkout state
           *
           * synchronized immediately.
           */
          await refreshCart({
            silent: true,
          });

          return {
            success: true,

            wishlist:
              updatedWishlist,

            cart:
              response.data
                ?.cart ||
              null,

            message:
              response.data
                ?.message ||
              "Product moved to cart successfully.",
          };
        } catch (error) {
          const message =
            getApiErrorMessage(
              error,
              "Unable to move product to cart."
            );

          setWishlistError(
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
        applyWishlist,
        refreshCart,
      ]
    );

  /**
   * Safely extract product ID from a
   * wishlist item.
   *
   * Backend may contain:
   *
   * product: ObjectId/string
   *
   * or after populate:
   *
   * product: {
   *   _id,
   *   name,
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

  /**
   * Local heart-state check.
   *
   * This avoids an extra HTTP request for
   * every ProductCard.
   */
  const isInWishlist =
    useCallback(
      (productId) => {
        if (!productId) {
          return false;
        }

        const targetId =
          String(
            productId
          );

        const items =
          Array.isArray(
            wishlist?.items
          )
            ? wishlist.items
            : [];

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
        wishlist,
        getProductId,
      ]
    );

  /**
   * Return the complete matching
   * wishlist item.
   */
  const getWishlistItem =
    useCallback(
      (productId) => {
        if (!productId) {
          return null;
        }

        const targetId =
          String(
            productId
          );

        const items =
          Array.isArray(
            wishlist?.items
          )
            ? wishlist.items
            : [];

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
        wishlist,
        getProductId,
      ]
    );

  /**
   * Refresh wishlist after authentication
   * has finished.
   *
   * Login:
   *   restore MongoDB wishlist.
   *
   * Logout:
   *   immediately clear previous
   *   customer's wishlist.
   */
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (
      isAuthenticated
    ) {
      refreshWishlist();
    } else {
      setWishlist(
        createEmptyWishlist()
      );

      setWishlistError("");

      setLoading(false);
    }
  }, [
    authLoading,
    isAuthenticated,
    refreshWishlist,
    createEmptyWishlist,
  ]);

  const items =
    useMemo(
      () =>
        Array.isArray(
          wishlist?.items
        )
          ? wishlist.items
          : [],
      [wishlist]
    );

  const totalItems =
    useMemo(
      () => {
        const backendTotal =
          Number(
            wishlist?.totalItems
          );

        return Number.isFinite(
          backendTotal
        )
          ? backendTotal
          : items.length;
      },
      [
        wishlist,
        items,
      ]
    );

  const isEmpty =
    items.length === 0;

  const value =
    useMemo(
      () => ({
        wishlist,
        items,

        loading,
        wishlistError,

        totalItems,
        isEmpty,

        refreshWishlist,

        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        checkWishlistItem,
        clearWishlist,
        moveToCart,

        isInWishlist,
        getWishlistItem,

        clearWishlistError,
      }),
      [
        wishlist,
        items,

        loading,
        wishlistError,

        totalItems,
        isEmpty,

        refreshWishlist,

        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        checkWishlistItem,
        clearWishlist,
        moveToCart,

        isInWishlist,
        getWishlistItem,

        clearWishlistError,
      ]
    );

  return (
    <WishlistContext.Provider
      value={value}
    >
      {children}
    </WishlistContext.Provider>
  );
};

const useWishlist = () => {
  const context =
    useContext(
      WishlistContext
    );

  if (!context) {
    throw new Error(
      "useWishlist must be used inside WishlistProvider."
    );
  }

  return context;
};

export {
  WishlistContext,
  WishlistProvider,
  useWishlist,
};