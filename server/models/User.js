import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * ============================================================
 * ADDRESS SCHEMA
 * ============================================================
 *
 * Customers can store multiple delivery addresses.
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
      enum: [
        "Home",
        "Work",
        "Other",
      ],
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
 * ============================================================
 * DELIVERY AGENT PROFILE
 * ============================================================
 *
 * Only users having:
 *
 * role = "delivery_agent"
 *
 * will use these fields.
 */
const deliveryAgentProfileSchema =
  new mongoose.Schema(
    {
      employeeId: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
        maxlength: 50,
      },

      vehicleNumber: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
        maxlength: 30,
      },

      deliveryArea: {
        type: String,
        trim: true,
        default: "",
        maxlength: 150,
      },

      isAvailable: {
        type: Boolean,
        default: true,
      },

      joinedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: false,
    }
  );


/**
 * ============================================================
 * USER SCHEMA
 * ============================================================
 */
const userSchema =
  new mongoose.Schema(
    {
      name: {
        type: String,
        required: [
          true,
          "Name is required.",
        ],
        trim: true,
        minlength: [
          2,
          "Name must contain at least 2 characters.",
        ],
        maxlength: [
          100,
          "Name cannot exceed 100 characters.",
        ],
      },

      email: {
        type: String,
        required: [
          true,
          "Email is required.",
        ],
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
        required: [
          true,
          "Password is required.",
        ],
        minlength: [
          6,
          "Password must contain at least 6 characters.",
        ],
        select: false,
      },

      phone: {
        type: String,
        trim: true,
        default: "",
        maxlength: 20,
      },

      /**
       * NovaCart roles:
       *
       * user
       *   Normal customer
       *
       * admin
       *   Administrator
       *
       * delivery_agent
       *   Delivery staff
       */
      role: {
        type: String,

        enum: [
          "user",
          "admin",
          "delivery_agent",
        ],

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

      /**
       * Customer saved addresses.
       *
       * Delivery agents normally won't use
       * this field, but keeping it here
       * preserves the existing structure.
       */
      addresses: {
        type: [
          addressSchema,
        ],

        default: [],
      },

      /**
       * Extra information used only
       * by delivery agents.
       */
      deliveryAgentProfile: {
        type:
          deliveryAgentProfileSchema,

        default: () => ({
          employeeId: "",
          vehicleNumber: "",
          deliveryArea: "",
          isAvailable: true,
          joinedAt: new Date(),
        }),
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
 * ============================================================
 * PASSWORD HASHING
 * ============================================================
 */
userSchema.pre(
  "save",
  async function () {
    if (
      !this.isModified(
        "password"
      )
    ) {
      return;
    }

    const salt =
      await bcrypt.genSalt(
        12
      );

    this.password =
      await bcrypt.hash(
        this.password,
        salt
      );
  }
);


/**
 * ============================================================
 * PASSWORD COMPARISON
 * ============================================================
 */
userSchema.methods.comparePassword =
  async function (
    candidatePassword
  ) {
    return bcrypt.compare(
      candidatePassword,
      this.password
    );
  };


/**
 * ============================================================
 * DEFAULT ADDRESS CONTROL
 * ============================================================
 */
userSchema.pre(
  "save",
  function () {
    if (
      !this.isModified(
        "addresses"
      )
    ) {
      return;
    }

    const defaultAddresses =
      this.addresses.filter(
        (address) =>
          address.isDefault
      );

    if (
      defaultAddresses.length >
      1
    ) {
      const lastDefaultAddress =
        defaultAddresses[
          defaultAddresses.length -
            1
        ];

      this.addresses.forEach(
        (address) => {
          address.isDefault =
            address._id.toString() ===
            lastDefaultAddress._id.toString();
        }
      );
    }

    if (
      this.addresses.length >
        0 &&
      !this.addresses.some(
        (address) =>
          address.isDefault
      )
    ) {
      this.addresses[0]
        .isDefault = true;
    }
  }
);


/**
 * ============================================================
 * DELIVERY AGENT VALIDATION
 * ============================================================
 *
 * Normal customers/admins don't need
 * delivery-agent profile information.
 */
userSchema.pre(
  "validate",
  function () {
    if (
      this.role !==
      "delivery_agent"
    ) {
      return;
    }

    if (
      !this
        .deliveryAgentProfile
    ) {
      this.deliveryAgentProfile =
        {
          employeeId: "",
          vehicleNumber: "",
          deliveryArea: "",
          isAvailable: true,
          joinedAt:
            new Date(),
        };
    }
  }
);


/**
 * ============================================================
 * JSON CLEANUP
 * ============================================================
 */
userSchema.set(
  "toJSON",
  {
    transform: (
      doc,
      ret
    ) => {
      delete ret.password;
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
userSchema.index({
  createdAt: -1,
});

userSchema.index({
  role: 1,
  isActive: 1,
});

userSchema.index({
  "deliveryAgentProfile.employeeId":
    1,
});


/**
 * ============================================================
 * MODEL
 * ============================================================
 */
const User =
  mongoose.models.User ||
  mongoose.model(
    "User",
    userSchema
  );

export default User;