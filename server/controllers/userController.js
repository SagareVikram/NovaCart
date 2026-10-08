import User from "../models/User.js";

/**
 * Normalize email consistently.
 */
const normalizeEmail = (email = "") => {
  return String(email).trim().toLowerCase();
};

/**
 * GET /api/users/profile
 *
 * Get logged-in user's profile.
 *
 * Protected route.
 */
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your profile.",
    });
  }
};

/**
 * PUT /api/users/profile
 *
 * Update basic profile information.
 *
 * Allowed:
 * - name
 * - email
 * - phone
 *
 * Protected route.
 */
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (name !== undefined) {
      const cleanName = String(name).trim();

      if (cleanName.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Name must contain at least 2 characters.",
        });
      }

      user.name = cleanName;
    }

    if (email !== undefined) {
      const cleanEmail = normalizeEmail(email);

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "Email is required.",
        });
      }

      const existingUser = await User.findOne({
        email: cleanEmail,
        _id: {
          $ne: user._id,
        },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Another account already uses this email.",
        });
      }

      user.email = cleanEmail;
    }

    if (phone !== undefined) {
      user.phone = String(phone).trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    if (
      error?.code === 11000 &&
      error?.keyPattern?.email
    ) {
      return res.status(409).json({
        success: false,
        message: "Another account already uses this email.",
      });
    }

    if (error?.name === "ValidationError") {
      const firstError = Object.values(
        error.errors
      )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          "Invalid profile data.",
      });
    }

    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update your profile.",
    });
  }
};

/**
 * PUT /api/users/change-password
 *
 * Change logged-in user's password.
 *
 * Protected route.
 */
const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Current password, new password and confirmation are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must contain at least 6 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirmation do not match.",
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your current password.",
      });
    }

    const user = await User.findById(
      req.user._id
    ).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const passwordMatches =
      await user.comparePassword(currentPassword);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = newPassword;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to change password right now.",
    });
  }
};

/**
 * GET /api/users/addresses
 *
 * Return all saved delivery addresses.
 */
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(
      req.user._id
    ).select("addresses");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    return res.status(200).json({
      success: true,
      addresses: user.addresses,
    });
  } catch (error) {
    console.error(
      "Get addresses error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load saved addresses.",
    });
  }
};

/**
 * POST /api/users/addresses
 *
 * Add a new delivery address.
 */
const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      addressLine1,
      addressLine2 = "",
      city,
      state,
      postalCode,
      country = "India",
      label = "Home",
      isDefault = false,
    } = req.body;

    if (
      !fullName ||
      !phone ||
      !addressLine1 ||
      !city ||
      !state ||
      !postalCode
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Full name, phone, address, city, state and postal code are required.",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    if (isDefault === true) {
      user.addresses.forEach((address) => {
        address.isDefault = false;
      });
    }

    const shouldBecomeDefault =
      user.addresses.length === 0 ||
      isDefault === true;

    user.addresses.push({
      fullName: String(fullName).trim(),
      phone: String(phone).trim(),
      addressLine1: String(addressLine1).trim(),
      addressLine2: String(addressLine2).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      postalCode: String(postalCode).trim(),
      country: String(country).trim() || "India",
      label,
      isDefault: shouldBecomeDefault,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      const firstError = Object.values(
        error.errors
      )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          "Invalid address information.",
      });
    }

    console.error("Add address error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add address.",
    });
  }
};

/**
 * PUT /api/users/addresses/:addressId
 *
 * Edit a saved address.
 */
const updateAddress = async (req, res) => {
  try {
    const {
      addressId,
    } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const address =
      user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      label,
      isDefault,
    } = req.body;

    if (fullName !== undefined) {
      address.fullName =
        String(fullName).trim();
    }

    if (phone !== undefined) {
      address.phone =
        String(phone).trim();
    }

    if (addressLine1 !== undefined) {
      address.addressLine1 =
        String(addressLine1).trim();
    }

    if (addressLine2 !== undefined) {
      address.addressLine2 =
        String(addressLine2).trim();
    }

    if (city !== undefined) {
      address.city =
        String(city).trim();
    }

    if (state !== undefined) {
      address.state =
        String(state).trim();
    }

    if (postalCode !== undefined) {
      address.postalCode =
        String(postalCode).trim();
    }

    if (country !== undefined) {
      address.country =
        String(country).trim();
    }

    if (label !== undefined) {
      address.label = label;
    }

    if (isDefault === true) {
      user.addresses.forEach(
        (savedAddress) => {
          savedAddress.isDefault =
            savedAddress._id.toString() ===
            address._id.toString();
        }
      );
    } else if (isDefault === false) {
      address.isDefault = false;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    if (error?.name === "ValidationError") {
      const firstError = Object.values(
        error.errors
      )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          "Invalid address information.",
      });
    }

    console.error(
      "Update address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update address.",
    });
  }
};

/**
 * DELETE /api/users/addresses/:addressId
 *
 * Delete saved delivery address.
 */
const deleteAddress = async (req, res) => {
  try {
    const {
      addressId,
    } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const address =
      user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    const wasDefault = address.isDefault;

    user.addresses.pull(addressId);

    if (
      wasDefault &&
      user.addresses.length > 0
    ) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error(
      "Delete address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete address.",
    });
  }
};

/**
 * PATCH /api/users/addresses/:addressId/default
 *
 * Mark one saved address as default.
 */
const setDefaultAddress = async (
  req,
  res
) => {
  try {
    const {
      addressId,
    } = req.params;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const address =
      user.addresses.id(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found.",
      });
    }

    user.addresses.forEach(
      (savedAddress) => {
        savedAddress.isDefault =
          savedAddress._id.toString() ===
          addressId;
      }
    );

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "Default address updated successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error(
      "Set default address error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update default address.",
    });
  }
};

export {
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};