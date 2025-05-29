const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');

// Create payment intent
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata } = req.body;

    // Validate amount
    if (!amount || amount < 50) { // Minimum charge is $0.50
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      payment_method_types: ['card'],
      description: `Order for ${metadata.customerEmail}`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Confirm payment and create order
router.post('/confirm-payment', protect, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not succeeded' });
    }

    // Extract order details from metadata
    const { customerEmail, customerName, orderItems } = paymentIntent.metadata;
    const items = JSON.parse(orderItems);

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    // Create order in database
    const order = await Order.create({
      user: req.user.id,
      customerEmail,
      customerName,
      paymentIntentId,
      items,
      totalAmount,
      status: 'paid',
      paymentStatus: 'completed'
    });

    res.json({ 
      success: true,
      orderId: order._id,
      paymentIntentId 
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;