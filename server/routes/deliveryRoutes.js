import express from "express";

import {
  protect,
} from "../middleware/authMiddleware.js";

import deliveryAgentMiddleware from "../middleware/deliveryAgentMiddleware.js";

import {
  getDeliveryDashboard,
  getAssignedOrders,
  getAssignedOrderById,
  acceptAssignedOrder,
  updateDeliveryStatus,
  updateDeliveryNote,
  getDeliveryProfile,
  updateAvailability,
} from "../controllers/deliveryController.js";


const router = express.Router();


/**
 * ============================================================
 * DELIVERY AGENT PROTECTED ROUTES
 * ============================================================
 *
 * Every route requires:
 *
 * 1. Valid login
 * 2. Active account
 * 3. role === "delivery_agent"
 */
router.use(
  protect
);

router.use(
  deliveryAgentMiddleware
);


/**
 * ============================================================
 * DASHBOARD
 * ============================================================
 *
 * GET /api/delivery/dashboard
 */
router.get(
  "/dashboard",
  getDeliveryDashboard
);


/**
 * ============================================================
 * PROFILE
 * ============================================================
 *
 * GET /api/delivery/profile
 */
router.get(
  "/profile",
  getDeliveryProfile
);


/**
 * ============================================================
 * AVAILABILITY
 * ============================================================
 *
 * PATCH /api/delivery/availability
 *
 * Body:
 *
 * {
 *   "isAvailable": true
 * }
 */
router.patch(
  "/availability",
  updateAvailability
);


/**
 * ============================================================
 * ASSIGNED ORDERS
 * ============================================================
 *
 * GET /api/delivery/orders
 *
 * Optional:
 *
 * ?status=processing
 * ?status=shipped
 * ?status=out_for_delivery
 * ?status=delivered
 */
router.get(
  "/orders",
  getAssignedOrders
);


/**
 * ============================================================
 * SINGLE ASSIGNED ORDER
 * ============================================================
 *
 * GET /api/delivery/orders/:orderId
 */
router.get(
  "/orders/:orderId",
  getAssignedOrderById
);


/**
 * ============================================================
 * ACCEPT ASSIGNMENT
 * ============================================================
 *
 * PATCH /api/delivery/orders/:orderId/accept
 */
router.patch(
  "/orders/:orderId/accept",
  acceptAssignedOrder
);


/**
 * ============================================================
 * UPDATE DELIVERY STATUS
 * ============================================================
 *
 * PATCH /api/delivery/orders/:orderId/status
 *
 * Body example:
 *
 * {
 *   "status": "shipped",
 *   "note": "Package collected from warehouse."
 * }
 */
router.patch(
  "/orders/:orderId/status",
  updateDeliveryStatus
);


/**
 * ============================================================
 * UPDATE DELIVERY NOTE
 * ============================================================
 *
 * PATCH /api/delivery/orders/:orderId/note
 *
 * Body:
 *
 * {
 *   "note": "Customer requested evening delivery."
 * }
 */
router.patch(
  "/orders/:orderId/note",
  updateDeliveryNote
);


export default router;