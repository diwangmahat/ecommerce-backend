const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');

exports.getOverview = async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const ordersCount = await Order.countDocuments();
    const productsCount = await Product.countDocuments();

    res.json({ usersCount, ordersCount, productsCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const users = await User.find({}, 'createdAt');
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const orders = await Order.find({}, 'totalPrice createdAt');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductStats = async (req, res) => {
  try {
    const products = await Product.find({}, 'name sold createdAt');
    res.json({ products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRevenueStats = async (req, res) => {
  try {
    const orders = await Order.find({}, 'totalPrice createdAt');
    const revenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    res.json({ totalRevenue: revenue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
