const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/db');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Product = require('./models/Product');
const Review = require('./models/Review');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItems');

// Set up associations
const models = { User, Product, Review, Order, OrderItem };
Object.keys(models).forEach(modelName => {
  if (typeof models[modelName].associate === 'function') {
    models[modelName].associate(models);
  }
});

// Server and Socket.io setup
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected to admin dashboard');

  socket.on('join-admin', () => {
    socket.join('admin-room');
    console.log('Admin joined admin room');
  });

  socket.on('order-updated', (order) => {
    io.to('admin-room').emit('order-changed', order);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.set('io', io);

  sequelize.sync({ force: true }) 
  .then(() => {
    console.log('Database synced with models');

    server.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}
http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });
