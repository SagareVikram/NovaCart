import mongoose from "mongoose";

/**
 * Product image sub-schema
 *
 * We store both URL and Cloudinary publicId so images can
 * be replaced or deleted later without redesigning the model.
 */
const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
      trim: true,
    },

    altText: {
      type: String,
      trim: true,
      default: "",
      maxlength: 150,
    },
  },
  {
    _id: false,
  }
);

/**
 * Product specification sub-schema
 *
 * This keeps product details flexible for different categories:
 * electronics, fashion, accessories, etc.
 */
const specificationSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 250,
    },
  },
  {
    _id: false,
  }
);

/**
 * NovaCart Product Schema
 */
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required."],
      trim: true,
      minlength: [2, "Product name must contain at least 2 characters."],
      maxlength: [180, "Product name cannot exceed 180 characters."],
      index: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    shortDescription: {
      type: String,
      required: [true, "Short description is required."],
      trim: true,
      maxlength: [300, "Short description cannot exceed 300 characters."],
    },

    description: {
      type: String,
      required: [true, "Product description is required."],
      trim: true,
      maxlength: [5000, "Product description cannot exceed 5000 characters."],
    },

    category: {
      type: String,
      required: [true, "Product category is required."],
      trim: true,
      maxlength: 100,
      index: true,
    },

    subCategory: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
      index: true,
    },

    brand: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
      index: true,
    },

    sku: {
      type: String,
      required: [true, "SKU is required."],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 80,
      index: true,
    },

    price: {
      type: Number,
      required: [true, "Product price is required."],
      min: [0, "Product price cannot be negative."],
    },

    discountPrice: {
      type: Number,
      default: null,
      min: [0, "Discount price cannot be negative."],
    },

    stock: {
      type: Number,
      required: [true, "Stock quantity is required."],
      min: [0, "Stock cannot be negative."],
      default: 0,
    },

    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    images: {
      type: [productImageSchema],
      default: [],
      validate: {
        validator: function (images) {
          return images.length <= 6;
        },
        message: "A product can have a maximum of 6 images.",
      },
    },

    specifications: {
      type: [specificationSchema],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
      set: (tags) => {
        if (!Array.isArray(tags)) {
          return [];
        }

        return [
          ...new Set(
            tags
              .map((tag) => String(tag).trim().toLowerCase())
              .filter(Boolean)
          ),
        ];
      },
    },

    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Validate discount price.
 *
 * A discount price must always be lower than the normal price.
 */
productSchema.pre("validate", function () {
  if (
    this.discountPrice !== null &&
    this.discountPrice !== undefined &&
    this.discountPrice >= this.price
  ) {
    this.invalidate(
      "discountPrice",
      "Discount price must be lower than the regular price."
    );
  }
});

/**
 * Clean tags before save.
 */
productSchema.pre("save", function () {
  if (Array.isArray(this.tags)) {
    this.tags = [
      ...new Set(
        this.tags
          .map((tag) => String(tag).trim().toLowerCase())
          .filter(Boolean)
      ),
    ];
  }
});

/**
 * Virtual final selling price.
 *
 * Useful in controllers and frontend APIs.
 */
productSchema.virtual("finalPrice").get(function () {
  if (
    this.discountPrice !== null &&
    this.discountPrice !== undefined &&
    this.discountPrice < this.price
  ) {
    return this.discountPrice;
  }

  return this.price;
});

/**
 * Virtual discount percentage.
 */
productSchema.virtual("discountPercentage").get(function () {
  if (
    this.discountPrice === null ||
    this.discountPrice === undefined ||
    this.discountPrice >= this.price ||
    this.price <= 0
  ) {
    return 0;
  }

  return Math.round(
    ((this.price - this.discountPrice) / this.price) * 100
  );
});

/**
 * Virtual stock status.
 */
productSchema.virtual("stockStatus").get(function () {
  if (this.stock <= 0) {
    return "out_of_stock";
  }

  if (this.stock <= this.lowStockThreshold) {
    return "low_stock";
  }

  return "in_stock";
});

/**
 * Include virtual fields in API JSON responses.
 */
productSchema.set("toJSON", {
  virtuals: true,

  transform: (doc, ret) => {
    delete ret.__v;

    return ret;
  },
});

productSchema.set("toObject", {
  virtuals: true,
});

/**
 * Text search support.
 *
 * Later the product listing API can search by:
 * - product name
 * - description
 * - category
 * - brand
 * - tags
 */
productSchema.index({
  name: "text",
  shortDescription: "text",
  description: "text",
  category: "text",
  brand: "text",
  tags: "text",
});

/**
 * Common listing/filter indexes.
 */
productSchema.index({
  isActive: 1,
  category: 1,
  createdAt: -1,
});

productSchema.index({
  isActive: 1,
  isFeatured: 1,
  createdAt: -1,
});

productSchema.index({
  price: 1,
});

productSchema.index({
  soldCount: -1,
});

/**
 * Avoid model overwrite errors during development reloads.
 */
const Product =
  mongoose.models.Product ||
  mongoose.model("Product", productSchema);

export default Product;