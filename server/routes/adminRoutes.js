import express from "express";

import {
  getDashboardStats,

  getAdminProducts,
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
} from "../controllers/adminController.js";

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
 * All admin routes require:
 *
 * 1. Logged-in user
 * 2. Admin role
 */
router.use(protect);
router.use(adminOnly);

/**
 * ==========================================
 * ADMIN DASHBOARD
 * ==========================================
 */

router.get(
  "/dashboard",
  getDashboardStats
);

/**
 * ==========================================
 * PRODUCT MANAGEMENT
 * ==========================================
 */

/**
 * Get all products for admin.
 *
 * Supports:
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
 * Create product.
 *
 * multipart/form-data
 *
 * Product images field:
 * images
 *
 * Maximum:
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
 *
 * Keep this route after
 * the main /products routes.
 */
router.get(
  "/products/:productId",
  getAdminProductById
);

/**
 * Update product.
 *
 * New images may optionally be uploaded.
 *
 * multipart/form-data
 *
 * Field:
 * images
 *
 * Optional body:
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
 * Activate or deactivate product.
 *
 * Body:
 * {
 *   "isActive": true
 * }
 */
router.patch(
  "/products/:productId/status",
  updateProductStatus
);

/**
 * Update product stock.
 *
 * Body:
 * {
 *   "stock": 25,
 *   "lowStockThreshold": 5
 * }
 */
router.patch(
  "/products/:productId/stock",
  updateProductStock
);

/**
 * Delete one Cloudinary product image.
 *
 * publicId must be URL encoded.
 *
 * Example:
 *
 * /api/admin/products/123/images/novacart%2Fproducts%2Fabc
 */
router.delete(
  "/products/:productId/images/:publicId",
  deleteProductImage
);

/**
 * Permanently delete product.
 *
 * Existing orders remain unchanged
 * because order items contain product snapshots.
 */
router.delete(
  "/products/:productId",
  deleteProduct
);

/**
 * ==========================================
 * USER MANAGEMENT
 * ==========================================
 */

/**
 * Get all customer accounts.
 *
 * Supports:
 * ?page=1
 * ?limit=20
 * ?search=pratham
 * ?status=active
 */
router.get(
  "/users",
  getAdminUsers
);

/**
 * Get one customer's details,
 * recent orders and spending summary.
 */
router.get(
  "/users/:userId",
  getAdminUserDetails
);

/**
 * Activate or disable customer.
 *
 * Body:
 * {
 *   "isActive": false
 * }
 */
router.patch(
  "/users/:userId/status",
  updateUserStatus
);

/**
 * ==========================================
 * ORDER MANAGEMENT
 * ==========================================
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
 * Get complete order information.
 */
router.get(
  "/orders/:orderId",
  getAdminOrderDetails
);

/**
 * Update order status.
 *
 * Body:
 * {
 *   "status": "shipped",
 *   "message": "Order shipped successfully."
 * }
 *
 * Cancellation is intentionally NOT handled here.
 * The dedicated cancellation route safely restores stock.
 */
router.patch(
  "/orders/:orderId/status",
  updateOrderStatus
);

/**
 * Update payment status.
 *
 * Body:
 * {
 *   "status": "paid",
 *   "transactionId": "TXN123"
 * }
 */
router.patch(
  "/orders/:orderId/payment",
  updatePaymentStatus
);

/**
 * Cancel order as admin.
 *
 * Restores inventory automatically.
 *
 * Body:
 * {
 *   "reason": "Product unavailable"
 * }
 */
router.post(
  "/orders/:orderId/cancel",
  adminCancelOrder
);

/**
 * ==========================================
 * REPORTS / ANALYTICS
 * ==========================================
 */

/**
 * Sales overview.
 *
 * Supports:
 * ?days=30
 *
 * Returns:
 * - revenue
 * - order count
 * - average order value
 * - daily sales
 * - order status counts
 * - top products
 * - low stock products
 */
router.get(
  "/reports/overview",
  getSalesOverview
);

/**
 * Top customer report.
 */
router.get(
  "/reports/customers",
  getCustomerReport
);

export default router;