import express from "express";

import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlistItem,
  checkWishlistItem,
  clearWishlist,
  moveToCart,
} from "../controllers/wishlistController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * All wishlist routes require authentication.
 */
router.use(protect);

/**
 * Get current user's wishlist
 */
router.get(
  "/",
  getWishlist
);

/**
 * Check whether a product is already in wishlist
 *
 * Important:
 * Keep this route before /:productId
 */
router.get(
  "/check/:productId",
  checkWishlistItem
);

/**
 * Add product to wishlist
 *
 * Body:
 * {
 *   "productId": "..."
 * }
 */
router.post(
  "/",
  addToWishlist
);

/**
 * Clear complete wishlist
 */
router.delete(
  "/",
  clearWishlist
);

/**
 * Toggle wishlist state
 *
 * If product exists:
 * remove it
 *
 * If product does not exist:
 * add it
 */
router.patch(
  "/:productId/toggle",
  toggleWishlistItem
);

/**
 * Move wishlist product directly to cart
 *
 * Optional body:
 * {
 *   "quantity": 1
 * }
 */
router.post(
  "/:productId/move-to-cart",
  moveToCart
);

/**
 * Remove one product from wishlist
 */
router.delete(
  "/:productId",
  removeFromWishlist
);

export default router;