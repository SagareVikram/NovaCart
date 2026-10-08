import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

/**
 * Get the effective selling price of a product.
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
 * Populate cart product information.
 */
const populateCart = async (cart) => {
  if (!cart) {
    return null;
  }

  await cart.populate({
    path: "items.product",
    select:
      "name slug shortDescription category brand price discountPrice stock images isActive",
  });

  return cart;
};

/**
 * Synchronize cart with current product data.
 *
 * This automatically:
 * - removes deleted products
 * - removes inactive products
 * - removes out-of-stock products
 * - reduces quantity if stock decreased
 * - refreshes price snapshot
 */
const synchronizeCart = async (cart) => {
  if (!cart || cart.items.length === 0) {
    return cart;
  }

  let changed = false;

  const synchronizedItems = [];

  for (const item of cart.items) {
    const product = await Product.findById(item.product);

    if (!product) {
      changed = true;
      continue;
    }

    if (!product.isActive) {
      changed = true;
      continue;
    }

    if (product.stock <= 0) {
      changed = true;
      continue;
    }

    let quantity = item.quantity;

    if (quantity > product.stock) {
      quantity = product.stock;
      changed = true;
    }

    const currentPrice = getProductPrice(product);

    if (item.unitPrice !== currentPrice) {
      changed = true;
    }

    synchronizedItems.push({
      product: product._id,
      quantity,
      unitPrice: currentPrice,
    });
  }

  if (changed) {
    cart.items = synchronizedItems;

    await cart.save();
  }

  return cart;
};

/**
 * Find or create the user's cart.
 */
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({
    user: userId,
  });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      items: [],
    });
  }

  return cart;
};

/**
 * GET /api/cart
 *
 * Get logged-in user's persistent cart.
 */
const getCart = async (req, res) => {
  try {
    let cart = await getOrCreateCart(req.user._id);

    cart = await synchronizeCart(cart);

    await populateCart(cart);

    return res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load your cart.",
    });
  }
};

/**
 * POST /api/cart
 *
 * Add product to cart.
 *
 * Body:
 * {
 *   "productId": "...",
 *   "quantity": 1
 * }
 */
const addToCart = async (req, res) => {
  try {
    const {
      productId,
      quantity = 1,
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a whole number greater than zero.",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "This product is currently out of stock.",
      });
    }

    let cart = await getOrCreateCart(req.user._id);

    const existingItem = cart.items.find(
      (item) =>
        item.product.toString() === product._id.toString()
    );

    const currentPrice = getProductPrice(product);

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + requestedQuantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} item(s) are available in stock.`,
        });
      }

      existingItem.quantity = newQuantity;
      existingItem.unitPrice = currentPrice;
    } else {
      if (requestedQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} item(s) are available in stock.`,
        });
      }

      cart.items.push({
        product: product._id,
        quantity: requestedQuantity,
        unitPrice: currentPrice,
      });
    }

    cart.updatedFromClientAt = new Date();

    await cart.save();

    await populateCart(cart);

    return res.status(200).json({
      success: true,
      message: "Product added to cart.",
      cart,
    });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    console.error("Add to cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add product to cart.",
    });
  }
};

/**
 * PUT /api/cart/:productId
 *
 * Set exact product quantity.
 *
 * Body:
 * {
 *   "quantity": 3
 * }
 */
const updateCartItem = async (req, res) => {
  try {
    const {
      productId,
    } = req.params;

    const {
      quantity,
    } = req.body;

    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a whole number greater than zero.",
      });
    }

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (product.stock <= 0) {
      return res.status(400).json({
        success: false,
        message: "This product is currently out of stock.",
      });
    }

    if (requestedQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) are available in stock.`,
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.find(
      (cartItem) =>
        cartItem.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your cart.",
      });
    }

    item.quantity = requestedQuantity;
    item.unitPrice = getProductPrice(product);

    cart.updatedFromClientAt = new Date();

    await cart.save();

    await populateCart(cart);

    return res.status(200).json({
      success: true,
      message: "Cart updated successfully.",
      cart,
    });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    console.error(
      "Update cart item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to update cart item.",
    });
  }
};

/**
 * PATCH /api/cart/:productId/increment
 */
const incrementCartItem = async (req, res) => {
  try {
    const {
      productId,
    } = req.params;

    const product = await Product.findById(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.find(
      (cartItem) =>
        cartItem.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your cart.",
      });
    }

    if (item.quantity >= product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} item(s) are available in stock.`,
      });
    }

    item.quantity += 1;
    item.unitPrice = getProductPrice(product);

    cart.updatedFromClientAt = new Date();

    await cart.save();

    await populateCart(cart);

    return res.status(200).json({
      success: true,
      message: "Product quantity increased.",
      cart,
    });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    console.error(
      "Increment cart item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to increase product quantity.",
    });
  }
};

/**
 * PATCH /api/cart/:productId/decrement
 *
 * If quantity reaches zero, product is removed.
 */
const decrementCartItem = async (req, res) => {
  try {
    const {
      productId,
    } = req.params;

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const itemIndex = cart.items.findIndex(
      (cartItem) =>
        cartItem.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your cart.",
      });
    }

    const item = cart.items[itemIndex];

    if (item.quantity <= 1) {
      cart.items.splice(itemIndex, 1);
    } else {
      item.quantity -= 1;

      const product = await Product.findById(productId);

      if (product && product.isActive) {
        item.unitPrice = getProductPrice(product);
      }
    }

    cart.updatedFromClientAt = new Date();

    await cart.save();

    await populateCart(cart);

    return res.status(200).json({
      success: true,
      message:
        item.quantity <= 1
          ? "Product removed from cart."
          : "Product quantity decreased.",
      cart,
    });
  } catch (error) {
    if (error?.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    console.error(
      "Decrement cart item error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to decrease product quantity.",
    });
  }
};

/**
 * DELETE /api/cart/:productId
 *
 * Remove one product completely.
 */
const removeFromCart = async (req, res) => {
  try {
    const {
      productId,
    } = req.params;

    const cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== productId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your cart.",
      });
    }

    cart.updatedFromClientAt = new Date();

    await cart.save();

    await populateCart(cart);

    return res.status(200).json({
      success: true,
      message: "Product removed from cart.",
      cart,
    });
  } catch (error) {
    console.error(
      "Remove from cart error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to remove product from cart.",
    });
  }
};

/**
 * DELETE /api/cart
 *
 * Clear complete cart.
 */
const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      user: req.user._id,
    });

    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: [],
      });
    } else {
      cart.items = [];
      cart.updatedFromClientAt = new Date();

      await cart.save();
    }

    await populateCart(cart);

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      cart,
    });
  } catch (error) {
    console.error(
      "Clear cart error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to clear cart.",
    });
  }
};

/**
 * GET /api/cart/summary
 *
 * Checkout-ready cart summary.
 */
const getCartSummary = async (req, res) => {
  try {
    let cart = await getOrCreateCart(req.user._id);

    cart = await synchronizeCart(cart);

    await populateCart(cart);

    const summary = {
      totalItems: cart.totalItems,
      subtotal: cart.subtotal,
      isEmpty: cart.items.length === 0,
    };

    return res.status(200).json({
      success: true,
      summary,
      cart,
    });
  } catch (error) {
    console.error(
      "Cart summary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to prepare cart summary.",
    });
  }
};

export {
  getCart,
  addToCart,
  updateCartItem,
  incrementCartItem,
  decrementCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
};