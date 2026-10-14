import mongoose from "mongoose";

import Order from "../models/Order.js";
import User from "../models/User.js";


/**
 * ============================================================
 * ALLOWED DELIVERY STATUS FLOW
 * ============================================================
 *
 * Delivery agent can move only forward:
 *
 * processing
 *    ↓
 * shipped
 *    ↓
 * out_for_delivery
 *    ↓
 * delivered
 */
const DELIVERY_STATUS_FLOW = {
  processing: [
    "shipped",
  ],

  shipped: [
    "out_for_delivery",
  ],

  out_for_delivery: [
    "delivered",
  ],
};


/**
 * ============================================================
 * SAFE ORDER POPULATION
 * ============================================================
 */
const populateDeliveryOrder =
  async (order) => {
    if (!order) {
      return null;
    }

    await order.populate([
      {
        path: "user",

        select:
          "name email phone",
      },

      {
        path:
          "delivery.agent",

        select:
          "name email phone role deliveryAgentProfile",
      },
    ]);

    return order;
  };


/**
 * ============================================================
 * GET DELIVERY DASHBOARD
 * ============================================================
 *
 * GET /api/delivery/dashboard
 */
export const getDeliveryDashboard =
  async (
    req,
    res
  ) => {
    try {
      const agentId =
        req.user._id;

      const [
        totalAssigned,
        processing,
        shipped,
        outForDelivery,
        delivered,
        recentOrders,
      ] =
        await Promise.all([
          Order.countDocuments({
            "delivery.agent":
              agentId,
          }),

          Order.countDocuments({
            "delivery.agent":
              agentId,

            orderStatus:
              "processing",
          }),

          Order.countDocuments({
            "delivery.agent":
              agentId,

            orderStatus:
              "shipped",
          }),

          Order.countDocuments({
            "delivery.agent":
              agentId,

            orderStatus:
              "out_for_delivery",
          }),

          Order.countDocuments({
            "delivery.agent":
              agentId,

            orderStatus:
              "delivered",
          }),

          Order.find({
            "delivery.agent":
              agentId,
          })
            .sort({
              updatedAt: -1,
            })
            .limit(8)
            .populate(
              "user",
              "name email phone"
            ),
        ]);

      return res
        .status(200)
        .json({
          success: true,

          summary: {
            totalAssigned,
            processing,
            shipped,
            outForDelivery,
            delivered,
          },

          recentOrders,
        });
    } catch (error) {
      console.error(
        "Delivery dashboard error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load delivery dashboard.",
        });
    }
  };


/**
 * ============================================================
 * GET ASSIGNED ORDERS
 * ============================================================
 *
 * GET /api/delivery/orders
 *
 * Optional query:
 *
 * ?status=processing
 * ?status=shipped
 * ?status=out_for_delivery
 * ?status=delivered
 */
export const getAssignedOrders =
  async (
    req,
    res
  ) => {
    try {
      const agentId =
        req.user._id;

      const {
        status = "",
      } =
        req.query;

      const filter = {
        "delivery.agent":
          agentId,
      };

      if (
        status &&
        [
          "processing",
          "shipped",
          "out_for_delivery",
          "delivered",
        ].includes(
          status
        )
      ) {
        filter.orderStatus =
          status;
      }

      const orders =
        await Order.find(
          filter
        )
          .sort({
            createdAt: -1,
          })
          .populate(
            "user",
            "name email phone"
          );

      return res
        .status(200)
        .json({
          success: true,
          orders,
        });
    } catch (error) {
      console.error(
        "Get assigned delivery orders error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load assigned orders.",
        });
    }
  };


/**
 * ============================================================
 * GET SINGLE ASSIGNED ORDER
 * ============================================================
 *
 * GET /api/delivery/orders/:orderId
 */
export const getAssignedOrderById =
  async (
    req,
    res
  ) => {
    try {
      const {
        orderId,
      } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid order ID.",
          });
      }

      const order =
        await Order.findOne({
          _id: orderId,

          "delivery.agent":
            req.user._id,
        });

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Assigned order not found.",
          });
      }

      await populateDeliveryOrder(
        order
      );

      return res
        .status(200)
        .json({
          success: true,
          order,
        });
    } catch (error) {
      console.error(
        "Get delivery order error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load order details.",
        });
    }
  };


/**
 * ============================================================
 * ACCEPT ASSIGNED ORDER
 * ============================================================
 *
 * PATCH /api/delivery/orders/:orderId/accept
 *
 * This does not change orderStatus.
 * It only records that the delivery agent
 * accepted the assignment.
 */
export const acceptAssignedOrder =
  async (
    req,
    res
  ) => {
    try {
      const {
        orderId,
      } =
        req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid order ID.",
          });
      }

      const order =
        await Order.findOne({
          _id: orderId,

          "delivery.agent":
            req.user._id,
        });

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Assigned order not found.",
          });
      }

      if (
        order.orderStatus ===
          "delivered" ||
        order.orderStatus ===
          "cancelled"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "This order can no longer be accepted.",
          });
      }

      order.delivery =
        order.delivery || {};

      order.delivery
        .acceptedAt =
        order.delivery
          .acceptedAt ||
        new Date();

      await order.save();

      await populateDeliveryOrder(
        order
      );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Order accepted successfully.",
          order,
        });
    } catch (error) {
      console.error(
        "Accept delivery order error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to accept order.",
        });
    }
  };


