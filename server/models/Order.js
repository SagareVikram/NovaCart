import mongoose from "mongoose";

/**
 * ============================================================
 * ORDER ITEM SCHEMA
 * ============================================================
 *
 * Snapshot of product details at the time of order.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 80,
    },

    image: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Order quantity must be at least 1."],
    },

    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative."],
    },

    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Item total cannot be negative."],
    },
  },
  {
    _id: false,
  }
);


/**
 * ============================================================
 * SHIPPING ADDRESS SNAPSHOT
 * ============================================================
 */
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    addressLine2: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },

    country: {
      type: String,
      required: true,
      trim: true,
      default: "India",
      maxlength: 100,
    },
  },
  {
    _id: false,
  }
);


/**
 * ============================================================
 * PAYMENT SCHEMA
 * ============================================================
 */
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,

      enum: [
        "cod",
        "upi",
        "card",
      ],

      required: true,
    },

    status: {
      type: String,

      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],

      default: "pending",
    },

    transactionId: {
      type: String,
      trim: true,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  }
);


/**
 * ============================================================
 * ORDER STATUS HISTORY
 * ============================================================
 */
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,

      enum: [
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
    },

    message: {
      type: String,
      trim: true,
      maxlength: 250,
      default: "",
    },

    changedAt: {
      type: Date,
      default: Date.now,
    },

    /**
     * Who changed the status.
     *
     * Can be:
     * admin
     * delivery_agent
     */
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    changedByRole: {
      type: String,

      enum: [
        "admin",
        "delivery_agent",
        "system",
      ],

      default: "system",
    },
  },
  {
    _id: false,
  }
);


/**
 * ============================================================
 * DELIVERY DETAILS
 * ============================================================
 *
 * These fields are used by the delivery-agent module.
 */
const deliverySchema = new mongoose.Schema(
  {
    /**
     * Assigned delivery agent.
     */
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    /**
     * When admin assigned the order.
     */
    assignedAt: {
      type: Date,
      default: null,
    },

    /**
     * When agent accepted/started handling it.
     */
    acceptedAt: {
      type: Date,
      default: null,
    },

    /**
     * When the shipment was marked shipped.
     */
    shippedAt: {
      type: Date,
      default: null,
    },

    /**
     * When marked out for delivery.
     */
    outForDeliveryAt: {
      type: Date,
      default: null,
    },

    /**
     * Delivery-agent note.
     */
    deliveryNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    /**
     * Optional proof text/reference for future use.
     *
     * Later we can store:
     * - OTP confirmation
     * - receiver name
     * - proof image URL
     */
    proofOfDelivery: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
  },
  {
    _id: false,
  }
);


/**
 * ============================================================
 * NOVACART ORDER SCHEMA
 * ============================================================
 */
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return (
            Array.isArray(items) &&
            items.length > 0
          );
        },

        message:
          "An order must contain at least one product.",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    payment: {
      type: paymentSchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    shippingCharge: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },

    orderStatus: {
      type: String,

      enum: [
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],

      default: "placed",

      index: true,
    },

    statusHistory: {
      type: [statusHistorySchema],

      default: () => [
        {
          status: "placed",
          message:
            "Order placed successfully.",
          changedAt:
            new Date(),
          changedBy:
            null,
          changedByRole:
            "system",
        },
      ],
    },

    /**
     * Delivery-agent information.
     */
    delivery: {
      type: deliverySchema,

      default: () => ({
        agent: null,
        assignedAt: null,
        acceptedAt: null,
        shippedAt: null,
        outForDeliveryAt: null,
        deliveryNote: "",
        proofOfDelivery: "",
      }),
    },

    customerNote: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    adminNote: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    estimatedDeliveryDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);


/**
 * ============================================================
 * GENERATE ORDER NUMBER
 * ============================================================
 *
 * Example:
 * NOVA-20261014-AB12CD
 */
orderSchema.statics.generateOrderNumber =
  function () {
    const date =
      new Date();

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        date.getDate()
      ).padStart(
        2,
        "0"
      );

    const randomPart =
      Math.random()
        .toString(36)
        .substring(
          2,
          8
        )
        .toUpperCase();

    return `NOVA-${year}${month}${day}-${randomPart}`;
  };


/**
 * ============================================================
 * CALCULATE ORDER TOTALS
 * ============================================================
 */
orderSchema.pre(
  "validate",
  function () {
    if (
      !Array.isArray(
        this.items
      )
    ) {
      return;
    }

    let subtotal = 0;
    let totalItems = 0;

    this.items.forEach(
      (item) => {
        item.totalPrice =
          Number(
            (
              item.unitPrice *
              item.quantity
            ).toFixed(2)
          );

        subtotal +=
          item.totalPrice;

        totalItems +=
          item.quantity;
      }
    );

    this.subtotal =
      Number(
        subtotal.toFixed(2)
      );

    this.totalItems =
      totalItems;

    const shippingCharge =
      Number(
        this.shippingCharge
      ) || 0;

    const taxAmount =
      Number(
        this.taxAmount
      ) || 0;

    const discountAmount =
      Number(
        this.discountAmount
      ) || 0;

    const calculatedTotal =
      this.subtotal +
      shippingCharge +
      taxAmount -
      discountAmount;

    this.totalAmount =
      Number(
        Math.max(
          calculatedTotal,
          0
        ).toFixed(2)
      );
  }
);


