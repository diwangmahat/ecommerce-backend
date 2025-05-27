const express = require('express');
const cors = require('cors');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Database connection
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

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

// Test DB connection and set up associations
db.authenticate()
  .then(() => {
    console.log('Database connected...');
    
    // Set up associations
    Object.keys(models).forEach(modelName => {
      if (typeof models[modelName].associate === 'function') {
        models[modelName].associate(models);
      }
    });

    // Sync models
    return db.sync({ alter: true });
  })
  .then(() => console.log('Models synced...'))
  .catch(err => console.log('Error: ' + err));


// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);


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