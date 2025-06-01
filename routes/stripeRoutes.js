// backend/routes/stripeRoutes.js
const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Order, OrderItems } = require('../models');

// @desc    Create a payment intent
// @route   POST /api/stripe/create-payment-intent
// @access  Private
router.post('/create-payment-intent', asyncHandler(async (req, res) => {
  const { amount, currency = 'usd', metadata } = req.body;

  if (!amount || amount <= 0) {
    res.status(400);
    throw new Error('Invalid amount');
  }

  if (!metadata || !metadata.customerEmail || !metadata.customerName || !metadata.orderItems) {
    res.status(400);
    throw new Error('Missing required metadata');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      payment_method_types: ['card'],
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      mock: !process.env.STRIPE_SECRET_KEY?.startsWith('sk_'),
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500);
    throw new Error('Failed to create payment intent');
  }
}));

// @desc    Confirm payment and create order
// @route   POST /api/stripe/confirm-payment
// @access  Private
router.post('/confirm-payment', asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  const user = req.user;

  if (!paymentIntentId) {
    res.status(400);
    throw new Error('Payment intent ID is required');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      res.status(400);
      throw new Error('Payment not successful');
    }

    const { customerEmail, customerName, orderItems, userId } = paymentIntent.metadata;
    const parsedOrderItems = JSON.parse(orderItems);

    const order = await Order.create({
      userId: userId || user?.id,
      paymentIntentId,
      customerEmail,
      customerName,
      totalAmount: paymentIntent.amount / 100,
      status: 'paid',
      paymentStatus: 'completed',
    });

    const orderItemsData = parsedOrderItems.map(item => ({
      orderId: order.id,
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.onSale && item.salePrice != null ? item.salePrice : item.price, // Use salePrice if onSale
      image: item.image,
      size: item.size,
      color: item.color,
    }));

    await OrderItems.bulkCreate(orderItemsData);

    res.json({
      orderId: order.id,
      customerEmail,
      customerName,
      totalAmount: order.totalAmount,
      orderItems: orderItemsData,
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500);
    throw new Error('Failed to confirm payment');
  }
}));

// @desc    Get payment intent details
// @route   GET /api/stripe/payment-intents/:id
// @access  Private
router.get('/payment-intents/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(id);
    res.json(paymentIntent);
  } catch (error) {
    console.error('Error retrieving payment intent:', error);
    res.status(404);
    throw new Error('Payment intent not found');
  }
}));

module.exports = router;