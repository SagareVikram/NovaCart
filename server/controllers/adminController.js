import mongoose from "mongoose";

import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";

import { cloudinary } from "../config/cloudinary.js";

/**
 * Convert product name into URL-friendly slug.
 */
const createSlug = (value = "") => {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

/**
 * Escape text before using it in MongoDB regex.
 */
const escapeRegExp = (value = "") => {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
};

/**
 * Generate unique product slug.
 */
const generateUniqueSlug = async (
  name,
  productId = null
) => {
  const baseSlug =
    createSlug(name) ||
    `product-${Date.now()}`;

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const filter = {
      slug,
    };

    if (productId) {
      filter._id = {
        $ne: productId,
      };
    }

    const existing =
      await Product.exists(filter);

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

/**
 * Parse product specifications.
 */
const parseSpecifications = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        key: String(
          item?.key || ""
        ).trim(),

        value: String(
          item?.value || ""
        ).trim(),
      }))
      .filter(
        (item) =>
          item.key &&
          item.value
      );
  }

  try {
    const parsed =
      JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parseSpecifications(parsed);
  } catch {
    return [];
  }
};

/**
 * Parse tags.
 */
const parseTags = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((tag) =>
        String(tag)
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((tag) =>
      tag
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);
};

/**
 * Parse boolean request values.
 */
const parseBoolean = (
  value,
  defaultValue = false
) => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  if (
    value === true ||
    value === "true" ||
    value === "1" ||
    value === 1
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false" ||
    value === "0" ||
    value === 0
  ) {
    return false;
  }

  return defaultValue;
};

/**
 * Get uploaded Cloudinary images.
 */
const getUploadedImages = (req) => {
  const uploadedFiles = [];

  if (req.file) {
    uploadedFiles.push(req.file);
  }

  if (Array.isArray(req.files)) {
    uploadedFiles.push(...req.files);
  }

  return uploadedFiles
    .filter(Boolean)
    .map((file) => ({
      url:
        file.path ||
        file.secure_url ||
        "",

      publicId:
        file.filename ||
        file.public_id ||
        "",

      altText: "",
    }))
    .filter(
      (image) =>
        image.url &&
        image.publicId
    );
};

/**
 * Delete Cloudinary image safely.
 */
const deleteCloudinaryImage = async (
  publicId
) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(
      publicId
    );
  } catch (error) {
    console.error(
      "Cloudinary delete error:",
      publicId,
      error.message
    );
  }
};

/**
 * GET /api/admin/dashboard
 */
const getDashboardStats = async (
  req,
  res
) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      lowStockProducts,
      revenueResult,
      recentOrders,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({
        role: "user",
      }),

      User.countDocuments({
        role: "user",
        isActive: true,
      }),

      Product.countDocuments(),

      Product.countDocuments({
        isActive: true,
      }),

      Order.countDocuments(),

      Order.countDocuments({
        orderStatus: {
          $in: [
            "placed",
            "confirmed",
            "processing",
          ],
        },
      }),

      Product.countDocuments({
        isActive: true,

        $expr: {
          $lte: [
            "$stock",
            "$lowStockThreshold",
          ],
        },
      }),

      Order.aggregate([
        {
          $match: {
            orderStatus: {
              $ne: "cancelled",
            },
          },
        },

        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum: "$totalAmount",
            },
          },
        },
      ]),

      Order.find()
        .populate(
          "user",
          "name email"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5),

      User.find({
        role: "user",
      })
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .select(
          "name email phone isActive createdAt"
        ),
    ]);

    const totalRevenue =
      revenueResult[0]
        ?.totalRevenue || 0;

    return res.status(200).json({
      success: true,

      stats: {
        users: {
          total: totalUsers,

          active:
            activeUsers,

          inactive:
            totalUsers -
            activeUsers,
        },

        products: {
          total:
            totalProducts,

          active:
            activeProducts,

          inactive:
            totalProducts -
            activeProducts,

          lowStock:
            lowStockProducts,
        },

        orders: {
          total:
            totalOrders,

          pending:
            pendingOrders,
        },

        revenue:
          Number(
            totalRevenue.toFixed(2)
          ),
      },

      recentOrders,
      recentUsers,
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load admin dashboard.",
    });
  }
};

/**
 * GET /api/admin/products
 */
