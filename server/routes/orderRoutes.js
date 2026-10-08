import express from "express";

import {
  placeOrder,
  getMyOrders,
  getMyOrderDetails,
  cancelOrder,
  getOrderTracking,
} from "../controllers/orderController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * All order routes require authentication.
 */
router.use(protect);

/**
 * Place a new order from current user's cart.
 *
 * POST /api/orders
 */
router.post(
  "/",
  placeOrder
);

/**
 * Get current user's order history.
 *
 * GET /api/orders
 *
 * Supports:
 * ?page=1
 * ?limit=10
 * ?status=delivered
 */
router.get(
  "/",
  getMyOrders
);

/**
 * Order tracking.
 *
 * Important:
 * Keep this route before /:identifier
 */
router.get(
  "/:identifier/tracking",
  getOrderTracking
);

/**
 * Cancel eligible order.
 *
 * PATCH /api/orders/:identifier/cancel
 *
 * Body:
 * {
 *   "reason": "Changed my mind"
 * }
 */
router.patch(
  "/:identifier/cancel",
  cancelOrder
);

/**
 * Get one order's complete details.
 *
 * Identifier can be:
 * - MongoDB ObjectId
 * - NovaCart order number
 */
router.get(
  "/:identifier",
  getMyOrderDetails
);

export default router;