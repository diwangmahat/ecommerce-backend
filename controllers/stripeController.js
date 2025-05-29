const stripe = require('../config/stripe');
const { Order, OrderItem } = require('../models');

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', metadata } = req.body;
    const userId = req.user.id;

    // Validate amount (minimum $0.50)
    if (!amount || amount < 50) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: {
        ...metadata,
        userId: userId.toString()
      },
      payment_method_types: ['card'],
      description: `Order for ${metadata.customerEmail}`
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.confirmPayment = async (req, res) => {
  const transaction = await db.transaction();
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not succeeded' });
    }

    // Extract order details from metadata
    const { customerEmail, customerName, orderItems, userId: metadataUserId } = paymentIntent.metadata;
    
    // Verify user owns this payment intent
    if (parseInt(metadataUserId) !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const items = JSON.parse(orderItems);
    const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create order in database
    const order = await Order.create({
      userId,
      paymentIntentId,
      customerEmail,
      customerName,
      totalAmount,
      status: 'paid',
      paymentStatus: 'completed'
    }, { transaction });

    // Create order items
    const orderItemsData = items.map(item => ({
      orderId: order.id,
      productId: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      image: item.image || '',
      size: item.size,
      color: item.color
    }));

    await OrderItem.bulkCreate(orderItemsData, { transaction });

    await transaction.commit();

    res.json({ 
      success: true,
      orderId: order.id,
      paymentIntentId 
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error confirming payment:', error);
    res.status(500).json({ error: error.message });
  }
};