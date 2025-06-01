module.exports = (sequelize, DataTypes) => {
  const OrderItems = sequelize.define("OrderItems", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
    },
    size: {
      type: DataTypes.STRING,
    },
    color: {
      type: DataTypes.STRING,
    },
  });

  OrderItems.associate = (models) => {
    OrderItems.belongsTo(models.Order, {
      foreignKey: "orderId",
    });
    OrderItems.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  };

  return OrderItems;
};