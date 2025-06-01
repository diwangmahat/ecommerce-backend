module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define("Order", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    paymentIntentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    // Add alias for frontend compatibility
    totalPrice: {
      type: DataTypes.VIRTUAL,
      get() {
        return this.totalAmount;
      },
      set(value) {
        this.setDataValue('totalAmount', value);
      }
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
    paymentStatus: {
      type: DataTypes.STRING,
      defaultValue: "pending",
    },
  });

  Order.associate = (models) => {
    Order.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });
    Order.hasMany(models.OrderItems, {
      foreignKey: "orderId",
      as: "orderItems",
    });
  };

  return Order;
};