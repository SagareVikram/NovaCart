import Product from "../models/Product.js";

/**
 * Build product filters from query parameters.
 *
 * Supported:
 * - search
 * - category
 * - subCategory
 * - brand
 * - minPrice
 * - maxPrice
 * - featured
 * - inStock
 */
const buildProductFilter = (query) => {
  const filter = {
    isActive: true,
  };

  if (query.category) {
    filter.category = {
      $regex: `^${String(query.category).trim()}$`,
      $options: "i",
    };
  }

  if (query.subCategory) {
    filter.subCategory = {
      $regex: `^${String(query.subCategory).trim()}$`,
      $options: "i",
    };
  }

  if (query.brand) {
    filter.brand = {
      $regex: `^${String(query.brand).trim()}$`,
      $options: "i",
    };
  }

  if (query.featured === "true") {
    filter.isFeatured = true;
  }

  if (query.inStock === "true") {
    filter.stock = {
      $gt: 0,
    };
  }

  if (
    query.minPrice !== undefined ||
    query.maxPrice !== undefined
  ) {
    filter.$expr = {
      $and: [],
    };

    const effectivePrice = {
      $cond: [
        {
          $and: [
            {
              $ne: ["$discountPrice", null],
            },
            {
              $lt: ["$discountPrice", "$price"],
            },
          ],
        },
        "$discountPrice",
        "$price",
      ],
    };

    if (query.minPrice !== undefined) {
      const minPrice = Number(query.minPrice);

      if (!Number.isNaN(minPrice)) {
        filter.$expr.$and.push({
          $gte: [
            effectivePrice,
            minPrice,
          ],
        });
      }
    }

    if (query.maxPrice !== undefined) {
      const maxPrice = Number(query.maxPrice);

      if (!Number.isNaN(maxPrice)) {
        filter.$expr.$and.push({
          $lte: [
            effectivePrice,
            maxPrice,
          ],
        });
      }
    }

    if (filter.$expr.$and.length === 0) {
      delete filter.$expr;
    }
  }

  if (query.search) {
    const search = String(query.search).trim();

    if (search) {
      filter.$text = {
        $search: search,
      };
    }
  }

  return filter;
};

/**
 * Build sorting configuration.
 *
 * Supported:
 * newest
 * oldest
 * price_low
 * price_high
 * rating
 * popular
 * name_az
 * name_za
 */
const buildSort = (sortValue) => {
  switch (sortValue) {
    case "oldest":
      return {
        createdAt: 1,
      };

    case "price_low":
      return {
        price: 1,
      };

    case "price_high":
      return {
        price: -1,
      };

    case "rating":
      return {
        ratingAverage: -1,
        ratingCount: -1,
      };

    case "popular":
      return {
        soldCount: -1,
        ratingAverage: -1,
      };

    case "name_az":
      return {
        name: 1,
      };

    case "name_za":
      return {
        name: -1,
      };

    case "newest":
    default:
      return {
        createdAt: -1,
      };
  }
};

/**
 * GET /api/products
 *
 * Public product listing.
 *
 * Example:
 *
 * /api/products?page=1&limit=12
 * /api/products?search=laptop
 * /api/products?category=Electronics
 * /api/products?brand=Apple
 * /api/products?minPrice=1000&maxPrice=50000
 * /api/products?sort=price_low
 */
const getProducts = async (req, res) => {
  try {
    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 12;

    if (page < 1) {
      page = 1;
    }

    if (limit < 1) {
      limit = 12;
    }

    if (limit > 50) {
      limit = 50;
    }

    const skip = (page - 1) * limit;

    const filter = buildProductFilter(req.query);

    const sort = buildSort(req.query.sort);

    const query = Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    if (req.query.search) {
      query.select({
        score: {
          $meta: "textScore",
        },
      });
    }

    const [
      products,
      totalProducts,
    ] = await Promise.all([
      query.exec(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.max(
      Math.ceil(totalProducts / limit),
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
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get products error:",
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
 * GET /api/products/featured
 *
 * Public featured products for home page.
 */
const getFeaturedProducts = async (
  req,
  res
) => {
  try {
    let limit = Number(req.query.limit) || 8;

    if (limit < 1) {
      limit = 8;
    }

    if (limit > 24) {
      limit = 24;
    }

    const products = await Product.find({
      isActive: true,
      isFeatured: true,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "Get featured products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load featured products.",
    });
  }
};

/**
 * GET /api/products/new-arrivals
 */
const getNewArrivals = async (
  req,
  res
) => {
  try {
    let limit = Number(req.query.limit) || 8;

    if (limit < 1) {
      limit = 8;
    }

    if (limit > 24) {
      limit = 24;
    }

    const products = await Product.find({
      isActive: true,
    })
      .sort({
        createdAt: -1,
      })
      .limit(limit);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "Get new arrivals error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load new arrivals.",
    });
  }
};

/**
 * GET /api/products/best-sellers
 */
const getBestSellers = async (
  req,
  res
) => {
  try {
    let limit = Number(req.query.limit) || 8;

    if (limit < 1) {
      limit = 8;
    }

    if (limit > 24) {
      limit = 24;
    }

    const products = await Product.find({
      isActive: true,
    })
      .sort({
        soldCount: -1,
        ratingAverage: -1,
      })
      .limit(limit);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "Get best sellers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load best-selling products.",
    });
  }
};

/**
 * GET /api/products/categories
 *
 * Returns category list for navbar/filter UI.
 */
const getCategories = async (
  req,
  res
) => {
  try {
    const categories =
      await Product.distinct(
        "category",
        {
          isActive: true,
        }
      );

    const cleanedCategories = categories
      .filter(Boolean)
      .map((category) =>
        String(category).trim()
      )
      .sort((a, b) =>
        a.localeCompare(b)
      );

    return res.status(200).json({
      success: true,
      categories: cleanedCategories,
    });
  } catch (error) {
    console.error(
      "Get categories error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load categories.",
    });
  }
};

/**
 * GET /api/products/brands
 *
 * Optional query:
 * ?category=Electronics
 */
const getBrands = async (
  req,
  res
) => {
  try {
    const filter = {
      isActive: true,
      brand: {
        $nin: [
          "",
          null,
        ],
      },
    };

    if (req.query.category) {
      filter.category = {
        $regex:
          `^${String(
            req.query.category
          ).trim()}$`,
        $options: "i",
      };
    }

    const brands =
      await Product.distinct(
        "brand",
        filter
      );

    const cleanedBrands = brands
      .filter(Boolean)
      .map((brand) =>
        String(brand).trim()
      )
      .sort((a, b) =>
        a.localeCompare(b)
      );

    return res.status(200).json({
      success: true,
      brands: cleanedBrands,
    });
  } catch (error) {
    console.error(
      "Get brands error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load brands.",
    });
  }
};

