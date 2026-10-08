import express from "express";

import {
  register,
  login,
  logout,
  getCurrentUser,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * Public Authentication Routes
 */

// Register new customer
router.post(
  "/register",
  register
);

// Login customer/admin
router.post(
  "/login",
  login
);

// Logout current user
router.post(
  "/logout",
  logout
);

/**
 * Protected Authentication Routes
 */

// Get currently authenticated user
router.get(
  "/me",
  protect,
  getCurrentUser
);

export default router;