import express from "express";

import {
  getDashboardStats,

  getAdminProducts,
  getProductCategories,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProductImage,
  updateProductStatus,
  updateProductStock,
  deleteProduct,

  getAdminUsers,
  getAdminUserDetails,
  updateUserStatus,

  getAdminOrders,
  getAdminOrderDetails,
  updateOrderStatus,
  updatePaymentStatus,
  adminCancelOrder,

  getSalesOverview,
  getCustomerReport,
  getAgentSalesReport,
} from "../controllers/adminController.js";

import {
  getDeliveryAgents,
  getAvailableDeliveryAgents,
  createDeliveryAgent,
  getDeliveryAgentDetails,
  updateDeliveryAgent,
  updateDeliveryAgentStatus,
  updateDeliveryAgentAvailability,
  assignOrderToDeliveryAgent,
  removeOrderDeliveryAgent,
} from "../controllers/deliveryAdminController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  adminOnly,
} from "../middleware/adminMiddleware.js";

import {
  upload,
} from "../middleware/uploadMiddleware.js";


const router = express.Router();


/**
 * ============================================================
 * ALL ADMIN ROUTES REQUIRE:
 * ============================================================
 *
 * 1. Logged-in user
 * 2. Admin role
 */
router.use(
  protect
);

router.use(
  adminOnly
);


/**
 * ============================================================
 * ADMIN DASHBOARD
 * ============================================================
 */
router.get(
  "/dashboard",
  getDashboardStats
);


/**
 * ============================================================
 * PRODUCT MANAGEMENT
 * ============================================================
 */

/**
 * Get all products.
 *
 * Supports:
 *
 * ?page=1
 * ?limit=20
 * ?search=iphone
 * ?category=Electronics
 * ?status=active
 * ?featured=true
 * ?stock=low
 * ?stock=out
 */
router.get(
  "/products",
  getAdminProducts
);



/**
 * Get existing product categories and
 * subcategories for admin product form.
 *
 * GET
 * /api/admin/products/meta/categories
 */
router.get(
  "/products/meta/categories",
  getProductCategories
);


/**
 * Create product.
 *
 * multipart/form-data
 *
 * Image field:
 *
 * images
 *
 * Maximum:
 *
 * 6 images
 */
router.post(
  "/products",

  upload.array(
    "images",
    6
  ),

  createProduct
);


/**
 * Get one product.
 */
router.get(
  "/products/:productId",
  getAdminProductById
);


/**
 * Update product.
 *
 * multipart/form-data
 *
 * Optional new image field:
 *
 * images
 *
 * Optional:
 *
 * replaceImages=true
 */
router.put(
  "/products/:productId",

  upload.array(
    "images",
    6
  ),

  updateProduct
);


/**
 * Activate / deactivate product.
 */
router.patch(
  "/products/:productId/status",
  updateProductStatus
);


/**
 * Update product inventory.
 */
router.patch(
  "/products/:productId/stock",
  updateProductStock
);


/**
 * Delete one product image.
 */
router.delete(
  "/products/:productId/images/:publicId",
  deleteProductImage
);


/**
 * Permanently delete product.
 */
router.delete(
  "/products/:productId",
  deleteProduct
);


/**
 * ============================================================
 * CUSTOMER MANAGEMENT
 * ============================================================
 */

/**
 * Get customers.
 *
 * Supports:
 *
 * ?page=1
 * ?limit=20
 * ?search=tejas
 * ?status=active
 */
router.get(
  "/users",
  getAdminUsers
);


/**
 * Get customer details.
 */
router.get(
  "/users/:userId",
  getAdminUserDetails
);


/**
 * Activate / deactivate customer.
 */
router.patch(
  "/users/:userId/status",
  updateUserStatus
);


/**
 * ============================================================
 * DELIVERY AGENT MANAGEMENT
 * ============================================================
 */

/**
 * Get all delivery agents.
 *
 * GET /api/admin/delivery-agents
 *
 * Supports:
 *
 * ?page=1
 * ?limit=20
 * ?search=rahul
 * ?status=active
 * ?availability=available
 */
