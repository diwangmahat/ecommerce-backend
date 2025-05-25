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
  // ... other fields
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
    as: 'orderItems', 
    onDelete: 'CASCADE'
  });
};

module.exports = Order;