/**
 * ============================================================
 * UPDATE DELIVERY STATUS
 * ============================================================
 *
 * PATCH /api/delivery/orders/:orderId/status
 *
 * Body:
 *
 * {
 *   "status": "shipped",
 *   "note": "Package collected from warehouse."
 * }
 */
export const updateDeliveryStatus =
  async (
    req,
    res
  ) => {
    try {
      const {
        orderId,
      } =
        req.params;

      const {
        status,
        note = "",
        proofOfDelivery = "",
      } =
        req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid order ID.",
          });
      }

      const allowedStatuses =
        [
          "shipped",
          "out_for_delivery",
          "delivered",
        ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid delivery status.",
          });
      }

      const order =
        await Order.findOne({
          _id: orderId,

          "delivery.agent":
            req.user._id,
        });

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Assigned order not found.",
          });
      }

      if (
        order.orderStatus ===
        "cancelled"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Cancelled orders cannot be updated.",
          });
      }

      if (
        order.orderStatus ===
        "delivered"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "This order has already been delivered.",
          });
      }

      const nextAllowedStatuses =
        DELIVERY_STATUS_FLOW[
          order.orderStatus
        ] || [];

      if (
        !nextAllowedStatuses.includes(
          status
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              `Order cannot move from ${order.orderStatus} to ${status}.`,
          });
      }

      order.delivery =
        order.delivery || {};

      if (
        !order.delivery
          .acceptedAt
      ) {
        order.delivery
          .acceptedAt =
          new Date();
      }

      if (note) {
        order.delivery
          .deliveryNote =
          String(note)
            .trim()
            .slice(
              0,
              500
            );
      }

      if (
        status ===
          "delivered" &&
        proofOfDelivery
      ) {
        order.delivery
          .proofOfDelivery =
          String(
            proofOfDelivery
          )
            .trim()
            .slice(
              0,
              500
            );
      }

      let historyMessage =
        "";

      if (
        status ===
        "shipped"
      ) {
        historyMessage =
          note ||
          "Order has been shipped.";
      }

      if (
        status ===
        "out_for_delivery"
      ) {
        historyMessage =
          note ||
          "Order is out for delivery.";
      }

      if (
        status ===
        "delivered"
      ) {
        historyMessage =
          note ||
          "Order delivered successfully.";
      }

      order.addStatusHistory(
        status,
        historyMessage,
        req.user._id,
        "delivery_agent"
      );

      await order.save();

      await populateDeliveryOrder(
        order
      );

      return res
        .status(200)
        .json({
          success: true,

          message:
            `Order status updated to ${status
              .replace(
                /_/g,
                " "
              )}.`,

          order,
        });
    } catch (error) {
      console.error(
        "Update delivery status error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update delivery status.",
        });
    }
  };


/**
 * ============================================================
 * UPDATE DELIVERY NOTE
 * ============================================================
 *
 * PATCH /api/delivery/orders/:orderId/note
 */
export const updateDeliveryNote =
  async (
    req,
    res
  ) => {
    try {
      const {
        orderId,
      } =
        req.params;

      const {
        note = "",
      } =
        req.body;

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid order ID.",
          });
      }

      const order =
        await Order.findOne({
          _id: orderId,

          "delivery.agent":
            req.user._id,
        });

      if (!order) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Assigned order not found.",
          });
      }

      order.delivery =
        order.delivery || {};

      order.delivery
        .deliveryNote =
        String(note)
          .trim()
          .slice(
            0,
            500
          );

      await order.save();

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Delivery note updated successfully.",
          order,
        });
    } catch (error) {
      console.error(
        "Update delivery note error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update delivery note.",
        });
    }
  };


/**
 * ============================================================
 * GET DELIVERY AGENT PROFILE
 * ============================================================
 *
 * GET /api/delivery/profile
 */
export const getDeliveryProfile =
  async (
    req,
    res
  ) => {
    try {
      const agent =
        await User.findById(
          req.user._id
        ).select(
          "name email phone role isActive deliveryAgentProfile createdAt"
        );

      if (!agent) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Delivery agent not found.",
          });
      }

      return res
        .status(200)
        .json({
          success: true,
          agent,
        });
    } catch (error) {
      console.error(
        "Get delivery profile error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load delivery agent profile.",
        });
    }
  };


/**
 * ============================================================
 * UPDATE DELIVERY AGENT AVAILABILITY
 * ============================================================
 *
 * PATCH /api/delivery/availability
 *
 * Body:
 *
 * {
 *   "isAvailable": true
 * }
 */
export const updateAvailability =
  async (
    req,
    res
  ) => {
    try {
      const {
        isAvailable,
      } =
        req.body;

      if (
        typeof isAvailable !==
        "boolean"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "isAvailable must be true or false.",
          });
      }

      const agent =
        await User.findById(
          req.user._id
        );

      if (!agent) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Delivery agent not found.",
          });
      }

      agent.deliveryAgentProfile =
        agent.deliveryAgentProfile ||
        {};

      agent.deliveryAgentProfile
        .isAvailable =
        isAvailable;

      await agent.save();

      return res
        .status(200)
        .json({
          success: true,

          message:
            isAvailable
              ? "You are now available for deliveries."
              : "You are now unavailable for new deliveries.",

          isAvailable,
        });
    } catch (error) {
      console.error(
        "Update delivery availability error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update availability.",
        });
    }
  };