router.get(
  "/delivery-agents",
  getDeliveryAgents
);


/**
 * Get only active and available
 * delivery agents.
 *
 * Used by order assignment dropdown.
 *
 * IMPORTANT:
 * Keep this before /:agentId.
 */
router.get(
  "/delivery-agents/available",
  getAvailableDeliveryAgents
);


/**
 * Create delivery agent.
 *
 * POST /api/admin/delivery-agents
 *
 * Body:
 *
 * {
 *   "name": "Rahul Patil",
 *   "email": "rahul@novacart.com",
 *   "password": "Rahul@123",
 *   "phone": "9876543210",
 *   "employeeId": "DA-001",
 *   "vehicleNumber": "MH11AB1234",
 *   "deliveryArea": "Karad"
 * }
 */
router.post(
  "/delivery-agents",
  createDeliveryAgent
);


/**
 * Get one delivery agent.
 */
router.get(
  "/delivery-agents/:agentId",
  getDeliveryAgentDetails
);


/**
 * Update delivery agent.
 */
router.put(
  "/delivery-agents/:agentId",
  updateDeliveryAgent
);


/**
 * Activate / deactivate delivery agent.
 *
 * Body:
 *
 * {
 *   "isActive": true
 * }
 */
router.patch(
  "/delivery-agents/:agentId/status",
  updateDeliveryAgentStatus
);


/**
 * Admin can update availability.
 *
 * Body:
 *
 * {
 *   "isAvailable": true
 * }
 */
router.patch(
  "/delivery-agents/:agentId/availability",
  updateDeliveryAgentAvailability
);


/**
 * ============================================================
 * ORDER MANAGEMENT
 * ============================================================
 */

/**
 * Get all orders.
 *
 * Supports:
 *
 * ?page=1
 * ?limit=20
 * ?status=processing
 * ?paymentStatus=paid
 * ?search=NOVA-...
 */
router.get(
  "/orders",
  getAdminOrders
);


/**
 * Get one complete order.
 */
router.get(
  "/orders/:orderId",
  getAdminOrderDetails
);


/**
 * Update normal admin order status.
 *
 * Example:
 *
 * placed
 *   ↓
 * confirmed
 *   ↓
 * processing
 *
 * Once a delivery agent is assigned,
 * the delivery-agent module can handle:
 *
 * shipped
 * out_for_delivery
 * delivered
 */
router.patch(
  "/orders/:orderId/status",
  updateOrderStatus
);


/**
 * Update payment status.
 */
router.patch(
  "/orders/:orderId/payment",
  updatePaymentStatus
);


/**
 * Admin cancellation.
 *
 * Inventory restoration remains handled
 * by your existing controller.
 */
router.post(
  "/orders/:orderId/cancel",
  adminCancelOrder
);


/**
 * ============================================================
 * ORDER DELIVERY AGENT ASSIGNMENT
 * ============================================================
 */

/**
 * Assign or reassign delivery agent.
 *
 * PATCH
 * /api/admin/orders/:orderId/delivery-agent
 *
 * Body:
 *
 * {
 *   "agentId": "..."
 * }
 */
router.patch(
  "/orders/:orderId/delivery-agent",
  assignOrderToDeliveryAgent
);


/**
 * Remove delivery agent assignment.
 *
 * DELETE
 * /api/admin/orders/:orderId/delivery-agent
 */
router.delete(
  "/orders/:orderId/delivery-agent",
  removeOrderDeliveryAgent
);


/**
 * ============================================================
 * REPORTS / ANALYTICS
 * ============================================================
 */

/**
 * Sales overview.
 *
 * GET
 * /api/admin/reports/overview?days=30
 */
router.get(
  "/reports/overview",
  getSalesOverview
);


/**
 * Customer report.
 */
router.get(
  "/reports/customers",
  getCustomerReport
);

/**
 * Delivery agent sales report.
 *
 * GET
 * /api/admin/reports/agent-sales?days=30
 */
router.get(
  "/reports/agent-sales",
  getAgentSalesReport
);


export default router;