/**
 * ============================================================
 * STATUS TIMESTAMP SYNCHRONIZATION
 * ============================================================
 */
orderSchema.pre(
  "save",
  function () {
    if (
      !this.isModified(
        "orderStatus"
      )
    ) {
      return;
    }

    /**
     * SHIPPED
     */
    if (
      this.orderStatus ===
      "shipped"
    ) {
      this.delivery =
        this.delivery || {};

      this.delivery.shippedAt =
        this.delivery.shippedAt ||
        new Date();
    }

    /**
     * OUT FOR DELIVERY
     */
    if (
      this.orderStatus ===
      "out_for_delivery"
    ) {
      this.delivery =
        this.delivery || {};

      this.delivery
        .outForDeliveryAt =
        this.delivery
          .outForDeliveryAt ||
        new Date();
    }

    /**
     * DELIVERED
     */
    if (
      this.orderStatus ===
      "delivered"
    ) {
      this.deliveredAt =
        this.deliveredAt ||
        new Date();

      /**
       * COD becomes paid automatically
       * after successful delivery.
       */
      if (
        this.payment.method ===
        "cod"
      ) {
        this.payment.status =
          "paid";

        this.payment.paidAt =
          this.payment.paidAt ||
          new Date();
      }
    }

    /**
     * CANCELLED
     */
    if (
      this.orderStatus ===
      "cancelled"
    ) {
      this.cancelledAt =
        this.cancelledAt ||
        new Date();
    }
  }
);


/**
 * ============================================================
 * ADD STATUS HISTORY
 * ============================================================
 *
 * Existing admin controller can still call:
 *
 * order.addStatusHistory(
 *   "shipped",
 *   "Order shipped."
 * );
 *
 * Delivery controller can call:
 *
 * order.addStatusHistory(
 *   "out_for_delivery",
 *   "Order is out for delivery.",
 *   req.user._id,
 *   "delivery_agent"
 * );
 */
orderSchema.methods.addStatusHistory =
  function (
    status,
    message = "",
    changedBy = null,
    changedByRole = "system"
  ) {
    this.statusHistory.push({
      status,
      message,
      changedAt:
        new Date(),
      changedBy,
      changedByRole,
    });

    this.orderStatus =
      status;
  };


/**
 * ============================================================
 * ASSIGN DELIVERY AGENT
 * ============================================================
 */
orderSchema.methods.assignDeliveryAgent =
  function (
    agentId
  ) {
    this.delivery =
      this.delivery || {};

    this.delivery.agent =
      agentId;

    this.delivery.assignedAt =
      new Date();

    this.delivery.acceptedAt =
      null;
  };


/**
 * ============================================================
 * REMOVE DELIVERY AGENT
 * ============================================================
 */
orderSchema.methods.removeDeliveryAgent =
  function () {
    this.delivery =
      this.delivery || {};

    this.delivery.agent =
      null;

    this.delivery.assignedAt =
      null;

    this.delivery.acceptedAt =
      null;
  };


/**
 * ============================================================
 * CHECK WHETHER ORDER HAS DELIVERY AGENT
 * ============================================================
 */
orderSchema.methods.hasDeliveryAgent =
  function () {
    return Boolean(
      this.delivery?.agent
    );
  };


/**
 * ============================================================
 * CUSTOMER CANCELLATION CHECK
 * ============================================================
 */
orderSchema.methods.canBeCancelled =
  function () {
    return [
      "placed",
      "confirmed",
      "processing",
    ].includes(
      this.orderStatus
    );
  };


/**
 * ============================================================
 * DELIVERY AGENT STATUS CHECK
 * ============================================================
 *
 * Delivery agents should not be able to:
 * - place
 * - confirm
 * - cancel
 *
 * They should handle only delivery-related
 * status transitions.
 */
orderSchema.methods.canDeliveryAgentUpdate =
  function () {
    return [
      "processing",
      "shipped",
      "out_for_delivery",
    ].includes(
      this.orderStatus
    );
  };


/**
 * ============================================================
 * JSON CLEANUP
 * ============================================================
 */
orderSchema.set(
  "toJSON",
  {
    transform: (
      doc,
      ret
    ) => {
      delete ret.__v;

      return ret;
    },
  }
);


/**
 * ============================================================
 * INDEXES
 * ============================================================
 */
orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

orderSchema.index({
  "payment.status": 1,
  createdAt: -1,
});

orderSchema.index({
  "delivery.agent": 1,
  orderStatus: 1,
  createdAt: -1,
});

orderSchema.index({
  createdAt: -1,
});


/**
 * ============================================================
 * MODEL
 * ============================================================
 */
const Order =
  mongoose.models.Order ||
  mongoose.model(
    "Order",
    orderSchema
  );

export default Order;