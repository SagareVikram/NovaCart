import express from "express";

import {
  getProducts,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getCategories,
  getBrands,
  getProductsByCategory,
  getProductByIdentifier,
  getRelatedProducts,
} from "../controllers/productController.js";

const router = express.Router();

/**
 * Public Product Routes
 *
 * These routes do not require login.
 */

/**
 * Main product listing
 *
 * Supports:
 * ?page=1
 * ?limit=12
 * ?search=phone
 * ?category=Electronics
 * ?subCategory=Smartphones
 * ?brand=Samsung
 * ?minPrice=10000
 * ?maxPrice=50000
 * ?featured=true
 * ?inStock=true
 * ?sort=newest
 */
router.get(
  "/",
  getProducts
);

/**
 * Home page product sections
 */
router.get(
  "/featured",
  getFeaturedProducts
);

router.get(
  "/new-arrivals",
  getNewArrivals
);

router.get(
  "/best-sellers",
  getBestSellers
);

/**
 * Filter metadata
 */
router.get(
  "/categories",
  getCategories
);

router.get(
  "/brands",
  getBrands
);

/**
 * Category page
 */
router.get(
  "/category/:category",
  getProductsByCategory
);

/**
 * Related products
 *
 * Must remain before /:identifier
 * so "related" is not treated incorrectly.
 */
router.get(
  "/:identifier/related",
  getRelatedProducts
);

/**
 * Product details
 *
 * Supports:
 * MongoDB ObjectId
 * OR
 * product slug
 *
 * Examples:
 * /api/products/68abc...
 * /api/products/apple-iphone-16
 */
router.get(
  "/:identifier",
  getProductByIdentifier
);

export default router;