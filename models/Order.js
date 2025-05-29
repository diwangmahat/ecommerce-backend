const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Order = db.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  paymentIntentId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  customerEmail: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  customerName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalAmount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

Order.associate = function(models) {
  Order.belongsTo(models.User, {
    foreignKey: 'userId',
    onDelete: 'SET NULL'
  });

  Order.hasMany(models.OrderItem, {
    foreignKey: 'orderId',
    as: 'orderItems', // Changed from 'orderItem' to 'orderItems' for consistency
    onDelete: 'CASCADE'
  });
};

module.exports = Order;