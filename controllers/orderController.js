const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const stripe = require('../config/stripe');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice
  } = req.body;

  if (orderItems && orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  } else {
    const order = await Order.create({
      userId: req.user.id,
      orderItems,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice
    });
  }
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [{ model: User, attributes: ['name', 'email'] }]
  });

  if (order) {
    if (order.userId === req.user.id || req.user.role === 'admin') {
      res.json(order);
    } else {
      res.status(401);
      throw new Error('Not authorized to view this order');
    }
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);

  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.payer.email_address
    };

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();

    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({ where: { userId: req.user.id } });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  const where = {};
  if (status === 'paid') where.isPaid = true;
  if (status === 'delivered') where.isDelivered = true;
  if (status === 'pending') where.isPaid = false;
  
  const orders = await Order.findAll({
    where,
    include: [{ model: User, attributes: ['name', 'email'] }],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
  
  const count = await Order.count({ where });
  
  res.json({
    orders,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    totalOrders: count
  });
});

// @desc    Get sales statistics
// @route   GET /api/orders/stats
// @access  Private/Admin
const getSalesStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.count();
  const totalSales = await Order.sum('totalPrice');
  const pendingOrders = await Order.count({ where: { isDelivered: false } });
  
  res.json({ totalOrders, totalSales, pendingOrders });
}); 

// @desc    Create Stripe payment intent
// @route   POST /api/orders/create-payment-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
  const { totalAmount } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: totalAmount * 100, // Convert to cents
    currency: 'usd',
    metadata: { integration_check: 'accept_a_payment' }
  });

  res.json({ clientSecret: paymentIntent.client_secret });
});

// @desc    Handle Stripe webhook
// @route   POST /api/orders/webhook
// @access  Public
const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Update order status in your database
      // You might want to match the paymentIntent.id with a reference in your order
      console.log('PaymentIntent was successful!');
      break;
    case 'payment_method.attached':
      const paymentMethod = event.data.object;
      console.log('PaymentMethod was attached to a Customer!');
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
  createPaymentIntent,
  handleStripeWebhook,
  getSalesStats
};