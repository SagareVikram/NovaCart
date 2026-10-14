import mongoose from "mongoose";
import User from "../models/User.js";
import Order from "../models/Order.js";


/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};


const normalizeBoolean = (value) => {
  if (
    value === true ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false"
  ) {
    return false;
  }

  return null;
};


const normalizePageNumber = (
  value,
  fallback
) => {
  const parsed =
    Number.parseInt(
      value,
      10
    );

  if (
    !Number.isFinite(parsed) ||
    parsed < 1
  ) {
    return fallback;
  }

  return parsed;
};


const normalizeText = (
  value,
  maxLength = 200
) => {
  return String(
    value ?? ""
  )
    .trim()
    .slice(
      0,
      maxLength
    );
};


/**
 * ============================================================
 * GET DELIVERY AGENTS
 * ============================================================
 *
 * GET /api/admin/delivery-agents
 *
 * Query:
 *
 * ?page=1
 * ?limit=20
 * ?search=rahul
 * ?status=active
 * ?availability=available
 */
export const getDeliveryAgents =
  async (
    req,
    res
  ) => {
    try {
      const page =
        normalizePageNumber(
          req.query.page,
          1
        );

      const limit =
        Math.min(
          normalizePageNumber(
            req.query.limit,
            20
          ),
          100
        );

      const skip =
        (page - 1) *
        limit;

      const search =
        normalizeText(
          req.query.search,
          100
        );

      const status =
        normalizeText(
          req.query.status,
          30
        ).toLowerCase();

      const availability =
        normalizeText(
          req.query.availability,
          30
        ).toLowerCase();

      const filter = {
        role:
          "delivery_agent",
      };


      /**
       * Active / inactive filter.
       */
      if (
        status ===
        "active"
      ) {
        filter.isActive =
          true;
      }

      if (
        status ===
        "inactive"
      ) {
        filter.isActive =
          false;
      }


      /**
       * Availability filter.
       */
      if (
        availability ===
        "available"
      ) {
        filter[
          "deliveryAgentProfile.isAvailable"
        ] = true;
      }

      if (
        availability ===
        "unavailable"
      ) {
        filter[
          "deliveryAgentProfile.isAvailable"
        ] = false;
      }


      /**
       * Search.
       */
      if (search) {
        const escapedSearch =
          search.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
          );

        const regex =
          new RegExp(
            escapedSearch,
            "i"
          );

        filter.$or = [
          {
            name:
              regex,
          },

          {
            email:
              regex,
          },

          {
            phone:
              regex,
          },

          {
            "deliveryAgentProfile.employeeId":
              regex,
          },

          {
            "deliveryAgentProfile.vehicleNumber":
              regex,
          },

          {
            "deliveryAgentProfile.deliveryArea":
              regex,
          },
        ];
      }


      const [
        agents,
        total,
      ] =
        await Promise.all([
          User.find(
            filter
          )
            .select(
              "name email phone role isActive deliveryAgentProfile createdAt updatedAt"
            )
            .sort({
              createdAt: -1,
            })
            .skip(skip)
            .limit(limit),

          User.countDocuments(
            filter
          ),
        ]);


      /**
       * Load active assignment counts
       * for displayed agents.
       */
      const agentIds =
        agents.map(
          (agent) =>
            agent._id
        );

      let assignmentCounts =
        [];

      if (
        agentIds.length >
        0
      ) {
        assignmentCounts =
          await Order.aggregate([
            {
              $match: {
                "delivery.agent": {
                  $in:
                    agentIds,
                },

                orderStatus: {
                  $in: [
                    "processing",
                    "shipped",
                    "out_for_delivery",
                  ],
                },
              },
            },

            {
              $group: {
                _id:
                  "$delivery.agent",

                count: {
                  $sum:
                    1,
                },
              },
            },
          ]);
      }


      const countMap =
        new Map(
          assignmentCounts.map(
            (item) => [
              String(
                item._id
              ),

              Number(
                item.count ||
                  0
              ),
            ]
          )
        );


      const formattedAgents =
        agents.map(
          (agent) => ({
            ...agent.toObject(),

            activeAssignments:
              countMap.get(
                String(
                  agent._id
                )
              ) || 0,
          })
        );


      return res
        .status(200)
        .json({
          success: true,

          agents:
            formattedAgents,

          pagination: {
            page,
            limit,
            total,

            totalPages:
              Math.max(
                Math.ceil(
                  total /
                    limit
                ),
                1
              ),
          },
        });
    } catch (error) {
      console.error(
        "Get delivery agents error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load delivery agents.",
        });
    }
  };


/**
 * ============================================================
 * GET AVAILABLE DELIVERY AGENTS
 * ============================================================
 *
 * GET /api/admin/delivery-agents/available
 *
 * Used by the order-assignment dropdown.
 */
export const getAvailableDeliveryAgents =
  async (
    req,
    res
  ) => {
    try {
      const agents =
        await User.find({
          role:
            "delivery_agent",

          isActive:
            true,

          "deliveryAgentProfile.isAvailable":
            true,
        })
          .select(
            "name email phone deliveryAgentProfile"
          )
          .sort({
            name: 1,
          });


      /**
       * Add active assignment count.
       */
      const agentIds =
        agents.map(
          (agent) =>
            agent._id
        );

      let assignmentCounts =
        [];

      if (
        agentIds.length >
        0
      ) {
        assignmentCounts =
          await Order.aggregate([
            {
              $match: {
                "delivery.agent": {
                  $in:
                    agentIds,
                },

                orderStatus: {
                  $in: [
                    "processing",
                    "shipped",
                    "out_for_delivery",
                  ],
                },
              },
            },

            {
              $group: {
                _id:
                  "$delivery.agent",

                count: {
                  $sum:
                    1,
                },
              },
            },
          ]);
      }


      const countMap =
        new Map(
          assignmentCounts.map(
            (item) => [
              String(
                item._id
              ),

              Number(
                item.count ||
                  0
              ),
            ]
          )
        );


      const result =
        agents.map(
          (agent) => ({
            ...agent.toObject(),

            activeAssignments:
              countMap.get(
                String(
                  agent._id
                )
              ) || 0,
          })
        );


      return res
        .status(200)
        .json({
          success: true,
          agents:
            result,
        });
    } catch (error) {
      console.error(
        "Get available delivery agents error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load available delivery agents.",
        });
    }
  };


/**
 * ============================================================
 * CREATE DELIVERY AGENT
 * ============================================================
 *
 * POST /api/admin/delivery-agents
 *
 * Body:
 *
 * {
 *   "name": "Rahul Patil",
 *   "email": "rahul@novacart.com",
 *   "password": "Rahul@123",
 *   "phone": "9876543210",
 *   "employeeId": "DA-001",
 *   "vehicleNumber": "MH11AB1234",
 *   "deliveryArea": "Karad"
 * }
 */
export const createDeliveryAgent =
  async (
    req,
    res
  ) => {
    try {
      const name =
        normalizeText(
          req.body.name,
          100
        );

      const email =
        normalizeText(
          req.body.email,
          150
        ).toLowerCase();

      const password =
        String(
          req.body.password ??
            ""
        );

      const phone =
        normalizeText(
          req.body.phone,
          20
        );

      const employeeId =
        normalizeText(
          req.body.employeeId,
          50
        ).toUpperCase();

      const vehicleNumber =
        normalizeText(
          req.body.vehicleNumber,
          30
        ).toUpperCase();

      const deliveryArea =
        normalizeText(
          req.body.deliveryArea,
          150
        );


      if (
        !name ||
        name.length < 2
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Delivery agent name is required.",
          });
      }


      if (
        !email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "A valid email address is required.",
          });
      }


      if (
        password.length <
        6
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Password must contain at least 6 characters.",
          });
      }


      if (!phone) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Phone number is required.",
          });
      }


      if (
        !employeeId
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Employee ID is required.",
          });
      }


      const existingEmail =
        await User.findOne({
          email,
        });

      if (
        existingEmail
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "An account with this email already exists.",
          });
      }


      const existingEmployee =
        await User.findOne({
          role:
            "delivery_agent",

          "deliveryAgentProfile.employeeId":
            employeeId,
        });

      if (
        existingEmployee
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "This delivery agent employee ID is already in use.",
          });
      }


      const agent =
        new User({
          name,
          email,
          password,
          phone,

          role:
            "delivery_agent",

          isActive:
            true,

          deliveryAgentProfile: {
            employeeId,
            vehicleNumber,
            deliveryArea,

            isAvailable:
              true,

            joinedAt:
              new Date(),
          },
        });


      /**
       * User model automatically
       * hashes the password.
       */
      await agent.save();


      const safeAgent =
        await User.findById(
          agent._id
        ).select(
          "name email phone role isActive deliveryAgentProfile createdAt updatedAt"
        );


      return res
        .status(201)
        .json({
          success: true,

          message:
            "Delivery agent created successfully.",

          agent:
            safeAgent,
        });
    } catch (error) {
      console.error(
        "Create delivery agent error:",
        error
      );

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Delivery agent email or employee ID already exists.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to create delivery agent.",
        });
    }
  };


