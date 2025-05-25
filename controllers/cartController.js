const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  const cartItems = await Cart.findAll({
    where: { userId: req.user.id },
    include: [{ model: Product }]
  });

  res.json(cartItems);
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  const product = await Product.findByPk(productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  if (product.countInStock < quantity) {
    res.status(400);
    throw new Error('Not enough stock available');
  }

  const cartItem = await Cart.findOne({
    where: { userId: req.user.id, productId }
  });

  if (cartItem) {
    cartItem.quantity += quantity;
    await cartItem.save();
    res.json(cartItem);
  } else {
    const newCartItem = await Cart.create({
      userId: req.user.id,
      productId,
      quantity
    });
    res.status(201).json(newCartItem);
  }
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:id
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;

  const cartItem = await Cart.findOne({
    where: { id: req.params.id, userId: req.user.id },
    include: [{ model: Product }]
  });

  if (!cartItem) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  if (cartItem.Product.countInStock < quantity) {
    res.status(400);
    throw new Error('Not enough stock available');
  }

  cartItem.quantity = quantity;
  await cartItem.save();

  res.json(cartItem);
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeFromCart = asyncHandler(async (req, res) => {
  const cartItem = await Cart.findOne({
    where: { id: req.params.id, userId: req.user.id }
  });

  if (!cartItem) {
    res.status(404);
    throw new Error('Cart item not found');
  }

  await cartItem.destroy();
  res.json({ message: 'Item removed from cart' });
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};