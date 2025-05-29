const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

require('dotenv').config();
const app = express();

// Database connection
const db = require('./config/db');


// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const stripeRoutes = require('./routes/stripeRoutes');

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Review = require('./models/Review');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItems');



// Get all models
const models = {
  User,
  Product,
  Review,
  Order,
  OrderItem,
};

// Middleware
app.use(cors({
  origin: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payment', stripeRoutes);



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
  });
}

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;