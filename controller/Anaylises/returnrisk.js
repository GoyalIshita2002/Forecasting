const { Sale,Product } = require('../../connection/connection.js');

const returnrisk = async (req, res) => {
    try {
      const products = await Product.findAll();
  
      const productInventory = products.reduce((acc, product) => {
        if (!acc[product.name]) {
          acc[product.name] = {
            productName: product.name,
            productPrice: product.price,
            totalQuantity: 0,
            totalQuantitySold: 0,
          };
        }
        acc[product.name].totalQuantity += product.quantity;
        return acc;
      }, {});
  
      const productIds = products.map((product) => product.id);
      const sales = await Sale.findAll({ where: { productId: productIds } });
  
      sales.forEach((sale) => {
        const product = products.find((product) => product.id === sale.productId);
        if (product) {
          productInventory[product.name].totalQuantitySold += sale.quantitySold;
        }
      });
  
      const currentInventory = Object.values(productInventory).map((item) => {
        const currentStock = item.totalQuantity;
        const totalSold = item.totalQuantitySold;
        let returnRisk;
  
        const soldToStockRatio = totalSold / currentStock;
        
        if (soldToStockRatio > 0.75) {
          returnRisk = 'High';
        } else if (soldToStockRatio > 0.5) {
          returnRisk = 'Medium';
        } else {
          returnRisk = 'Low';
        }
  
        return {
          productName: item.productName,
          totalQuantitySold: totalSold,
          currentStock: currentStock,
          returnRisk: returnRisk,
        };
      });
  
      res.status(200).json({ currentInventory });
    } catch (error) {
      console.error('Error calculating inventory:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };
  
  module.exports = { returnrisk };
  

