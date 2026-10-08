import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Address sub-schema
 *
 * A user can save multiple delivery addresses.
 * This will be reused later during checkout and order creation.
 */
const addressSchema = new mongoose.Schema(
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

    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      default: "Home",
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: true,
  }
);

/**
 * NovaCart User Schema
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters."],
      maxlength: [100, "Name cannot exceed 100 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 150,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address.",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [6, "Password must contain at least 6 characters."],
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      default: "",
      maxlength: 20,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },

    addresses: {
      type: [addressSchema],
      default: [],
    },

    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Automatically hash password before saving.
 *
 * The password is only hashed when it is newly created
 * or has been changed.
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);

  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare login password with stored hashed password.
 *
 * Usage:
 *
 * const isMatch = await user.comparePassword(password);
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Ensure only one saved address is marked as default.
 */
userSchema.pre("save", function () {
  if (!this.isModified("addresses")) {
    return;
  }

  const defaultAddresses = this.addresses.filter(
    (address) => address.isDefault
  );

  if (defaultAddresses.length > 1) {
    const lastDefaultAddress =
      defaultAddresses[defaultAddresses.length - 1];

    this.addresses.forEach((address) => {
      address.isDefault =
        address._id.toString() === lastDefaultAddress._id.toString();
    });
  }

  if (
    this.addresses.length > 0 &&
    !this.addresses.some((address) => address.isDefault)
  ) {
    this.addresses[0].isDefault = true;
  }
});

/**
 * Remove sensitive/internal fields when a user object
 * is converted to JSON and returned through the API.
 */
userSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;

    return ret;
  },
});

/**
 * MongoDB indexes
 */
userSchema.index({ createdAt: -1 });

const User =
  mongoose.models.User || mongoose.model("User", userSchema);

export default User;