/**
 * ============================================================
 * DELIVERY AGENT MIDDLEWARE
 * ============================================================
 *
 * Purpose:
 * - allow only authenticated delivery agents
 * - block normal users
 * - block admins from delivery-agent-only routes
 *
 * Important:
 * authMiddleware must run before this middleware
 * so req.user is already available.
 */


const deliveryAgentMiddleware = (
  req,
  res,
  next
) => {
  try {
    /**
     * ========================================================
     * AUTHENTICATION CHECK
     * ========================================================
     */
    if (!req.user) {
      return res
        .status(401)
        .json({
          success: false,
          message:
            "Authentication required.",
        });
    }


    /**
     * ========================================================
     * ACCOUNT ACTIVE CHECK
     * ========================================================
     */
    if (
      req.user.isActive ===
      false
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Your account is inactive.",
        });
    }


    /**
     * ========================================================
     * DELIVERY AGENT ROLE CHECK
     * ========================================================
     */
    if (
      req.user.role !==
      "delivery_agent"
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Delivery agent access only.",
        });
    }


    /**
     * ========================================================
     * CONTINUE
     * ========================================================
     */
    next();
  } catch (error) {
    console.error(
      "Delivery agent middleware error:",
      error
    );

    return res
      .status(500)
      .json({
        success: false,
        message:
          "Unable to verify delivery agent access.",
      });
  }
};


export default deliveryAgentMiddleware;