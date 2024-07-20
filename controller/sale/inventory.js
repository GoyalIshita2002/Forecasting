const { Sale,Product } = require('../../connection/connection.js');

const TotalInventory = async (req, res) => {
    try {
        const products = await Product.findAll();

        const productInventory = products.reduce((acc, product) => {
            if (!acc[product.name]) {
                acc[product.name] = {
                    productName: product.name,
                    productPrice: product.price,
                    totalQuantity: 0,
                    totalQuantitySold: 0
                };
            }
            acc[product.name].totalQuantity += product.quantity;
            return acc;
        }, {});

        const productIds = products.map(product => product.id);
        const sales = await Sale.findAll({ where: { productId: productIds } });

        sales.forEach(sale => {
            const product = products.find(product => product.id === sale.productId);
            if (product) {
                productInventory[product.name].totalQuantitySold += sale.quantitySold;
            }
        });

        let totalInventoryValue = 0;
        const currentInventory = Object.values(productInventory).map(item => {
            const overallQuantity = item.totalQuantity + item.totalQuantitySold;
            const productValue = overallQuantity * item.productPrice;
            totalInventoryValue += productValue;
            
            return {
                productName: item.productName,
                totalQuantitySold: item.totalQuantitySold,
                currentStock: item.totalQuantity,
                overallQuantity: item.totalQuantity + item.totalQuantitySold,
                cost: item.productPrice,
                productInventory: productValue
            };
        });

        res.status(200).json({ currentInventory, totalInventoryValue });
    } catch (error) {
        console.error('Error calculating inventory:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};



module.exports = { TotalInventory };