/**
 * ============================================================
 * GET DELIVERY AGENT DETAILS
 * ============================================================
 *
 * GET /api/admin/delivery-agents/:agentId
 */
export const getDeliveryAgentDetails =
  async (
    req,
    res
  ) => {
    try {
      const {
        agentId,
      } =
        req.params;


      if (
        !isValidObjectId(
          agentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid delivery agent ID.",
          });
      }


      const agent =
        await User.findOne({
          _id:
            agentId,

          role:
            "delivery_agent",
        }).select(
          "name email phone role isActive deliveryAgentProfile createdAt updatedAt lastLoginAt"
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


      const [
        totalAssigned,
        activeAssignments,
        deliveredOrders,
        processingOrders,
        shippedOrders,
        outForDeliveryOrders,
        recentOrders,
      ] =
        await Promise.all([
          Order.countDocuments({
            "delivery.agent":
              agent._id,
          }),

          Order.countDocuments({
            "delivery.agent":
              agent._id,

            orderStatus: {
              $in: [
                "processing",
                "shipped",
                "out_for_delivery",
              ],
            },
          }),

          Order.countDocuments({
            "delivery.agent":
              agent._id,

            orderStatus:
              "delivered",
          }),

          Order.countDocuments({
            "delivery.agent":
              agent._id,

            orderStatus:
              "processing",
          }),

          Order.countDocuments({
            "delivery.agent":
              agent._id,

            orderStatus:
              "shipped",
          }),

          Order.countDocuments({
            "delivery.agent":
              agent._id,

            orderStatus:
              "out_for_delivery",
          }),

          Order.find({
            "delivery.agent":
              agent._id,
          })
            .sort({
              updatedAt: -1,
            })
            .limit(10)
            .populate(
              "user",
              "name email phone"
            ),
        ]);


      return res
        .status(200)
        .json({
          success: true,

          agent,

          summary: {
            totalAssigned,
            activeAssignments,
            deliveredOrders,
            processingOrders,
            shippedOrders,
            outForDeliveryOrders,
          },

          recentOrders,
        });
    } catch (error) {
      console.error(
        "Get delivery agent details error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load delivery agent details.",
        });
    }
  };


/**
 * ============================================================
 * UPDATE DELIVERY AGENT
 * ============================================================
 *
 * PUT /api/admin/delivery-agents/:agentId
 */
export const updateDeliveryAgent =
  async (
    req,
    res
  ) => {
    try {
      const {
        agentId,
      } =
        req.params;


      if (
        !isValidObjectId(
          agentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid delivery agent ID.",
          });
      }


      const agent =
        await User.findOne({
          _id:
            agentId,

          role:
            "delivery_agent",
        }).select(
          "+password"
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


      const {
        name,
        email,
        phone,
        employeeId,
        vehicleNumber,
        deliveryArea,
        password,
      } =
        req.body;


      if (
        name !==
        undefined
      ) {
        const normalizedName =
          normalizeText(
            name,
            100
          );

        if (
          normalizedName.length <
          2
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Delivery agent name must contain at least 2 characters.",
            });
        }

        agent.name =
          normalizedName;
      }


      if (
        email !==
        undefined
      ) {
        const normalizedEmail =
          normalizeText(
            email,
            150
          ).toLowerCase();

        if (
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            normalizedEmail
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Please provide a valid email address.",
            });
        }


        const duplicateEmail =
          await User.findOne({
            email:
              normalizedEmail,

            _id: {
              $ne:
                agent._id,
            },
          });

        if (
          duplicateEmail
        ) {
          return res
            .status(409)
            .json({
              success: false,
              message:
                "Another account already uses this email.",
            });
        }

        agent.email =
          normalizedEmail;
      }


      if (
        phone !==
        undefined
      ) {
        agent.phone =
          normalizeText(
            phone,
            20
          );
      }


      agent.deliveryAgentProfile =
        agent.deliveryAgentProfile ||
        {};


      if (
        employeeId !==
        undefined
      ) {
        const normalizedEmployeeId =
          normalizeText(
            employeeId,
            50
          ).toUpperCase();

        if (
          !normalizedEmployeeId
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Employee ID is required.",
            });
        }


        const duplicateEmployee =
          await User.findOne({
            role:
              "delivery_agent",

            "deliveryAgentProfile.employeeId":
              normalizedEmployeeId,

            _id: {
              $ne:
                agent._id,
            },
          });

        if (
          duplicateEmployee
        ) {
          return res
            .status(409)
            .json({
              success: false,
              message:
                "Another delivery agent already uses this employee ID.",
            });
        }


        agent.deliveryAgentProfile.employeeId =
          normalizedEmployeeId;
      }


      if (
        vehicleNumber !==
        undefined
      ) {
        agent.deliveryAgentProfile.vehicleNumber =
          normalizeText(
            vehicleNumber,
            30
          ).toUpperCase();
      }


      if (
        deliveryArea !==
        undefined
      ) {
        agent.deliveryAgentProfile.deliveryArea =
          normalizeText(
            deliveryArea,
            150
          );
      }


      /**
       * Optional admin password reset.
       */
      if (
        password !==
        undefined &&
        String(
          password
        ).length > 0
      ) {
        if (
          String(
            password
          ).length <
          6
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Password must contain at least 6 characters.",
            });
        }

        agent.password =
          String(
            password
          );
      }


      await agent.save();


      const updatedAgent =
        await User.findById(
          agent._id
        ).select(
          "name email phone role isActive deliveryAgentProfile createdAt updatedAt"
        );


      return res
        .status(200)
        .json({
          success: true,

          message:
            "Delivery agent updated successfully.",

          agent:
            updatedAgent,
        });
    } catch (error) {
      console.error(
        "Update delivery agent error:",
        error
      );

      if (
        error?.code ===
        11000
      ) {
        return res
          .status(409)
          .json({
            success: false,
            message:
              "Delivery agent email or employee ID already exists.",
          });
      }

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update delivery agent.",
        });
    }
  };


/**
 * ============================================================
 * UPDATE DELIVERY AGENT ACTIVE STATUS
 * ============================================================
 *
 * PATCH /api/admin/delivery-agents/:agentId/status
 *
 * Body:
 *
 * {
 *   "isActive": false
 * }
 */
export const updateDeliveryAgentStatus =
  async (
    req,
    res
  ) => {
    try {
      const {
        agentId,
      } =
        req.params;

      if (
        !isValidObjectId(
          agentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid delivery agent ID.",
          });
      }


      const isActive =
        normalizeBoolean(
          req.body.isActive
        );


      if (
        isActive ===
        null
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "isActive must be true or false.",
          });
      }


      const agent =
        await User.findOne({
          _id:
            agentId,

          role:
            "delivery_agent",
        });


      if (!agent) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Delivery agent not found.",
          });
      }


      /**
       * Prevent disabling an agent who
       * currently has unfinished orders.
       */
      if (
        isActive ===
        false
      ) {
        const activeAssignments =
          await Order.countDocuments({
            "delivery.agent":
              agent._id,

            orderStatus: {
              $in: [
                "processing",
                "shipped",
                "out_for_delivery",
              ],
            },
          });


        if (
          activeAssignments >
          0
        ) {
          return res
            .status(400)
            .json({
              success: false,

              message:
                `This delivery agent has ${activeAssignments} active order(s). Reassign or complete them before disabling the account.`,
            });
        }
      }


      agent.isActive =
        isActive;

      /**
       * An inactive account should
       * not appear as available.
       */
      if (
        !isActive
      ) {
        agent.deliveryAgentProfile =
          agent.deliveryAgentProfile ||
          {};

        agent.deliveryAgentProfile.isAvailable =
          false;
      }


      await agent.save();


      return res
        .status(200)
        .json({
          success: true,

          message:
            isActive
              ? "Delivery agent activated successfully."
              : "Delivery agent disabled successfully.",

          agent: {
            _id:
              agent._id,

            isActive:
              agent.isActive,

            isAvailable:
              agent
                .deliveryAgentProfile
                ?.isAvailable ??
              false,
          },
        });
    } catch (error) {
      console.error(
        "Update delivery agent status error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update delivery agent status.",
        });
    }
  };


/**
 * ============================================================
 * UPDATE AGENT AVAILABILITY AS ADMIN
 * ============================================================
 *
 * PATCH /api/admin/delivery-agents/:agentId/availability
 *
 * Body:
 *
 * {
 *   "isAvailable": true
 * }
 */
