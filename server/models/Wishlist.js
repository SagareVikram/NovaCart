import mongoose from "mongoose";

/**
 * Wishlist item schema.
 *
 * We keep product reference and the date it was added.
 */
const wishlistItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

/**
 * NovaCart Wishlist Schema
 *
 * Each user has one persistent wishlist.
 */
const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    items: {
      type: [wishlistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Prevent duplicate products from being stored
 * inside the same wishlist.
 */
wishlistSchema.pre("save", function () {
  const uniqueItems = new Map();

  for (const item of this.items) {
    const productId = item.product.toString();

    if (!uniqueItems.has(productId)) {
      uniqueItems.set(productId, {
        product: item.product,
        addedAt: item.addedAt || new Date(),
      });
    }
  }

  this.items = Array.from(uniqueItems.values());
});

/**
 * Virtual value for easier frontend handling.
 */
wishlistSchema.virtual("totalItems").get(function () {
  return this.items.length;
});

/**
 * Include virtual values in JSON API responses.
 */
wishlistSchema.set("toJSON", {
  virtuals: true,

  transform: (doc, ret) => {
    delete ret.__v;

    return ret;
  },
});

wishlistSchema.set("toObject", {
  virtuals: true,
});

/**
 * Avoid model overwrite errors during development.
 */
const Wishlist =
  mongoose.models.Wishlist ||
  mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;