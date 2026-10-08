import mongoose from "mongoose";

/**
 * Individual cart item schema.
 *
 * We keep:
 * - product reference
 * - quantity
 * - price snapshot
 *
 * The snapshot is useful because product prices can change later,
 * but the cart should still know what price was last calculated.
 */
const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: [1, "Cart quantity must be at least 1."],
      default: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative."],
    },
  },
  {
    _id: false,
  }
);

/**
 * NovaCart Cart Schema
 *
 * Each user has one persistent cart.
 */
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },

    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalItems: {
      type: Number,
      default: 0,
      min: 0,
    },

    updatedFromClientAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Recalculate subtotal and total item quantity automatically
 * before saving the cart.
 */
cartSchema.pre("save", function () {
  let subtotal = 0;
  let totalItems = 0;

  for (const item of this.items) {
    subtotal += item.unitPrice * item.quantity;
    totalItems += item.quantity;
  }

  this.subtotal = Number(subtotal.toFixed(2));
  this.totalItems = totalItems;
});

/**
 * Prevent duplicate products inside the same cart.
 *
 * If the same product somehow appears multiple times,
 * quantities are combined automatically.
 */
cartSchema.pre("save", function () {
  const mergedItems = new Map();

  for (const item of this.items) {
    const productId = item.product.toString();

    if (mergedItems.has(productId)) {
      const existingItem = mergedItems.get(productId);

      existingItem.quantity += item.quantity;

      // Keep the most recently supplied price snapshot.
      existingItem.unitPrice = item.unitPrice;
    } else {
      mergedItems.set(productId, {
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
    }
  }

  this.items = Array.from(mergedItems.values());
});

/**
 * Virtual value for easier frontend rendering.
 */
cartSchema.virtual("isEmpty").get(function () {
  return this.items.length === 0;
});

/**
 * Include virtual values in JSON API responses.
 */
cartSchema.set("toJSON", {
  virtuals: true,

  transform: (doc, ret) => {
    delete ret.__v;

    return ret;
  },
});

cartSchema.set("toObject", {
  virtuals: true,
});

/**
 * Avoid model overwrite errors during development.
 */
const Cart =
  mongoose.models.Cart ||
  mongoose.model("Cart", cartSchema);

export default Cart;