const { DataTypes } = require('sequelize');
const db = require('../config/db');

const OrderItem = db.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: false
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

OrderItem.associate = function(models) {
  OrderItem.belongsTo(models.Order, {
    foreignKey: 'orderId',
    onDelete: 'CASCADE',
    as: 'order' // ✅ Different alias
  });
  OrderItem.belongsTo(models.Product, {
    foreignKey: 'productId',
    onDelete: 'SET NULL',
    as: 'product'
  });
};

module.exports = OrderItem;
