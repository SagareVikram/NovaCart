import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Generate JWT token.
 *
 * The token payload is intentionally small.
 * User details are always loaded fresh from MongoDB
 * by authMiddleware.
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    }
  );
};

/**
 * Send authentication cookie.
 *
 * The API also returns the token in JSON so our React app
 * can work with Authorization headers if needed.
 */
const setAuthCookie = (res, token) => {
  const isProduction =
    process.env.NODE_ENV === "production";

  res.cookie("novacart_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

/**
 * Remove authentication cookie.
 */
const clearAuthCookie = (res) => {
  const isProduction =
    process.env.NODE_ENV === "production";

  res.clearCookie("novacart_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
};

/**
 * Normalize email before database operations.
 */
const normalizeEmail = (email = "") => {
  return String(email)
    .trim()
    .toLowerCase();
};

/**
 * POST /api/auth/register
 *
 * Register normal NovaCart customer.
 */
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone = "",
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email and password are required.",
      });
    }

    const cleanName = String(name).trim();
    const cleanEmail = normalizeEmail(email);
    const cleanPhone = String(phone).trim();

    if (cleanName.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain at least 2 characters.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must contain at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password,
      phone: cleanPhone,
      role: "user",
      isActive: true,
    });

    const token = generateToken(
      user._id.toString()
    );

    setAuthCookie(res, token);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: user.toJSON(),
    });
  } catch (error) {
    if (
      error?.code === 11000 &&
      error?.keyPattern?.email
    ) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this email already exists.",
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
          "Invalid registration data.",
      });
    }

    console.error(
      "Register controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create your account right now.",
    });
  }
};

/**
 * POST /api/auth/login
 *
 * Login user or administrator.
 */
const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const cleanEmail = normalizeEmail(email);

    const user = await User.findOne({
      email: cleanEmail,
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    const isPasswordValid =
      await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been disabled.",
      });
    }

    user.lastLoginAt = new Date();

    await user.save();

    const token = generateToken(
      user._id.toString()
    );

    setAuthCookie(res, token);

    const safeUser = await User.findById(
      user._id
    );

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: safeUser,
    });
  } catch (error) {
    console.error(
      "Login controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to log in right now.",
    });
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    clearAuthCookie(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
    });
  } catch (error) {
    console.error(
      "Logout controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to log out right now.",
    });
  }
};

/**
 * GET /api/auth/me
 *
 * Returns currently authenticated user.
 *
 * This route must use protect middleware.
 */
const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error(
      "Current user controller error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load user account.",
    });
  }
};

/**
 * Create the initial NovaCart administrator.
 *
 * This function is not exposed as a public API.
 * It will be called from server startup after MongoDB connects.
 *
 * Required environment variables:
 *
 * ADMIN_NAME
 * ADMIN_EMAIL
 * ADMIN_PASSWORD
 */
const ensureAdminUser = async () => {
  try {
    const adminEmail =
      normalizeEmail(process.env.ADMIN_EMAIL);

    const adminPassword =
      process.env.ADMIN_PASSWORD;

    const adminName =
      String(
        process.env.ADMIN_NAME ||
          "NovaCart Admin"
      ).trim();

    if (
      !adminEmail ||
      !adminPassword
    ) {
      console.warn(
        "Initial admin creation skipped because ADMIN_EMAIL or ADMIN_PASSWORD is not configured."
      );

      return null;
    }

    const existingUser = await User.findOne({
      email: adminEmail,
    }).select("+password");

    if (existingUser) {
      let hasChanges = false;

      if (
        existingUser.role !== "admin"
      ) {
        existingUser.role = "admin";
        hasChanges = true;
      }

      if (
        existingUser.isActive !== true
      ) {
        existingUser.isActive = true;
        hasChanges = true;
      }

      if (
        !existingUser.name &&
        adminName
      ) {
        existingUser.name = adminName;
        hasChanges = true;
      }

      if (hasChanges) {
        await existingUser.save();
      }

      console.log(
        `NovaCart admin account ready: ${adminEmail}`
      );

      return existingUser;
    }

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: "admin",
      isActive: true,
    });

    console.log(
      `NovaCart admin account created: ${adminEmail}`
    );

    return admin;
  } catch (error) {
    console.error(
      "Initial admin setup error:",
      error.message
    );

    return null;
  }
};

export {
  register,
  login,
  logout,
  getCurrentUser,
  ensureAdminUser,
};