const asyncHandler = require("express-async-handler");
// Change this line - import from models/index.js instead of config/db
const db = require("../models/index");

const getOrders = asyncHandler(async (req, res) => {
  console.log("Fetching orders with query:", req.query);
  
  // Debug: Check if models are loaded
  console.log("Available models:", Object.keys(db));
  console.log("Order model exists:", !!db.Order);
  
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status;
  const simple = req.query.simple === "true";

  const where = {};
  if (status) {
    console.log("Applying status filter:", status);
    where.status = status;
  }

  let ordersQuery = {
    where,
    limit,
    offset: (page - 1) * limit,
  };

  try {
    console.log("Attempting query without includes:", JSON.stringify(ordersQuery, null, 2));
    let { count: total, rows: orders } = await db.Order.findAndCountAll(ordersQuery);

    if (!simple) {
      ordersQuery.include = [];

      console.log("Adding User include...");
      ordersQuery.include.push({
        model: db.User,
        as: "user",
        attributes: ["name", "email"],
      });
      ({ count: total, rows: orders } = await db.Order.findAndCountAll(ordersQuery));

      console.log("Adding OrderItems include...");
      ordersQuery.include.push({
        model: db.OrderItems,
        as: "orderItems",
        include: [
          { model: db.Product, as: "product", attributes: ["id", "name", "image"] },
        ],
      });
      ({ count: total, rows: orders } = await db.Order.findAndCountAll(ordersQuery));
    }

    console.log("Fetched orders count:", total);
    console.log("Orders data:", JSON.stringify(orders, null, 2));
    res.json({
      orders,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalOrders: total,
    });
  } catch (error) {
    console.error("Error in getOrders:", error.message);
    console.error("Stack trace:", error.stack);
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  const order = await db.Order.findByPk(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;
  await order.save();

  res.json({ message: "Order status updated", order });
});

module.exports = { getOrders, updateOrderStatus };