module.exports = (sequelize, DataTypes) => {
    const Sale = sequelize.define('Sale', {
      id: { 
        type: DataTypes.INTEGER,
        primaryKey: true, 
        autoIncrement: true
      },
      quantitySold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      sellingPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0     
      },
      salesDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    }, {
      tableName: 'sales',
      timestamps: true 
    }); 
  
    return Sale;
  };
  
  