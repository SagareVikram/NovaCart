import express from "express";

import {
  getCart,
  addToCart,
  updateCartItem,
  incrementCartItem,
  decrementCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
} from "../controllers/cartController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * All cart routes require authentication.
 */
router.use(protect);

/**
 * Get current user's cart
 */
router.get(
  "/",
  getCart
);

/**
 * Checkout-ready cart summary
 *
 * Important:
 * Keep this route before /:productId
 */
router.get(
  "/summary",
  getCartSummary
);

/**
 * Add product to cart
 *
 * Body:
 * {
 *   "productId": "...",
 *   "quantity": 1
 * }
 */
router.post(
  "/",
  addToCart
);

/**
 * Clear complete cart
 */
router.delete(
  "/",
  clearCart
);

/**
 * Set exact product quantity
 *
 * Body:
 * {
 *   "quantity": 3
 * }
 */
router.put(
  "/:productId",
  updateCartItem
);

/**
 * Increase product quantity by 1
 */
router.patch(
  "/:productId/increment",
  incrementCartItem
);

/**
 * Decrease product quantity by 1
 *
 * If quantity reaches zero,
 * the product is removed from cart.
 */
router.patch(
  "/:productId/decrement",
  decrementCartItem
);

/**
 * Remove one product completely
 */
router.delete(
  "/:productId",
  removeFromCart
);

export default router;