const getAdminProducts = async (
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
      ) || 20;

    if (page < 1) {
      page = 1;
    }

    if (limit < 1) {
      limit = 20;
    }

    if (limit > 100) {
      limit = 100;
    }

    const filter = {};

    if (req.query.search) {
      const search =
        escapeRegExp(
          String(
            req.query.search
          ).trim()
        );

      if (search) {
        filter.$or = [
          {
            name: {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            sku: {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            category: {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            brand: {
              $regex:
                search,
              $options: "i",
            },
          },
        ];
      }
    }

    if (req.query.category) {
      const category =
        escapeRegExp(
          String(
            req.query.category
          ).trim()
        );

      if (category) {
        filter.category = {
          $regex:
            `^${category}$`,
          $options: "i",
        };
      }
    }

    if (
      req.query.status ===
      "active"
    ) {
      filter.isActive = true;
    }

    if (
      req.query.status ===
      "inactive"
    ) {
      filter.isActive = false;
    }

    if (
      req.query.featured ===
      "true"
    ) {
      filter.isFeatured = true;
    }

    if (
      req.query.featured ===
      "false"
    ) {
      filter.isFeatured = false;
    }

    if (
      req.query.stock ===
      "low"
    ) {
      filter.$expr = {
        $lte: [
          "$stock",
          "$lowStockThreshold",
        ],
      };
    }

    if (
      req.query.stock ===
      "out"
    ) {
      filter.stock = 0;
    }

    const sortOptions = {
      newest: {
        createdAt: -1,
      },

      oldest: {
        createdAt: 1,
      },

      price_high: {
        price: -1,
        createdAt: -1,
      },

      price_low: {
        price: 1,
        createdAt: -1,
      },

      stock_high: {
        stock: -1,
        createdAt: -1,
      },

      stock_low: {
        stock: 1,
        createdAt: -1,
      },

      sold_high: {
        soldCount: -1,
        createdAt: -1,
      },
    };

    const sort =
      sortOptions[
        String(
          req.query.sort ||
            "newest"
        ).trim()
      ] ||
      sortOptions.newest;

    const skip =
      (page - 1) *
      limit;

    const [
      products,
      totalProducts,
    ] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),

      Product.countDocuments(
        filter
      ),
    ]);

    const totalPages =
      Math.max(
        Math.ceil(
          totalProducts /
            limit
        ),
        1
      );

    return res.status(200).json({
      success: true,

      products,

      pagination: {
        page,
        limit,
        totalProducts,
        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Admin products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load products.",
    });
  }
};

/**
 * GET /api/admin/products/:productId
 */
const getAdminProductById =
  async (
    req,
    res
  ) => {
    try {
      const product =
        await Product.findById(
          req.params.productId
        );

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            "Product not found.",
        });
      }

      return res.status(200).json({
        success: true,
        product,
      });
    } catch (error) {
      if (
        error?.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid product ID.",
        });
      }

      console.error(
        "Admin product details error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load product.",
      });
    }
  };

/**
 * POST /api/admin/products
 */
const createProduct = async (
  req,
  res
) => {
  try {
    const {
      name,
      shortDescription,
      description,
      category,
      subCategory = "",
      brand = "",
      sku,
      price,
      discountPrice,
      stock,
      lowStockThreshold,
      specifications,
      tags,
      isFeatured,
      isActive,
    } = req.body;

    if (
      !name ||
      !shortDescription ||
      !description ||
      !category ||
      !sku ||
      price === undefined ||
      stock === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, description, category, SKU, price and stock are required.",
      });
    }

    const cleanSku =
      String(sku)
        .trim()
        .toUpperCase();

    const existingSku =
      await Product.exists({
        sku: cleanSku,
      });

    if (existingSku) {
      return res.status(409).json({
        success: false,
        message:
          "A product with this SKU already exists.",
      });
    }

    const slug =
      await generateUniqueSlug(
        name
      );

    const images =
      getUploadedImages(req);

    const numericPrice =
      Number(price);

    const numericStock =
      Number(stock);

    const parsedDiscountPrice =
      discountPrice ===
        undefined ||
      discountPrice ===
        null ||
      discountPrice ===
        ""
        ? null
        : Number(
            discountPrice
          );

    const product =
      await Product.create({
        name:
          String(
            name
          ).trim(),

        slug,

        shortDescription:
          String(
            shortDescription
          ).trim(),

        description:
          String(
            description
          ).trim(),

        category:
          String(
            category
          ).trim(),

        subCategory:
          String(
            subCategory
          ).trim(),

        brand:
          String(
            brand
          ).trim(),

        sku:
          cleanSku,

        price:
          numericPrice,

        discountPrice:
          parsedDiscountPrice,

        stock:
          numericStock,

        lowStockThreshold:
          lowStockThreshold ===
            undefined ||
          lowStockThreshold ===
            ""
            ? 5
            : Number(
                lowStockThreshold
              ),

        images,

        specifications:
          parseSpecifications(
            specifications
          ),

        tags:
          parseTags(tags),

        isFeatured:
          parseBoolean(
            isFeatured,
            false
          ),

        isActive:
          parseBoolean(
            isActive,
            true
          ),
      });

    return res.status(201).json({
      success: true,
      message:
        "Product created successfully.",
      product,
    });
  } catch (error) {
    const uploadedImages =
      getUploadedImages(req);

    for (
      const image
      of uploadedImages
    ) {
      await deleteCloudinaryImage(
        image.publicId
      );
    }

    if (
      error?.code ===
      11000
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Product SKU or slug already exists.",
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
          "Invalid product information.",
      });
    }

    console.error(
      "Create product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create product.",
    });
  }
};

/**
 * PUT /api/admin/products/:productId
 */
const updateProduct = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      const uploadedImages =
        getUploadedImages(req);

      for (
        const image
        of uploadedImages
      ) {
        await deleteCloudinaryImage(
          image.publicId
        );
      }

      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const {
      name,
      shortDescription,
      description,
      category,
      subCategory,
      brand,
      sku,
      price,
      discountPrice,
      stock,
      lowStockThreshold,
      specifications,
      tags,
      isFeatured,
      isActive,
      replaceImages,
    } = req.body;

    if (
      name !==
      undefined
    ) {
      product.name =
        String(
          name
        ).trim();

      product.slug =
        await generateUniqueSlug(
          product.name,
          product._id
        );
    }

    if (
      shortDescription !==
      undefined
    ) {
      product.shortDescription =
        String(
          shortDescription
        ).trim();
    }

    if (
      description !==
      undefined
    ) {
      product.description =
        String(
          description
        ).trim();
    }

    if (
      category !==
      undefined
    ) {
      product.category =
        String(
          category
        ).trim();
    }

    if (
      subCategory !==
      undefined
    ) {
      product.subCategory =
        String(
          subCategory
        ).trim();
    }

    if (
      brand !==
      undefined
    ) {
      product.brand =
        String(
          brand
        ).trim();
    }

    if (
      sku !==
      undefined
    ) {
      const cleanSku =
        String(sku)
          .trim()
          .toUpperCase();

      const existing =
        await Product.exists({
          sku: cleanSku,

          _id: {
            $ne:
              product._id,
          },
        });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "Another product already uses this SKU.",
        });
      }

      product.sku =
        cleanSku;
    }

    if (
      price !==
      undefined
    ) {
      product.price =
        Number(price);
    }

    if (
      discountPrice !==
      undefined
    ) {
      product.discountPrice =
        discountPrice ===
          "" ||
        discountPrice ===
          null
          ? null
          : Number(
              discountPrice
            );
    }

    if (
      stock !==
      undefined
    ) {
      product.stock =
        Number(stock);
    }

    if (
      lowStockThreshold !==
      undefined
    ) {
      product.lowStockThreshold =
        Number(
          lowStockThreshold
        );
    }

    if (
      specifications !==
      undefined
    ) {
      product.specifications =
        parseSpecifications(
          specifications
        );
    }

    if (
      tags !==
      undefined
    ) {
      product.tags =
        parseTags(tags);
    }

    if (
      isFeatured !==
      undefined
    ) {
      product.isFeatured =
        parseBoolean(
          isFeatured,
          product.isFeatured
        );
    }

    if (
      isActive !==
      undefined
    ) {
      product.isActive =
        parseBoolean(
          isActive,
          product.isActive
        );
    }

    const newImages =
      getUploadedImages(req);

    if (
      newImages.length >
      0
    ) {
      const shouldReplace =
        parseBoolean(
          replaceImages,
          false
        );

      if (shouldReplace) {
        const oldImages =
          [...product.images];

        product.images =
          newImages;

        await product.save();

        for (
          const image
          of oldImages
        ) {
          await deleteCloudinaryImage(
            image.publicId
          );
        }

        return res.status(200).json({
          success: true,
          message:
            "Product updated successfully.",
          product,
        });
      }

      const combinedImages =
        [
          ...product.images,
          ...newImages,
        ];

      if (
        combinedImages.length >
        6
      ) {
        for (
          const image
          of newImages
        ) {
          await deleteCloudinaryImage(
            image.publicId
          );
        }

        return res.status(400).json({
          success: false,
          message:
            "A product can have a maximum of 6 images.",
        });
      }

      product.images =
        combinedImages;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Product updated successfully.",
      product,
    });
  } catch (error) {
    if (
      error?.name ===
      "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID.",
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
          "Invalid product information.",
      });
    }

    console.error(
      "Update product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update product.",
    });
  }
};

/**
 * DELETE /api/admin/products/:productId/images/:publicId
 */
const deleteProductImage = async (
  req,
  res
) => {
  try {
    const {
      productId,
      publicId,
    } = req.params;

    const decodedPublicId =
      decodeURIComponent(
        publicId
      );

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const imageIndex =
      product.images.findIndex(
        (image) =>
          image.publicId ===
          decodedPublicId
      );

    if (
      imageIndex === -1
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product image not found.",
      });
    }

    const [
      removedImage,
    ] = product.images.splice(
      imageIndex,
      1
    );

    await product.save();

    await deleteCloudinaryImage(
      removedImage.publicId
    );

    return res.status(200).json({
      success: true,
      message:
        "Product image deleted successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Delete product image error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete product image.",
    });
  }
};

/**
 * PATCH /api/admin/products/:productId/status
 */
const updateProductStatus = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    if (
      req.body.isActive ===
      undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Product status is required.",
      });
    }

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    product.isActive =
      parseBoolean(
        req.body.isActive,
        product.isActive
      );

    await product.save();

    return res.status(200).json({
      success: true,

      message:
        product.isActive
          ? "Product activated successfully."
          : "Product deactivated successfully.",

      product,
    });
  } catch (error) {
    console.error(
      "Product status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update product status.",
    });
  }
};

/**
 * PATCH /api/admin/products/:productId/stock
 */
const updateProductStock = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    if (
      req.body.stock !==
      undefined
    ) {
      const stock =
        Number(
          req.body.stock
        );

      if (
        Number.isNaN(stock) ||
        stock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Stock must be zero or greater.",
        });
      }

      product.stock =
        stock;
    }

    if (
      req.body
        .lowStockThreshold !==
      undefined
    ) {
      const threshold =
        Number(
          req.body
            .lowStockThreshold
        );

      if (
        Number.isNaN(
          threshold
        ) ||
        threshold < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Low stock threshold must be zero or greater.",
        });
      }

      product.lowStockThreshold =
        threshold;
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message:
        "Product stock updated successfully.",
      product,
    });
  } catch (error) {
    console.error(
      "Update product stock error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update product stock.",
    });
  }
};

/**
 * DELETE /api/admin/products/:productId
 */
const deleteProduct = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    const {
      productId,
    } = req.params;

    const product =
      await Product.findById(
        productId
      );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const images =
      [...product.images];

    await session.withTransaction(
      async () => {
        await Cart.updateMany(
          {},
          {
            $pull: {
              items: {
                product:
                  product._id,
              },
            },
          },
          {
            session,
          }
        );

        await Wishlist.updateMany(
          {},
          {
            $pull: {
              items: {
                product:
                  product._id,
              },
            },
          },
          {
            session,
          }
        );

        await Product.deleteOne(
          {
            _id:
              product._id,
          },
          {
            session,
          }
        );
      }
    );

    for (
      const image
      of images
    ) {
      await deleteCloudinaryImage(
        image.publicId
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Product deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete product error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete product.",
    });
  } finally {
    await session.endSession();
  }
};

/**
 * GET /api/admin/users
 */
const getAdminUsers = async (
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
      ) || 20;

    if (page < 1) {
      page = 1;
    }

    if (limit < 1) {
      limit = 20;
    }

    if (limit > 100) {
      limit = 100;
    }

    const filter = {
      role: "user",
    };

    if (req.query.search) {
      const search =
        escapeRegExp(
          String(
            req.query.search
          ).trim()
        );

      if (search) {
        filter.$or = [
          {
            name: {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            email: {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            phone: {
              $regex:
                search,
              $options: "i",
            },
          },
        ];
      }
    }

    if (
      req.query.status ===
      "active"
    ) {
      filter.isActive = true;
    }

    if (
      req.query.status ===
      "inactive"
    ) {
      filter.isActive = false;
    }

    const sortOptions = {
      newest: {
        createdAt: -1,
      },

      oldest: {
        createdAt: 1,
      },

      name_asc: {
        name: 1,
        createdAt: -1,
      },

      name_desc: {
        name: -1,
        createdAt: -1,
      },
    };

    const sort =
      sortOptions[
        String(
          req.query.sort ||
            "newest"
        ).trim()
      ] ||
      sortOptions.newest;

    const skip =
      (page - 1) *
      limit;

    const [
      users,
      totalUsers,
    ] = await Promise.all([
      User.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),

      User.countDocuments(
        filter
      ),
    ]);

    const totalPages =
      Math.max(
        Math.ceil(
          totalUsers /
            limit
        ),
        1
      );

    return res.status(200).json({
      success: true,

      users,

      pagination: {
        page,
        limit,
        totalUsers,
        totalPages,

        hasNextPage:
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Admin users error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load users.",
    });
  }
};

/**
 * GET /api/admin/users/:userId
 */
const getAdminUserDetails = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.userId
      );

    if (
      !user ||
      user.role !==
        "user"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    const [
      orders,
      orderSummary,
    ] = await Promise.all([
      Order.find({
        user:
          user._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(10),

      Order.aggregate([
        {
          $match: {
            user:
              user._id,

            orderStatus: {
              $ne:
                "cancelled",
            },
          },
        },

        {
          $group: {
            _id: null,

            orders: {
              $sum: 1,
            },

            spent: {
              $sum:
                "$totalAmount",
            },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,

      user,

      recentOrders:
        orders,

      summary: {
        totalOrders:
          orderSummary[0]
            ?.orders || 0,

        totalSpent:
          orderSummary[0]
            ?.spent || 0,
      },
    });
  } catch (error) {
    console.error(
      "Admin user details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load user details.",
    });
  }
};

/**
 * PATCH /api/admin/users/:userId/status
 */
const updateUserStatus = async (
  req,
  res
) => {
  try {
    if (
      req.body.isActive ===
      undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "User status is required.",
      });
    }

    const user =
      await User.findById(
        req.params.userId
      );

    if (
      !user ||
      user.role !==
        "user"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    user.isActive =
      parseBoolean(
        req.body.isActive,
        user.isActive
      );

    await user.save();

    return res.status(200).json({
      success: true,

      message:
        user.isActive
          ? "User activated successfully."
          : "User disabled successfully.",

      user,
    });
  } catch (error) {
    console.error(
      "Update user status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update user status.",
    });
  }
};

/**
 * GET /api/admin/orders
 */
const getAdminOrders = async (
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
      ) || 20;

    if (page < 1) {
      page = 1;
    }

    if (limit < 1) {
      limit = 20;
    }

    if (limit > 100) {
      limit = 100;
    }

    const filter = {};

    const validOrderStatuses = [
      "placed",
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    const validPaymentStatuses = [
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    const validPaymentMethods = [
      "cod",
      "upi",
      "card",
    ];

    if (req.query.status) {
      const status =
        String(
          req.query.status
        ).trim();

      if (
        validOrderStatuses.includes(
          status
        )
      ) {
        filter.orderStatus =
          status;
      }
    }

    if (
      req.query.paymentStatus
    ) {
      const paymentStatus =
        String(
          req.query
            .paymentStatus
        ).trim();

      if (
        validPaymentStatuses.includes(
          paymentStatus
        )
      ) {
        filter[
          "payment.status"
        ] = paymentStatus;
      }
    }

    if (
      req.query.paymentMethod
    ) {
      const paymentMethod =
        String(
          req.query
            .paymentMethod
        ).trim();

      if (
        validPaymentMethods.includes(
          paymentMethod
        )
      ) {
        filter[
          "payment.method"
        ] = paymentMethod;
      }
    }

    if (req.query.search) {
      const search =
        escapeRegExp(
          String(
            req.query.search
          ).trim()
        );

      if (search) {
        const matchingUsers =
          await User.find({
            role: "user",

            $or: [
              {
                name: {
                  $regex:
                    search,
                  $options: "i",
                },
              },

              {
                email: {
                  $regex:
                    search,
                  $options: "i",
                },
              },

              {
                phone: {
                  $regex:
                    search,
                  $options: "i",
                },
              },
            ],
          }).select("_id");

        filter.$or = [
          {
            orderNumber: {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            "shippingAddress.fullName": {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            "shippingAddress.phone": {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            "items.name": {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            "items.sku": {
              $regex:
                search,
              $options: "i",
            },
          },

          {
            user: {
              $in:
                matchingUsers.map(
                  (user) =>
                    user._id
                ),
            },
          },
        ];
      }
    }

    const sortOptions = {
      newest: {
        createdAt: -1,
      },

      oldest: {
        createdAt: 1,
      },

      amount_high: {
        totalAmount: -1,
        createdAt: -1,
      },

      amount_low: {
        totalAmount: 1,
        createdAt: -1,
      },
    };

    const sort =
      sortOptions[
        String(
          req.query.sort ||
            "newest"
        ).trim()
      ] ||
      sortOptions.newest;

    const skip =
      (page - 1) *
      limit;

    const [
      orders,
      totalOrders,
    ] = await Promise.all([
      Order.find(filter)
        .populate(
          "user",
          "name email phone"
        )
        .sort(sort)
        .skip(skip)
        .limit(limit),

      Order.countDocuments(
        filter
      ),
    ]);

    const totalPages =
      Math.max(
        Math.ceil(
          totalOrders /
            limit
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
          page <
          totalPages,

        hasPreviousPage:
          page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Admin orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load orders.",
    });
  }
};

/**
 * GET /api/admin/orders/:orderId
 */
const getAdminOrderDetails = async (
  req,
  res
) => {
  try {
    const order =
      await Order.findById(
        req.params.orderId
      )
        .populate(
          "user",
          "name email phone addresses"
        )
        .populate({
          path:
            "items.product",

          select:
            "name slug sku images category brand isActive",
        });

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
      "Admin order details error:",
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
 * PATCH /api/admin/orders/:orderId/status
 */
const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const {
      status,
      message = "",
    } = req.body;

    const validStatuses = [
      "placed",
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (
      !validStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status.",
      });
    }

    const order =
      await Order.findById(
        req.params.orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    if (
      order.orderStatus ===
        "cancelled" &&
      status !==
        "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Cancelled orders cannot be reopened.",
      });
    }

    if (
      order.orderStatus ===
        "delivered" &&
      status !==
        "delivered"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivered orders cannot be moved to another status.",
      });
    }

    if (
      status ===
      "cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Use the dedicated admin cancellation endpoint for cancelling orders so stock can be restored safely.",
      });
    }

    order.addStatusHistory(
      status,
      String(
        message || ""
      ).trim()
    );

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update order status.",
    });
  }
};

/**
 * PATCH /api/admin/orders/:orderId/payment
 */
const updatePaymentStatus = async (
  req,
  res
) => {
  try {
    const {
      status,
      transactionId,
    } = req.body;

    const allowedStatuses = [
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid payment status.",
      });
    }

    const order =
      await Order.findById(
        req.params.orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    order.payment.status =
      status;

    if (
      transactionId !==
      undefined
    ) {
      order.payment.transactionId =
        String(
          transactionId
        ).trim();
    }

    if (
      status ===
      "paid"
    ) {
      order.payment.paidAt =
        order.payment.paidAt ||
        new Date();

      order.payment.refundedAt =
        null;
    }

    if (
      status ===
      "refunded"
    ) {
      order.payment.refundedAt =
        new Date();
    }

    if (
      status ===
        "pending" ||
      status ===
        "failed"
    ) {
      order.payment.paidAt =
        null;

      order.payment.refundedAt =
        null;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message:
        "Payment status updated successfully.",
      order,
    });
  } catch (error) {
    console.error(
      "Update payment status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update payment status.",
    });
  }
};

/**
 * POST /api/admin/orders/:orderId/cancel
 */
const adminCancelOrder = async (
  req,
  res
) => {
  const session =
    await mongoose.startSession();

  try {
    let cancelledOrderId =
      null;

    await session.withTransaction(
      async () => {
        const order =
          await Order.findById(
            req.params.orderId
          ).session(session);

        if (!order) {
          throw new Error(
            "ORDER_NOT_FOUND"
          );
        }

        if (
          order.orderStatus ===
          "cancelled"
        ) {
          throw new Error(
            "ALREADY_CANCELLED"
          );
        }

        if (
          order.orderStatus ===
          "delivered"
        ) {
          throw new Error(
            "DELIVERED_ORDER"
          );
        }

        for (
          const item
          of order.items
        ) {
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
          String(
            req.body.reason ||
              "Cancelled by administrator."
          ).trim();

        order.cancelledAt =
          new Date();

        order.addStatusHistory(
          "cancelled",
          "Order cancelled by administrator."
        );

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
      ).populate(
        "user",
        "name email phone"
      );

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
      "ALREADY_CANCELLED"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order is already cancelled.",
      });
    }

    if (
      error.message ===
      "DELIVERED_ORDER"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Delivered orders cannot be cancelled.",
      });
    }

    console.error(
      "Admin cancel order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to cancel order.",
    });
  } finally {
    await session.endSession();
  }
};

