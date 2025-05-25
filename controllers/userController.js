const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Order = require('../models/Order');

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ['password'] },
    order: [['createdAt', 'DESC']]
  });
  res.json(users);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  });

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;

    const updatedUser = await user.save();

    res.json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// Delete user

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (user) {
    await user.destroy();
    res.json({ message: 'User removed' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});


// @desc    Get user statistics with order data
// @route   GET /api/users/stats
//@access    Private/Admin
const getUserStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.count();
  const adminUsers = await User.count({ where: { role: 'admin' } });
  const regularUsers = totalUsers - adminUsers;
  
  // Get users with their order counts
  const activeUsers = await User.findAll({
    attributes: [
      'id',
      'name',
      'email',
      [sequelize.fn('COUNT', sequelize.col('Orders.id')), 'orderCount']
    ],
    include: [{
      model: Order,
      attributes: [],
      required: false
    }],
    group: ['User.id'],
    order: [[sequelize.literal('orderCount'), 'DESC']],
    limit: 5
  });
  
  res.json({
    totalUsers,
    adminUsers,
    regularUsers,
    activeUsers
  });
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
};