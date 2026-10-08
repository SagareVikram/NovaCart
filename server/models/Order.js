import mongoose from "mongoose";

/**
 * Order Item Schema
 *
 * We store a snapshot of important product information.
 * This is necessary because the original product may later:
 * - change price
 * - change name
 * - be deactivated
 * - be deleted
 *
 * Existing orders must still remain readable.
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
 * Shipping Address Snapshot
 *
 * The address is copied into the order instead of referencing
 * the user's saved address directly.
 *
 * This ensures an old order still shows the original address
 * even if the user edits or deletes that address later.
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
 * Payment Details
 *
 * NovaCart college project will initially support demo payments:
 * - Cash on Delivery
 * - UPI
 * - Card
 *
 * The schema is also flexible enough for a real payment gateway later.
 */
const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["cod", "upi", "card"],
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
 * Order Status History
 *
 * This allows us to display:
 *
 * Order Placed
 * Processing
 * Shipped
 * Delivered
 *
 * along with timestamps.
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
  },
  {
    _id: false,
  }
);

/**
 * NovaCart Order Schema
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
          return Array.isArray(items) && items.length > 0;
        },

        message: "An order must contain at least one product.",
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
          message: "Order placed successfully.",
          changedAt: new Date(),
        },
      ],
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
 * Generate an order number.
 *
 * Example:
 * NOVA-20261007-AB12CD
 */
orderSchema.statics.generateOrderNumber = function () {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  const randomPart = Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase();

  return `NOVA-${year}${month}${day}-${randomPart}`;
};

/**
 * Automatically calculate item totals and main order totals.
 */
orderSchema.pre("validate", function () {
  if (!Array.isArray(this.items)) {
    return;
  }

  let subtotal = 0;
  let totalItems = 0;

  this.items.forEach((item) => {
    item.totalPrice = Number(
      (item.unitPrice * item.quantity).toFixed(2)
    );

    subtotal += item.totalPrice;

    totalItems += item.quantity;
  });

  this.subtotal = Number(subtotal.toFixed(2));

  this.totalItems = totalItems;

  const shippingCharge =
    Number(this.shippingCharge) || 0;

  const taxAmount =
    Number(this.taxAmount) || 0;

  const discountAmount =
    Number(this.discountAmount) || 0;

  const calculatedTotal =
    this.subtotal +
    shippingCharge +
    taxAmount -
    discountAmount;

  this.totalAmount = Number(
    Math.max(calculatedTotal, 0).toFixed(2)
  );
});

/**
 * Keep important timestamps synchronized with status.
 */
orderSchema.pre("save", function () {
  if (!this.isModified("orderStatus")) {
    return;
  }

  if (this.orderStatus === "delivered") {
    this.deliveredAt =
      this.deliveredAt || new Date();

    if (this.payment.method === "cod") {
      this.payment.status = "paid";

      this.payment.paidAt =
        this.payment.paidAt || new Date();
    }
  }

  if (this.orderStatus === "cancelled") {
    this.cancelledAt =
      this.cancelledAt || new Date();
  }
});

/**
 * Add an order status entry safely.
 *
 * Controllers can call:
 *
 * order.addStatusHistory(
 *   "shipped",
 *   "Your order has been shipped."
 * );
 */
orderSchema.methods.addStatusHistory = function (
  status,
  message = ""
) {
  this.statusHistory.push({
    status,
    message,
    changedAt: new Date(),
  });

  this.orderStatus = status;
};

/**
 * Check whether a customer is still allowed
 * to cancel this order.
 */
orderSchema.methods.canBeCancelled = function () {
  return [
    "placed",
    "confirmed",
    "processing",
  ].includes(this.orderStatus);
};

/**
 * API JSON cleanup.
 */
orderSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;

    return ret;
  },
});

/**
 * Useful indexes for user and admin order pages.
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
  createdAt: -1,
});

/**
 * Avoid model overwrite errors during development.
 */
const Order =
  mongoose.models.Order ||
  mongoose.model("Order", orderSchema);

export default Order;