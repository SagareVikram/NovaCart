import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import {
  configureCloudinary,
} from "./config/cloudinary.js";

import {
  ensureAdminUser,
} from "./controllers/authController.js";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

/**
 * Load environment variables.
 */
dotenv.config();

/**
 * Create Express application.
 */
const app = express();

/**
 * Application port.
 *
 * Render automatically provides PORT
 * during deployment.
 */
const PORT =
  process.env.PORT || 5000;

/**
 * ==========================================
 * TRUST PROXY
 * ==========================================
 *
 * Required when NovaCart backend runs
 * behind Render's proxy.
 *
 * Also helps secure cookies work correctly
 * in production.
 */
app.set(
  "trust proxy",
  1
);

/**
 * ==========================================
 * CORS CONFIGURATION
 * ==========================================
 *
 * Local frontend:
 * http://localhost:5173
 *
 * Production frontend:
 * Vercel URL from environment variable.
 */
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.VERCEL_CLIENT_URL,
]
  .filter(Boolean)
  .map((origin) =>
    origin.replace(/\/$/, "")
  );

/**
 * Development convenience.
 *
 * This keeps localhost available even
 * if CLIENT_URL is accidentally omitted.
 */
if (
  process.env.NODE_ENV !==
  "production"
) {
  const developmentOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];

  developmentOrigins.forEach(
    (origin) => {
      if (
        !allowedOrigins.includes(
          origin
        )
      ) {
        allowedOrigins.push(
          origin
        );
      }
    }
  );
}

const corsOptions = {
  origin: (
    origin,
    callback
  ) => {
    /**
     * Requests without Origin are allowed.
     *
     * Examples:
     * - Postman
     * - Render health checks
     * - direct API requests
     */
    if (!origin) {
      return callback(
        null,
        true
      );
    }

    const normalizedOrigin =
      origin.replace(
        /\/$/,
        ""
      );

    if (
      allowedOrigins.includes(
        normalizedOrigin
      )
    ) {
      return callback(
        null,
        true
      );
    }

    return callback(
      new Error(
        "Origin is not allowed by NovaCart CORS policy."
      )
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],
};

app.use(
  cors(corsOptions)
);

/**
 * ==========================================
 * REQUEST BODY MIDDLEWARE
 * ==========================================
 */

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

app.use(
  cookieParser()
);

/**
 * ==========================================
 * BASIC SECURITY HEADERS
 * ==========================================
 *
 * Kept simple so we don't add unnecessary
 * extra dependencies for the college project.
 */

app.disable(
  "x-powered-by"
);

app.use(
  (req, res, next) => {
    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    res.setHeader(
      "X-Frame-Options",
      "DENY"
    );

    res.setHeader(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );

    next();
  }
);

/**
 * ==========================================
 * HEALTH CHECK
 * ==========================================
 *
 * Useful for:
 * - browser testing
 * - Render deployment
 * - uptime checks
 */
app.get(
  "/",
  (req, res) => {
    return res.status(200).json({
      success: true,
      message:
        "NovaCart API is running.",
      environment:
        process.env.NODE_ENV ||
        "development",
    });
  }
);

app.get(
  "/api/health",
  (req, res) => {
    const databaseConnected =
      mongoose.connection
        .readyState === 1;

    return res.status(
      databaseConnected
        ? 200
        : 503
    ).json({
      success:
        databaseConnected,

      message:
        databaseConnected
          ? "NovaCart backend is healthy."
          : "NovaCart backend is running but database is not connected.",

      database:
        databaseConnected
          ? "connected"
          : "disconnected",

      timestamp:
        new Date().toISOString(),
    });
  }
);

/**
 * ==========================================
 * API ROUTES
 * ==========================================
 */

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/cart",
  cartRoutes
);

