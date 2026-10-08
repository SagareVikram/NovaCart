/**
 * Allow access only to NovaCart administrators.
 *
 * Important:
 * This middleware must be used AFTER the `protect` middleware,
 * because `protect` is responsible for loading the logged-in
 * user and attaching it to `req.user`.
 */
const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify administrator access.",
    });
  }
};

export { adminOnly };