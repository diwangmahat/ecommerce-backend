// controllers/orderController.js
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const stripe = require('../config/stripe');
const { Order, OrderItems, User, Product } = require('../models');

const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, customerEmail, customerName, totalAmount } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error('No order items');
  }

  const transaction = await Order.sequelize.transaction();
  try {
    const order = await Order.create(
      {
        userId: req.user.id,
        customerEmail: customerEmail || req.user.email,
        customerName: customerName || req.user.name,
        totalAmount,
        status: 'pending',
        paymentStatus: 'pending',
      },
      { transaction }
    );

    const orderItemsData = orderItems.map((item) => ({
      orderId: order.id,
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || null,
      size: item.size || null,
      color: item.color || null,
    }));

    await OrderItems.bulkCreate(orderItemsData, { transaction });
    await transaction.commit();
    res.status(201).json({
      id: order.id,
      userId: order.userId,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      totalAmount: order.totalAmount,
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderItems: orderItemsData,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating order:', error);
    res.status(500).json({ error: `Failed to create order: ${error.message}` });
  }
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id, {
    include: [
      { model: User, attributes: ['name', 'email'] },
      { model: OrderItems, as: 'orderItems', include: [{ model: Product, attributes: ['id', 'name', 'image'] }] },
    ],
  });

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    res.status(401);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = 'paid';
  order.paymentStatus = 'completed';
  order.updatedAt = new Date();

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findByPk(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  order.status = 'delivered';
  order.updatedAt = new Date();

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    include: [{ model: OrderItems, as: 'orderItems' }],
  });
  res.json(orders);
});

const getOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10, paymentIntentId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (paymentIntentId) where.paymentIntentId = paymentIntentId;

  const orders = await Order.findAll({
    where,
    include: [
      { model: User, attributes: ['name', 'email'] },
      { model: OrderItems, as: 'orderItems', include: [{ model: Product, attributes: ['id', 'name', 'image'] }] },
    ],
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
  });

  const count = await Order.count({ where });

  res.json({
    orders,
    totalPages: Math.ceil(count / limit),
    currentPage: parseInt(page),
    totalOrders: count,
  });
});

const getSalesStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.count();
  const totalSales = await Order.sum('totalAmount');
  const pendingOrders = await Order.count({ where: { status: 'pending' } });

  res.json({ totalOrders, totalSales, pendingOrders });
});

const handleStripeWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      const order = await Order.findOne({ where: { paymentIntentId: paymentIntent.id } });
      if (order) {
        order.status = 'paid';
        order.paymentStatus = 'completed';
        await order.save();
        console.log(`Order ${order.id} marked as paid for payment intent ${paymentIntent.id}`);
      } else {
        console.warn(`No order found for payment intent ${paymentIntent.id}`);
      }
      break;
    case 'payment_intent.payment_failed':
      console.log(`PaymentIntent failed: ${paymentIntent.id}`);
      break;
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
  getSalesStats,
  handleStripeWebhook,
};