/**
 * GET /api/admin/reports/overview
 *
 * Optional:
 * ?days=30
 */
const getSalesOverview = async (
  req,
  res
) => {
  try {
    let days =
      Number(
        req.query.days
      ) || 30;

    if (days < 1) {
      days = 30;
    }

    if (days > 365) {
      days = 365;
    }

    const endDate =
      new Date();

    const startDate =
      new Date();

    startDate.setDate(
      startDate.getDate() -
        (days - 1)
    );

    startDate.setHours(
      0,
      0,
      0,
      0
    );

    const reportOrderFilter = {
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },

      orderStatus: {
        $ne: "cancelled",
      },
    };

    const [
      revenueSummary,
      orderStatusCounts,
      dailySales,
      topProducts,
      lowStockProducts,
    ] = await Promise.all([
      /**
       * Revenue summary
       */
      Order.aggregate([
        {
          $match:
            reportOrderFilter,
        },

        {
          $group: {
            _id: null,

            totalRevenue: {
              $sum:
                "$totalAmount",
            },

            totalOrders: {
              $sum: 1,
            },

            averageOrderValue: {
              $avg:
                "$totalAmount",
            },
          },
        },
      ]),

      /**
       * Order counts by status.
       *
       * Cancelled orders are included here
       * because the admin report should show
       * the complete order-status picture.
       */
      Order.aggregate([
        {
          $match: {
            createdAt: {
              $gte:
                startDate,
              $lte:
                endDate,
            },
          },
        },

        {
          $group: {
            _id:
              "$orderStatus",

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            count: -1,
          },
        },
      ]),

      /**
       * Daily revenue and order count.
       *
       * Cancelled orders are excluded from
       * revenue calculations.
       */
      Order.aggregate([
        {
          $match:
            reportOrderFilter,
        },

        {
          $group: {
            _id: {
              $dateToString: {
                format:
                  "%Y-%m-%d",

                date:
                  "$createdAt",
              },
            },

            revenue: {
              $sum:
                "$totalAmount",
            },

            orders: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      /**
       * Actual top products for the selected
       * reporting period.
       *
       * This uses the order-item snapshots,
       * not Product.soldCount.
       *
       * Therefore:
       * - quantity is period-specific
       * - revenue is period-specific
       * - deleted products still appear
       * - historical prices remain correct
       */
      Order.aggregate([
        {
          $match:
            reportOrderFilter,
        },

        {
          $unwind:
            "$items",
        },

        {
          $group: {
            _id:
              "$items.product",

            name: {
              $first:
                "$items.name",
            },

            sku: {
              $first:
                "$items.sku",
            },

            image: {
              $first:
                "$items.image",
            },

            soldCount: {
              $sum:
                "$items.quantity",
            },

            revenue: {
              $sum:
                "$items.totalPrice",
            },

            averageUnitPrice: {
              $avg:
                "$items.unitPrice",
            },
          },
        },

        {
          $sort: {
            revenue: -1,
            soldCount: -1,
          },
        },

        {
          $limit: 10,
        },

        /**
         * Add current product information
         * when the product still exists.
         */
        {
          $lookup: {
            from:
              "products",

            localField:
              "_id",

            foreignField:
              "_id",

            as:
              "product",
          },
        },

        {
          $unwind: {
            path:
              "$product",

            preserveNullAndEmptyArrays:
              true,
          },
        },

        {
          $project: {
            _id: 1,

            productId:
              "$_id",

            name: 1,
            sku: 1,
            soldCount: 1,
            revenue: 1,
            averageUnitPrice: 1,

            category: {
              $ifNull: [
                "$product.category",
                "",
              ],
            },

            brand: {
              $ifNull: [
                "$product.brand",
                "",
              ],
            },

            stock: {
              $ifNull: [
                "$product.stock",
                0,
              ],
            },

            price: {
              $ifNull: [
                "$product.price",
                "$averageUnitPrice",
              ],
            },

            discountPrice: {
              $ifNull: [
                "$product.discountPrice",
                null,
              ],
            },

            images: {
              $cond: [
                {
                  $gt: [
                    {
                      $size: {
                        $ifNull: [
                          "$product.images",
                          [],
                        ],
                      },
                    },
                    0,
                  ],
                },

                "$product.images",

                [
                  {
                    url:
                      "$image",

                    publicId:
                      "",

                    altText:
                      "$name",
                  },
                ],
              ],
            },
          },
        },
      ]),

      /**
       * Current low-stock products.
       */
      Product.find({
        isActive: true,

        $expr: {
          $lte: [
            "$stock",
            "$lowStockThreshold",
          ],
        },
      })
        .sort({
          stock: 1,
          name: 1,
        })
        .limit(20)
        .select(
          "name sku stock lowStockThreshold images"
        ),
    ]);

    const summary =
      revenueSummary[0] || {
        totalRevenue: 0,
        totalOrders: 0,
        averageOrderValue: 0,
      };

    /**
     * Round monetary data before response.
     */
    const normalizedDailySales =
      dailySales.map(
        (entry) => ({
          ...entry,

          revenue:
            Number(
              (
                entry.revenue ||
                0
              ).toFixed(2)
            ),
        })
      );

    const normalizedTopProducts =
      topProducts.map(
        (product) => ({
          ...product,

          revenue:
            Number(
              (
                product.revenue ||
                0
              ).toFixed(2)
            ),

          averageUnitPrice:
            Number(
              (
                product.averageUnitPrice ||
                0
              ).toFixed(2)
            ),
        })
      );

    return res.status(200).json({
      success: true,

      period: {
        days,
        startDate,
        endDate,
      },

      summary: {
        totalRevenue:
          Number(
            (
              summary.totalRevenue ||
              0
            ).toFixed(2)
          ),

        totalOrders:
          summary.totalOrders ||
          0,

        averageOrderValue:
          Number(
            (
              summary.averageOrderValue ||
              0
            ).toFixed(2)
          ),
      },

      orderStatusCounts,

      dailySales:
        normalizedDailySales,

      topProducts:
        normalizedTopProducts,

      lowStockProducts,
    });
  } catch (error) {
    console.error(
      "Sales overview error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to load sales reports.",
    });
  }
};

/**
 * GET /api/admin/reports/customers
 */
const getCustomerReport = async (
  req,
  res
) => {
  try {
    const customers =
      await Order.aggregate([
        {
          $match: {
            orderStatus: {
              $ne:
                "cancelled",
            },
          },
        },

        {
          $group: {
            _id:
              "$user",

            totalOrders: {
              $sum: 1,
            },

            totalSpent: {
              $sum:
                "$totalAmount",
            },

            lastOrderAt: {
              $max:
                "$createdAt",
            },
          },
        },

        {
          $sort: {
            totalSpent: -1,
          },
        },

        {
          $limit: 20,
        },

        {
          $lookup: {
            from:
              "users",

            localField:
              "_id",

            foreignField:
              "_id",

            as:
              "user",
          },
        },

        {
          $unwind:
            "$user",
        },

        {
          $project: {
            _id: 0,

            userId:
              "$user._id",

            name:
              "$user.name",

            email:
              "$user.email",

            phone:
              "$user.phone",

            totalOrders: 1,
            totalSpent: 1,
            lastOrderAt: 1,
          },
        },
      ]);

    return res.status(200).json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error(
      "Customer report error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load customer report.",
    });
  }
};

export {
  getDashboardStats,

  getAdminProducts,
  getAdminProductById,
  createProduct,
  updateProduct,
  deleteProductImage,
  updateProductStatus,
  updateProductStock,
  deleteProduct,

  getAdminUsers,
  getAdminUserDetails,
  updateUserStatus,

  getAdminOrders,
  getAdminOrderDetails,
  updateOrderStatus,
  updatePaymentStatus,
  adminCancelOrder,

  getSalesOverview,
  getCustomerReport,
};