app.use(
  "/api/wishlist",
  wishlistRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

/**
 * ==========================================
 * API INFORMATION
 * ==========================================
 *
 * Useful during development.
 */
app.get(
  "/api",
  (req, res) => {
    return res.status(200).json({
      success: true,

      name:
        "NovaCart API",

      version:
        "1.0.0",

      endpoints: {
        auth:
          "/api/auth",

        users:
          "/api/users",

        products:
          "/api/products",

        cart:
          "/api/cart",

        wishlist:
          "/api/wishlist",

        orders:
          "/api/orders",

        admin:
          "/api/admin",

        health:
          "/api/health",
      },
    });
  }
);

/**
 * ==========================================
 * 404 HANDLER
 * ==========================================
 *
 * Must remain after every valid route.
 */
app.use(
  (req, res) => {
    return res.status(404).json({
      success: false,
      message:
        `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
);

/**
 * ==========================================
 * GLOBAL ERROR HANDLER
 * ==========================================
 *
 * Handles:
 * - Multer errors
 * - Cloudinary upload errors
 * - CORS errors
 * - malformed JSON
 * - unexpected Express errors
 */
app.use(
  (
    error,
    req,
    res,
    next
  ) => {
    console.error(
      "NovaCart server error:",
      error
    );

    /**
     * Multer upload errors.
     */
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Image size cannot exceed 5 MB.",
          });
      }

      if (
        error.code ===
        "LIMIT_FILE_COUNT"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Too many files were uploaded.",
          });
      }

      if (
        error.code ===
        "LIMIT_UNEXPECTED_FILE"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Unexpected image field or too many product images.",
          });
      }

      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message ||
            "File upload failed.",
        });
    }

    /**
     * File type errors from uploadMiddleware.
     */
    if (
      error.message ===
      "Only JPG, JPEG, PNG and WEBP image files are allowed."
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error.message,
        });
    }

    /**
     * CORS error.
     */
    if (
      error.message ===
      "Origin is not allowed by NovaCart CORS policy."
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "This website is not allowed to access the NovaCart API.",
        });
    }

    /**
     * Malformed JSON.
     */
    if (
      error instanceof
        SyntaxError &&
      error.status ===
        400 &&
      "body" in error
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid JSON request body.",
        });
    }

    /**
     * MongoDB duplicate key.
     */
    if (
      error?.code ===
      11000
    ) {
      return res
        .status(409)
        .json({
          success: false,
          message:
            "A record with this value already exists.",
        });
    }

    /**
     * MongoDB invalid ObjectId.
     */
    if (
      error?.name ===
      "CastError"
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Invalid resource identifier.",
        });
    }

    /**
     * Mongoose validation errors.
     */
    if (
      error?.name ===
      "ValidationError"
    ) {
      const firstError =
        Object.values(
          error.errors ||
            {}
        )[0];

      return res
        .status(400)
        .json({
          success: false,

          message:
            firstError
              ?.message ||
            "Validation failed.",
        });
    }

    /**
     * Generic fallback.
     */
    return res
      .status(
        error.status ||
          500
      )
      .json({
        success: false,

        message:
          process.env
            .NODE_ENV ===
          "production"
            ? "Something went wrong on the server."
            : error.message ||
              "Internal server error.",
      });
  }
);

/**
 * ==========================================
 * SERVER STARTUP
 * ==========================================
 */
const startServer =
  async () => {
    try {
      /**
       * MongoDB Atlas connection.
       */
      await connectDB();

      /**
       * Cloudinary configuration.
       *
       * Backend can still start during
       * early development without credentials.
       */
      const cloudinaryReady =
        configureCloudinary();

      if (
        cloudinaryReady
      ) {
        console.log(
          "Cloudinary configured successfully."
        );
      }

      /**
       * Create or verify administrator.
       */
      await ensureAdminUser();

      /**
       * Start Express only after
       * MongoDB connection succeeds.
       */
      app.listen(
        PORT,
        () => {
          console.log(
            "=========================================="
          );

          console.log(
            "        NovaCart Backend Started"
          );

          console.log(
            "=========================================="
          );

          console.log(
            `Environment : ${
              process.env
                .NODE_ENV ||
              "development"
            }`
          );

          console.log(
            `Port        : ${PORT}`
          );

          console.log(
            `API         : http://localhost:${PORT}/api`
          );

          console.log(
            `Health      : http://localhost:${PORT}/api/health`
          );

          console.log(
            "=========================================="
          );
        }
      );
    } catch (error) {
      console.error(
        "NovaCart startup failed:",
        error
      );

      process.exit(1);
    }
  };

/**
 * ==========================================
 * PROCESS ERROR HANDLING
 * ==========================================
 */

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "Unhandled Promise Rejection:",
      reason
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught Exception:",
      error
    );

    process.exit(1);
  }
);

/**
 * Graceful shutdown.
 */
const shutdown =
  async (signal) => {
    try {
      console.log(
        `${signal} received. Shutting down NovaCart...`
      );

      if (
        mongoose.connection
          .readyState !==
        0
      ) {
        await mongoose.connection.close();
      }

      process.exit(0);
    } catch (error) {
      console.error(
        "Shutdown error:",
        error
      );

      process.exit(1);
    }
  };

process.on(
  "SIGTERM",
  () =>
    shutdown(
      "SIGTERM"
    )
);

process.on(
  "SIGINT",
  () =>
    shutdown(
      "SIGINT"
    )
);

/**
 * Start NovaCart.
 */
startServer();