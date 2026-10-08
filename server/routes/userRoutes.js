import express from "express";

import {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/userController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * All user routes are protected.
 */
router.use(protect);

/**
 * Profile
 */
router.get(
  "/profile",
  getProfile
);

router.put(
  "/profile",
  updateProfile
);

/**
 * Password
 */
router.put(
  "/change-password",
  changePassword
);

/**
 * Saved Addresses
 */
router.get(
  "/addresses",
  getAddresses
);

router.post(
  "/addresses",
  addAddress
);

router.put(
  "/addresses/:addressId",
  updateAddress
);

router.delete(
  "/addresses/:addressId",
  deleteAddress
);

router.patch(
  "/addresses/:addressId/default",
  setDefaultAddress
);

export default router;