// stripeRoutes.js
const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const { protect } = require('../middleware/authMiddleware');
const Order = require('../models/Order');

// Existing routes
router.post('/create-payment-intent', protect, async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata } = req.body;

    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...metadata,
        userId: req.user.id.toString(),
      },
      payment_method_types: ['card'],
      description: `Order for ${metadata.customerEmail}`,
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/confirm-payment', protect, async (req, res) => {
  const transaction = await Order.sequelize.transaction();
  try {
    const { paymentIntentId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not succeeded' });
    }

    const { customerEmail, customerName, orderItems, userId: metadataUserId } = paymentIntent.metadata;

    if (parseInt(metadataUserId) !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const items = JSON.parse(orderItems);
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await Order.create(
      {
        userId: req.user.id,
        customerEmail,
        customerName,
        paymentIntentId,
        totalAmount,
        status: 'paid',
        paymentStatus: 'completed',
      },
      { transaction }
    );

    const orderItemsData = items.map((item) => ({
      orderId: order.id,
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || '',
      size: item.size,
      color: item.color,
    }));

    await Order.OrderItem.bulkCreate(orderItemsData, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      orderId: order.id,
      paymentIntentId,
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// New route to fetch payment intent details
router.get('/payment-intents/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    if (paymentIntent.metadata.userId !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;