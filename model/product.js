module.exports = (sequelize, DataTypes) => {
    const Product = sequelize.define('Product', {
      id: { 
        type: DataTypes.INTEGER,
        primaryKey: true, 
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0     
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      tableName: 'products',
      timestamps: true 
    }); 
  
    return Product;
  };
  
