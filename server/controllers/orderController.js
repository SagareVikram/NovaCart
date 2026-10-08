import mongoose from "mongoose";

import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

/**
 * Return the effective selling price.
 */
const getProductPrice = (product) => {
  if (
    product.discountPrice !== null &&
    product.discountPrice !== undefined &&
    product.discountPrice < product.price
  ) {
    return product.discountPrice;
  }

  return product.price;
};

/**
 * Generate a simple demo transaction ID.
 *
 * Used for college-project UPI/Card payment simulation.
 */
const generateTransactionId = () => {
  const timestamp = Date.now();

  const random = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `NOVA-TXN-${timestamp}-${random}`;
};

/**
 * Create a unique NovaCart order number.
 */
const generateUniqueOrderNumber = async (
  session = null
) => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const orderNumber =
      Order.generateOrderNumber();

    let query = Order.exists({
      orderNumber,
    });

    if (session) {
      query = query.session(session);
    }

    const exists = await query;

    if (!exists) {
      return orderNumber;
    }
  }

  return `NOVA-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
};

/**
 * Validate manual delivery address.
 */
const validateShippingAddress = (
  address
) => {
  if (!address) {
    return {
      valid: false,
      message:
        "Delivery address is required.",
    };
  }

  const requiredFields = [
    "fullName",
    "phone",
    "addressLine1",
    "city",
    "state",
    "postalCode",
  ];

  for (const field of requiredFields) {
    if (
      !address[field] ||
      !String(address[field]).trim()
    ) {
      return {
        valid: false,
        message:
          "Complete delivery address is required.",
      };
    }
  }

  return {
    valid: true,
  };
};

/**
 * Convert an address into the order snapshot format.
 */
const normalizeShippingAddress = (
  address
) => {
  return {
    fullName:
      String(address.fullName || "").trim(),

    phone:
      String(address.phone || "").trim(),

    addressLine1:
      String(
        address.addressLine1 || ""
      ).trim(),

    addressLine2:
      String(
        address.addressLine2 || ""
      ).trim(),

    city:
      String(address.city || "").trim(),

    state:
      String(address.state || "").trim(),

    postalCode:
      String(
        address.postalCode || ""
      ).trim(),

    country:
      String(
        address.country || "India"
      ).trim() || "India",
  };
};

/**
 * Resolve shipping address.
 *
 * Checkout may provide:
 *
 * 1. savedAddressId
 *
 * OR
 *
 * 2. shippingAddress object
 */
const resolveShippingAddress = async (
  userId,
  savedAddressId,
  shippingAddress,
  session
) => {
  if (savedAddressId) {
    const user = await User.findById(
      userId
    )
      .select("addresses")
      .session(session);

    if (!user) {
      throw new Error(
        "USER_NOT_FOUND"
      );
    }

    const savedAddress =
      user.addresses.id(
        savedAddressId
      );

    if (!savedAddress) {
      throw new Error(
        "ADDRESS_NOT_FOUND"
      );
    }

    return normalizeShippingAddress(
      savedAddress
    );
  }

  const validation =
    validateShippingAddress(
      shippingAddress
    );

  if (!validation.valid) {
    const error = new Error(
      validation.message
    );

    error.code =
      "INVALID_ADDRESS";

    throw error;
  }

  return normalizeShippingAddress(
    shippingAddress
  );
};

/**
 * POST /api/orders
 *
 * Place an order from the current user's cart.
 *
 * Body example using saved address:
 *
 * {
 *   "savedAddressId": "...",
 *   "paymentMethod": "cod",
 *   "customerNote": ""
 * }
 *
 * OR manual address:
 *
 * {
 *   "shippingAddress": {
 *     "fullName": "...",
 *     "phone": "...",
 *     "addressLine1": "...",
 *     "addressLine2": "",
 *     "city": "...",
 *     "state": "...",
 *     "postalCode": "...",
 *     "country": "India"
 *   },
 *   "paymentMethod": "upi"
 * }
 */
const placeOrder = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    const {
      savedAddressId,
      shippingAddress,
      paymentMethod,
      customerNote = "",
    } = req.body;

    const allowedPaymentMethods = [
      "cod",
      "upi",
      "card",
    ];

    if (
      !paymentMethod ||
      !allowedPaymentMethods.includes(
        String(
          paymentMethod
        ).toLowerCase()
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please select a valid payment method.",
      });
    }

    const normalizedPaymentMethod =
      String(
        paymentMethod
      ).toLowerCase();

    let createdOrder = null;

    await session.withTransaction(
      async () => {
        const cart =
          await Cart.findOne({
            user: req.user._id,
          }).session(session);

        if (
          !cart ||
          cart.items.length === 0
        ) {
          const error =
            new Error(
              "CART_EMPTY"
            );

          throw error;
        }

        const resolvedAddress =
          await resolveShippingAddress(
            req.user._id,
            savedAddressId,
            shippingAddress,
            session
          );

        const orderItems = [];

        let subtotal = 0;
        let totalItems = 0;

        /**
         * Validate every cart item against
         * current product data.
         */
        for (const cartItem of cart.items) {
          const product =
            await Product.findOne({
              _id:
                cartItem.product,
              isActive: true,
            }).session(session);

          if (!product) {
            const error =
              new Error(
                "PRODUCT_UNAVAILABLE"
              );

            error.productId =
              cartItem.product;

            throw error;
          }

          if (
            product.stock <
            cartItem.quantity
          ) {
            const error =
              new Error(
                "INSUFFICIENT_STOCK"
              );

            error.productName =
              product.name;

            error.availableStock =
              product.stock;

            throw error;
          }

          const unitPrice =
            getProductPrice(
              product
            );

          const totalPrice =
            Number(
              (
                unitPrice *
                cartItem.quantity
              ).toFixed(2)
            );

          orderItems.push({
            product:
              product._id,

            name:
              product.name,

            sku:
              product.sku,

            image:
              product.images?.[0]
                ?.url || "",

            quantity:
              cartItem.quantity,

            unitPrice,

            totalPrice,
          });

          subtotal +=
            totalPrice;

          totalItems +=
            cartItem.quantity;
        }

        subtotal =
          Number(
            subtotal.toFixed(2)
          );

        /**
         * Shipping policy:
         *
         * ₹500 or above:
         * Free delivery
         *
         * Below ₹500:
         * ₹50 delivery charge
         */
        const shippingCharge =
          subtotal >= 500
            ? 0
            : 50;

        /**
         * College project:
         * tax currently included in product price.
         */
        const taxAmount = 0;

        /**
         * Coupon system can be added later
         * using this already-supported field.
         */
        const discountAmount = 0;

        const totalAmount =
          Number(
            Math.max(
              subtotal +
                shippingCharge +
                taxAmount -
                discountAmount,
              0
            ).toFixed(2)
          );

        const orderNumber =
          await generateUniqueOrderNumber(
            session
          );

        const isOnlinePayment =
          normalizedPaymentMethod ===
            "upi" ||
          normalizedPaymentMethod ===
            "card";

        const payment = {
          method:
            normalizedPaymentMethod,

          status:
            isOnlinePayment
              ? "paid"
              : "pending",

          transactionId:
            isOnlinePayment
              ? generateTransactionId()
              : "",

          paidAt:
            isOnlinePayment
              ? new Date()
              : null,

          refundedAt: null,
        };

        const estimatedDeliveryDate =
          new Date();

        estimatedDeliveryDate.setDate(
          estimatedDeliveryDate.getDate() +
            5
        );

        const orders =
          await Order.create(
            [
              {
                orderNumber,

                user:
                  req.user._id,

                items:
                  orderItems,

                shippingAddress:
                  resolvedAddress,

                payment,

                subtotal,

                shippingCharge,

                taxAmount,

                discountAmount,

                totalAmount,

                totalItems,

                orderStatus:
                  "placed",

                customerNote:
                  String(
                    customerNote ||
                      ""
                  ).trim(),

                estimatedDeliveryDate,
              },
            ],
            {
              session,
            }
          );

        createdOrder =
          orders[0];

        /**
         * Deduct stock and increase sales count.
         *
         * Conditional update protects against
         * overselling if multiple users order
         * the same product simultaneously.
         */
        for (const item of orderItems) {
          const result =
            await Product.updateOne(
              {
                _id:
                  item.product,

                isActive: true,

                stock: {
                  $gte:
                    item.quantity,
                },
              },
              {
                $inc: {
                  stock:
                    -item.quantity,

                  soldCount:
                    item.quantity,
                },
              },
              {
                session,
              }
            );

          if (
            result.modifiedCount !==
            1
          ) {
            const error =
              new Error(
                "STOCK_CHANGED"
              );

            error.productName =
              item.name;

            throw error;
          }
        }

        /**
         * Empty cart after successful order.
         */
        cart.items = [];
        cart.updatedFromClientAt =
          new Date();

        await cart.save({
          session,
        });
      }
    );

    if (!createdOrder) {
      throw new Error(
        "ORDER_NOT_CREATED"
      );
    }

    const order =
      await Order.findById(
        createdOrder._id
      ).populate({
        path: "items.product",
        select:
          "name slug images category brand isActive",
      });

    return res.status(201).json({
      success: true,
      message:
        "Order placed successfully.",
      order,
    });
  } catch (error) {
    if (
      error.message ===
      "CART_EMPTY"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Your cart is empty.",
      });
    }

    if (
      error.message ===
      "USER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "User account not found.",
      });
    }

    if (
      error.message ===
      "ADDRESS_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Selected delivery address was not found.",
      });
    }

    if (
      error.code ===
      "INVALID_ADDRESS"
    ) {
      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    if (
      error.message ===
      "PRODUCT_UNAVAILABLE"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "One or more products in your cart are no longer available.",
      });
    }

    if (
      error.message ===
      "INSUFFICIENT_STOCK"
    ) {
      return res.status(400).json({
        success: false,
        message:
          `${error.productName} has only ${error.availableStock} item(s) available.`,
      });
    }

    if (
      error.message ===
      "STOCK_CHANGED"
    ) {
      return res.status(409).json({
        success: false,
        message:
          `Stock for ${error.productName} changed during checkout. Please review your cart and try again.`,
      });
    }

    if (
      error?.name ===
      "ValidationError"
    ) {
      const firstError =
        Object.values(
          error.errors
        )[0];

      return res.status(400).json({
        success: false,
        message:
          firstError?.message ||
          "Invalid order information.",
      });
    }

    console.error(
      "Place order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to place your order right now.",
    });
  } finally {
    await session.endSession();
  }
};

/**
 * GET /api/orders
 *
 * Get current user's order history.
 *
 * Supports:
 * ?page=1
 * ?limit=10
 * ?status=delivered
 */
const getMyOrders = async (
  req,
  res
) => {
  try {
    let page =
      Number(
        req.query.page
      ) || 1;

    let limit =
      Number(
        req.query.limit
      ) || 10;

    if (page < 1) {
      page = 1;
    }

    if (limit < 1) {
      limit = 10;
    }

    if (limit > 50) {
      limit = 50;
    }

    const filter = {
      user: req.user._id,
    };

    if (req.query.status) {
      filter.orderStatus =
        String(
          req.query.status
        ).trim();
    }

    const skip =
      (page - 1) * limit;

    const [
      orders,
      totalOrders,
    ] =
      await Promise.all([
        Order.find(filter)
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit),

        Order.countDocuments(
          filter
        ),
      ]);

    const totalPages =
      Math.max(
        Math.ceil(
          totalOrders / limit
        ),
        1
      );

    return res.status(200).json({
      success: true,

      orders,

      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
        hasNextPage:
          page < totalPages,
        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get my orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load your orders.",
    });
  }
};

/**
 * GET /api/orders/:identifier
 *
 * Identifier can be:
 * - MongoDB order ID
 * - NovaCart order number
 */
const getMyOrderDetails = async (
  req,
  res
) => {
  try {
    const identifier =
      String(
        req.params.identifier ||
          ""
      ).trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message:
          "Order identifier is required.",
      });
    }

    let order = null;

    if (
      mongoose.Types.ObjectId.isValid(
        identifier
      )
    ) {
      order =
        await Order.findOne({
          _id:
            identifier,

          user:
            req.user._id,
        }).populate({
          path:
            "items.product",

          select:
            "name slug images category brand isActive",
        });
    }

    if (!order) {
      order =
        await Order.findOne({
          orderNumber:
            identifier.toUpperCase(),

          user:
            req.user._id,
        }).populate({
          path:
            "items.product",

          select:
            "name slug images category brand isActive",
        });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "Get order details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load order details.",
    });
  }
};

/**
 * PATCH /api/orders/:identifier/cancel
 *
 * Cancel an eligible customer order.
 *
 * Body:
 * {
 *   "reason": "Changed my mind"
 * }
 */
const cancelOrder = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    const identifier =
      String(
        req.params.identifier ||
          ""
      ).trim();

    const reason =
      String(
        req.body.reason ||
          "Cancelled by customer."
      ).trim();

    let cancelledOrderId =
      null;

    await session.withTransaction(
      async () => {
        const filter = {
          user:
            req.user._id,
        };

        if (
          mongoose.Types.ObjectId.isValid(
            identifier
          )
        ) {
          filter._id =
            identifier;
        } else {
          filter.orderNumber =
            identifier.toUpperCase();
        }

        const order =
          await Order.findOne(
            filter
          ).session(session);

        if (!order) {
          throw new Error(
            "ORDER_NOT_FOUND"
          );
        }

        if (
          !order.canBeCancelled()
        ) {
          throw new Error(
            "CANNOT_CANCEL"
          );
        }

        /**
         * Restore product stock.
         */
        for (const item of order.items) {
          await Product.updateOne(
            {
              _id:
                item.product,
            },
            {
              $inc: {
                stock:
                  item.quantity,

                soldCount:
                  -item.quantity,
              },
            },
            {
              session,
            }
          );

          /**
           * Ensure soldCount never falls
           * below zero.
           */
          await Product.updateOne(
            {
              _id:
                item.product,

              soldCount: {
                $lt: 0,
              },
            },
            {
              $set: {
                soldCount: 0,
              },
            },
            {
              session,
            }
          );
        }

        order.cancellationReason =
          reason;

        order.cancelledAt =
          new Date();

        order.addStatusHistory(
          "cancelled",
          "Order cancelled by customer."
        );

        /**
         * Demo online payments are marked
         * refunded immediately after cancellation.
         */
        if (
          order.payment.status ===
          "paid"
        ) {
          order.payment.status =
            "refunded";

          order.payment.refundedAt =
            new Date();
        }

        await order.save({
          session,
        });

        cancelledOrderId =
          order._id;
      }
    );

    const order =
      await Order.findById(
        cancelledOrderId
      ).populate({
        path:
          "items.product",

        select:
          "name slug images category brand isActive",
      });

    return res.status(200).json({
      success: true,
      message:
        "Order cancelled successfully.",
      order,
    });
  } catch (error) {
    if (
      error.message ===
      "ORDER_NOT_FOUND"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    if (
      error.message ===
      "CANNOT_CANCEL"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This order can no longer be cancelled.",
      });
    }

    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to cancel this order.",
    });
  } finally {
    await session.endSession();
  }
};

/**
 * GET /api/orders/:identifier/tracking
 *
 * Return order tracking information only.
 */
const getOrderTracking = async (
  req,
  res
) => {
  try {
    const identifier =
      String(
        req.params.identifier ||
          ""
      ).trim();

    const filter = {
      user:
        req.user._id,
    };

    if (
      mongoose.Types.ObjectId.isValid(
        identifier
      )
    ) {
      filter._id =
        identifier;
    } else {
      filter.orderNumber =
        identifier.toUpperCase();
    }

    const order =
      await Order.findOne(
        filter
      ).select(
        "orderNumber orderStatus statusHistory estimatedDeliveryDate deliveredAt cancelledAt createdAt"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,

      tracking: {
        orderNumber:
          order.orderNumber,

        orderStatus:
          order.orderStatus,

        statusHistory:
          order.statusHistory,

        estimatedDeliveryDate:
          order.estimatedDeliveryDate,

        deliveredAt:
          order.deliveredAt,

        cancelledAt:
          order.cancelledAt,

        orderedAt:
          order.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Order tracking error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load order tracking.",
    });
  }
};

export {
  placeOrder,
  getMyOrders,
  getMyOrderDetails,
  cancelOrder,
  getOrderTracking,
};