export const updateDeliveryAgentAvailability =
  async (
    req,
    res
  ) => {
    try {
      const {
        agentId,
      } =
        req.params;


      if (
        !isValidObjectId(
          agentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid delivery agent ID.",
          });
      }


      const isAvailable =
        normalizeBoolean(
          req.body.isAvailable
        );


      if (
        isAvailable ===
        null
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
        await User.findOne({
          _id:
            agentId,

          role:
            "delivery_agent",
        });


      if (!agent) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Delivery agent not found.",
          });
      }


      if (
        isAvailable &&
        !agent.isActive
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "An inactive delivery agent cannot be marked available.",
          });
      }


      agent.deliveryAgentProfile =
        agent.deliveryAgentProfile ||
        {};

      agent.deliveryAgentProfile.isAvailable =
        isAvailable;


      await agent.save();


      return res
        .status(200)
        .json({
          success: true,

          message:
            isAvailable
              ? "Delivery agent marked available."
              : "Delivery agent marked unavailable.",

          isAvailable,
        });
    } catch (error) {
      console.error(
        "Update delivery agent availability error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to update delivery agent availability.",
        });
    }
  };


/**
 * ============================================================
 * ASSIGN ORDER TO DELIVERY AGENT
 * ============================================================
 *
 * PATCH /api/admin/orders/:orderId/delivery-agent
 *
 * Body:
 *
 * {
 *   "agentId": "..."
 * }
 *
 * Important:
 * Admin should first move the order to
 * "processing".
 */
export const assignOrderToDeliveryAgent =
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
        agentId,
      } =
        req.body;


      if (
        !isValidObjectId(
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


      if (
        !isValidObjectId(
          agentId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid delivery agent ID.",
          });
      }


      const [
        order,
        agent,
      ] =
        await Promise.all([
          Order.findById(
            orderId
          ),

          User.findOne({
            _id:
              agentId,

            role:
              "delivery_agent",
          }),
        ]);


      if (!order) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Order not found.",
          });
      }


      if (!agent) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Delivery agent not found.",
          });
      }


      if (
        !agent.isActive
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "This delivery agent account is inactive.",
          });
      }


      if (
        !agent
          .deliveryAgentProfile
          ?.isAvailable
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "This delivery agent is currently unavailable.",
          });
      }


      if (
        order.orderStatus ===
          "cancelled" ||
        order.orderStatus ===
          "delivered"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Delivered or cancelled orders cannot be assigned.",
          });
      }


      /**
       * Agent workflow begins from processing.
       *
       * We also permit reassignment after shipping
       * if necessary.
       */
      const assignableStatuses =
        [
          "processing",
          "shipped",
          "out_for_delivery",
        ];


      if (
        !assignableStatuses.includes(
          order.orderStatus
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,

            message:
              "Move the order to Processing before assigning a delivery agent.",
          });
      }


      const previousAgentId =
        order.delivery
          ?.agent
          ? String(
              order.delivery
                .agent
            )
          : null;


      order.assignDeliveryAgent(
        agent._id
      );


      /**
       * Add assignment information to
       * the order's admin note only if
       * useful, without overwriting
       * existing notes.
       */
      const assignmentMessage =
        `Delivery assigned to ${agent.name} (${agent.deliveryAgentProfile?.employeeId || "Agent"}).`;


      if (
        previousAgentId &&
        previousAgentId !==
          String(
            agent._id
          )
      ) {
        order.adminNote =
          order.adminNote
            ? `${order.adminNote}\nReassigned: ${assignmentMessage}`
            : `Reassigned: ${assignmentMessage}`;
      }


      await order.save();


      await order.populate([
        {
          path:
            "user",

          select:
            "name email phone",
        },

        {
          path:
            "delivery.agent",

          select:
            "name email phone isActive deliveryAgentProfile",
        },
      ]);


      return res
        .status(200)
        .json({
          success: true,

          message:
            previousAgentId &&
            previousAgentId !==
              String(
                agent._id
              )
              ? "Delivery agent reassigned successfully."
              : "Delivery agent assigned successfully.",

          order,
        });
    } catch (error) {
      console.error(
        "Assign delivery agent error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to assign delivery agent.",
        });
    }
  };


/**
 * ============================================================
 * REMOVE / UNASSIGN DELIVERY AGENT
 * ============================================================
 *
 * DELETE /api/admin/orders/:orderId/delivery-agent
 */
export const removeOrderDeliveryAgent =
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
        !isValidObjectId(
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
        await Order.findById(
          orderId
        );


      if (!order) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "Order not found.",
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
              "A delivered order cannot be unassigned.",
          });
      }


      if (
        !order.delivery
          ?.agent
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "This order does not have a delivery agent assigned.",
          });
      }


      order.removeDeliveryAgent();

      await order.save();


      return res
        .status(200)
        .json({
          success: true,

          message:
            "Delivery agent removed from order successfully.",

          order,
        });
    } catch (error) {
      console.error(
        "Remove delivery agent error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to remove delivery agent from order.",
        });
    }
  };