/**
 * GET /api/products/category/:category
 *
 * Convenience route for category pages.
 */
const getProductsByCategory = async (
  req,
  res
) => {
  try {
    const category =
      String(
        req.params.category || ""
      ).trim();

    if (!category) {
      return res.status(400).json({
        success: false,
        message:
          "Category is required.",
      });
    }

    let page = Number(req.query.page) || 1;
    let limit = Number(req.query.limit) || 12;

    if (page < 1) {
      page = 1;
    }

    if (limit < 1) {
      limit = 12;
    }

    if (limit > 50) {
      limit = 50;
    }

    const skip = (page - 1) * limit;

    const filter = {
      isActive: true,

      category: {
        $regex: `^${category}$`,
        $options: "i",
      },
    };

    const sort = buildSort(req.query.sort);

    const [
      products,
      totalProducts,
    ] = await Promise.all([
      Product.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit),

      Product.countDocuments(filter),
    ]);

    const totalPages = Math.max(
      Math.ceil(totalProducts / limit),
      1
    );

    return res.status(200).json({
      success: true,
      category,
      products,

      pagination: {
        page,
        limit,
        totalProducts,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error(
      "Get products by category error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load category products.",
    });
  }
};

/**
 * GET /api/products/:identifier
 *
 * Supports either:
 * - MongoDB ID
 * - slug
 *
 * Example:
 * /api/products/68d...
 * /api/products/apple-iphone-16
 */
const getProductByIdentifier = async (
  req,
  res
) => {
  try {
    const identifier =
      String(
        req.params.identifier || ""
      ).trim();

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message:
          "Product identifier is required.",
      });
    }

    let product = null;

    if (
      identifier.match(
        /^[0-9a-fA-F]{24}$/
      )
    ) {
      product =
        await Product.findOne({
          _id: identifier,
          isActive: true,
        });
    }

    if (!product) {
      product =
        await Product.findOne({
          slug:
            identifier.toLowerCase(),
          isActive: true,
        });
    }

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
    console.error(
      "Get product details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load product details.",
    });
  }
};

/**
 * GET /api/products/:identifier/related
 *
 * Returns related products from the same category.
 */
const getRelatedProducts = async (
  req,
  res
) => {
  try {
    const identifier =
      String(
        req.params.identifier || ""
      ).trim();

    let product = null;

    if (
      identifier.match(
        /^[0-9a-fA-F]{24}$/
      )
    ) {
      product =
        await Product.findById(
          identifier
        );
    }

    if (!product) {
      product =
        await Product.findOne({
          slug:
            identifier.toLowerCase(),
        });
    }

    if (
      !product ||
      product.isActive === false
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    let limit =
      Number(req.query.limit) || 4;

    if (limit < 1) {
      limit = 4;
    }

    if (limit > 12) {
      limit = 12;
    }

    const products =
      await Product.find({
        _id: {
          $ne: product._id,
        },

        category:
          product.category,

        isActive: true,
      })
        .sort({
          isFeatured: -1,
          soldCount: -1,
          ratingAverage: -1,
        })
        .limit(limit);

    return res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(
      "Get related products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load related products.",
    });
  }
};

export {
  getProducts,
  getFeaturedProducts,
  getNewArrivals,
  getBestSellers,
  getCategories,
  getBrands,
  getProductsByCategory,
  getProductByIdentifier,
  getRelatedProducts,
};