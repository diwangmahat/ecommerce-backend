// server.js
const app = require('./app');
const http = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/db');
require('dotenv').config();

// Server and Socket.io setup
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
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

sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('Database synced with models');
    server.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}\nhttp://localhost:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });