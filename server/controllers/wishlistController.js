import Wishlist from "../models/Wishlist.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/**
 * Get the current selling price of a product.
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
 * Find or create the logged-in user's wishlist.
 */
const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({
    user: userId,
  });

  if (!wishlist) {
    wishlist = await Wishlist.create({
      user: userId,
      items: [],
    });
  }

  return wishlist;
};

/**
 * Populate wishlist products.
 */
const populateWishlist = async (wishlist) => {
  if (!wishlist) {
    return null;
  }

  await wishlist.populate({
    path: "items.product",
    select:
      "name slug shortDescription category brand price discountPrice stock images ratingAverage ratingCount isActive",
  });

  return wishlist;
};

/**
 * Remove deleted or inactive products from wishlist.
 */
const synchronizeWishlist = async (wishlist) => {
  if (!wishlist || wishlist.items.length === 0) {
    return wishlist;
  }

  const productIds = wishlist.items.map(
    (item) => item.product
  );

  const validProducts = await Product.find({
    _id: {
      $in: productIds,
    },
    isActive: true,
  }).select("_id");

  const validProductIds = new Set(
    validProducts.map((product) =>
      product._id.toString()
    )
  );

  const originalLength =
    wishlist.items.length;

  wishlist.items = wishlist.items.filter(
    (item) =>
      validProductIds.has(
        item.product.toString()
      )
  );

  if (
    wishlist.items.length !==
    originalLength
  ) {
    await wishlist.save();
  }

  return wishlist;
};

/**
 * GET /api/wishlist
 *
 * Get logged-in user's wishlist.
 */
const getWishlist = async (req, res) => {
  try {
    let wishlist =
      await getOrCreateWishlist(
        req.user._id
      );

    wishlist =
      await synchronizeWishlist(
        wishlist
      );

    await populateWishlist(wishlist);

    return res.status(200).json({
      success: true,
      wishlist,
    });
  } catch (error) {
    console.error(
      "Get wishlist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load your wishlist.",
    });
  }
};

/**
 * POST /api/wishlist
 *
 * Add a product to wishlist.
 *
 * Body:
 * {
 *   "productId": "..."
 * }
 */
const addToWishlist = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message:
          "Product ID is required.",
      });
    }

    const product =
      await Product.findById(
        productId
      );

    if (
      !product ||
      !product.isActive
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const wishlist =
      await getOrCreateWishlist(
        req.user._id
      );

    const alreadyExists =
      wishlist.items.some(
        (item) =>
          item.product.toString() ===
          product._id.toString()
      );

    if (alreadyExists) {
      await populateWishlist(
        wishlist
      );

      return res.status(200).json({
        success: true,
        message:
          "Product is already in your wishlist.",
        wishlist,
      });
    }

    wishlist.items.unshift({
      product: product._id,
      addedAt: new Date(),
    });

    await wishlist.save();

    await populateWishlist(
      wishlist
    );

    return res.status(201).json({
      success: true,
      message:
        "Product added to wishlist.",
      wishlist,
    });
  } catch (error) {
    if (
      error?.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID.",
      });
    }

    console.error(
      "Add to wishlist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to add product to wishlist.",
    });
  }
};

/**
 * DELETE /api/wishlist/:productId
 *
 * Remove one product from wishlist.
 */
const removeFromWishlist = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    const wishlist =
      await Wishlist.findOne({
        user: req.user._id,
      });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message:
          "Wishlist not found.",
      });
    }

    const initialLength =
      wishlist.items.length;

    wishlist.items =
      wishlist.items.filter(
        (item) =>
          item.product.toString() !==
          productId
      );

    if (
      wishlist.items.length ===
      initialLength
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product is not in your wishlist.",
      });
    }

    await wishlist.save();

    await populateWishlist(
      wishlist
    );

    return res.status(200).json({
      success: true,
      message:
        "Product removed from wishlist.",
      wishlist,
    });
  } catch (error) {
    console.error(
      "Remove from wishlist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to remove product from wishlist.",
    });
  }
};

/**
 * PATCH /api/wishlist/:productId/toggle
 *
 * Add product if not present.
 * Remove product if already present.
 */
const toggleWishlistItem = async (
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

    if (
      !product ||
      !product.isActive
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    const wishlist =
      await getOrCreateWishlist(
        req.user._id
      );

    const itemIndex =
      wishlist.items.findIndex(
        (item) =>
          item.product.toString() ===
          productId
      );

    let inWishlist;

    if (itemIndex === -1) {
      wishlist.items.unshift({
        product: product._id,
        addedAt: new Date(),
      });

      inWishlist = true;
    } else {
      wishlist.items.splice(
        itemIndex,
        1
      );

      inWishlist = false;
    }

    await wishlist.save();

    await populateWishlist(
      wishlist
    );

    return res.status(200).json({
      success: true,
      inWishlist,

      message: inWishlist
        ? "Product added to wishlist."
        : "Product removed from wishlist.",

      wishlist,
    });
  } catch (error) {
    if (
      error?.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID.",
      });
    }

    console.error(
      "Toggle wishlist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to update wishlist.",
    });
  }
};

/**
 * GET /api/wishlist/check/:productId
 *
 * Check whether one product exists in wishlist.
 */
const checkWishlistItem = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    const wishlist =
      await Wishlist.findOne({
        user: req.user._id,
      });

    const inWishlist =
      wishlist?.items?.some(
        (item) =>
          item.product.toString() ===
          productId
      ) || false;

    return res.status(200).json({
      success: true,
      inWishlist,
    });
  } catch (error) {
    console.error(
      "Check wishlist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to check wishlist.",
    });
  }
};

/**
 * DELETE /api/wishlist
 *
 * Clear entire wishlist.
 */
const clearWishlist = async (
  req,
  res
) => {
  try {
    let wishlist =
      await Wishlist.findOne({
        user: req.user._id,
      });

    if (!wishlist) {
      wishlist =
        await Wishlist.create({
          user: req.user._id,
          items: [],
        });
    } else {
      wishlist.items = [];

      await wishlist.save();
    }

    await populateWishlist(
      wishlist
    );

    return res.status(200).json({
      success: true,
      message:
        "Wishlist cleared successfully.",
      wishlist,
    });
  } catch (error) {
    console.error(
      "Clear wishlist error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to clear wishlist.",
    });
  }
};

/**
 * POST /api/wishlist/:productId/move-to-cart
 *
 * Move one wishlist product into cart.
 *
 * Body may optionally contain:
 * {
 *   "quantity": 1
 * }
 */
const moveToCart = async (
  req,
  res
) => {
  try {
    const {
      productId,
    } = req.params;

    const requestedQuantity =
      Number(
        req.body.quantity || 1
      );

    if (
      !Number.isInteger(
        requestedQuantity
      ) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a whole number greater than zero.",
      });
    }

    const product =
      await Product.findById(
        productId
      );

    if (
      !product ||
      !product.isActive
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found.",
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "This product is currently out of stock.",
      });
    }

    const wishlist =
      await Wishlist.findOne({
        user: req.user._id,
      });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message:
          "Wishlist not found.",
      });
    }

    const wishlistItemIndex =
      wishlist.items.findIndex(
        (item) =>
          item.product.toString() ===
          productId
      );

    if (
      wishlistItemIndex === -1
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Product is not in your wishlist.",
      });
    }

    let cart =
      await Cart.findOne({
        user: req.user._id,
      });

    if (!cart) {
      cart =
        await Cart.create({
          user: req.user._id,
          items: [],
        });
    }

    const existingCartItem =
      cart.items.find(
        (item) =>
          item.product.toString() ===
          productId
      );

    const unitPrice =
      getProductPrice(product);

    if (existingCartItem) {
      const newQuantity =
        existingCartItem.quantity +
        requestedQuantity;

      if (
        newQuantity >
        product.stock
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Only ${product.stock} item(s) are available in stock.`,
        });
      }

      existingCartItem.quantity =
        newQuantity;

      existingCartItem.unitPrice =
        unitPrice;
    } else {
      if (
        requestedQuantity >
        product.stock
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Only ${product.stock} item(s) are available in stock.`,
        });
      }

      cart.items.push({
        product: product._id,
        quantity:
          requestedQuantity,
        unitPrice,
      });
    }

    cart.updatedFromClientAt =
      new Date();

    wishlist.items.splice(
      wishlistItemIndex,
      1
    );

    await Promise.all([
      cart.save(),
      wishlist.save(),
    ]);

    await cart.populate({
      path: "items.product",
      select:
        "name slug shortDescription category brand price discountPrice stock images isActive",
    });

    await populateWishlist(
      wishlist
    );

    return res.status(200).json({
      success: true,
      message:
        "Product moved to cart successfully.",
      cart,
      wishlist,
    });
  } catch (error) {
    if (
      error?.name === "CastError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid product ID.",
      });
    }

    console.error(
      "Move wishlist item to cart error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to move product to cart.",
    });
  }
};

export {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlistItem,
  checkWishlistItem,
  clearWishlist,
  moveToCart,
};