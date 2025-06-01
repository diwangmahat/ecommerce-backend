const app = require("./app");
const http = require("http");
const { Server } = require("socket.io");
const sequelize = require("./config/db");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Order = require("./models/Order");
const OrderItems = require("./models/OrderItems");
const Product = require("./models/Product");

// Set up a db object for consistency
const db = {
  sequelize,
  Sequelize: sequelize.constructor,
  User,
  Order,
  OrderItems,
  Product,
};

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Server and Socket.io setup
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected to admin dashboard");

  socket.on("join-admin", () => {
    socket.join("admin-room");
    console.log("Admin joined admin room");
  });

  socket.on("order-updated", (order) => {
    io.to("admin-room").emit("order-changed", order);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

app.set("io", io);

// Sync database and start server
sequelize
  .sync({ alter: true }) // Use { force: true } only for testing to recreate tables
  .then(() => {
    console.log("Database synced with models");
    server.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}\nhttp://localhost:${PORT}`
      );
    });
  })
  .catch((err) => {
    console.error("Error syncing database:", err.message);
    console.error("Stack trace:", err.stack);
  });