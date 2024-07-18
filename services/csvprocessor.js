const fs = require('fs');
const csv = require('csv-parser');
const { Product, Sale } = require('../connection/connection.js'); 

const columnMappings = {
  quantitySold: ['quantity', 'qtySold', 'qty', 'Units Sold'],
  sellingPrice: ['price', 'sellingPrice', 'Total Revenue'],
  salesDate: ['date', 'salesDate', 'Order Date'],
  productName: ['productName', 'product', 'Item Type'],
  productPrice: ['Unit Cost', 'productPrice', 'price'],
  productDescription: ['description', 'desc', 'Sales Channel'],
  productQuantity: ['productQty', 'quantity', 'Product Quantity']
};

function findColumnData(entry, possibleColumns) {
  let value = null;
  possibleColumns.some(column => {
    if (entry.hasOwnProperty(column)) {
      value = entry[column];
      return true;
    }
    return false;
  });
  return value !== null && value !== undefined ? value : '';
}

async function handleData(results) {
  return Promise.all(results.map(async (entry) => {
    const productData = {
      name: findColumnData(entry, columnMappings.productName),
      price: parseFloat(findColumnData(entry, columnMappings.productPrice)) || 0,
      description: findColumnData(entry, columnMappings.productDescription) || '',
      quantity: parseInt(findColumnData(entry, columnMappings.productQuantity), 10) || 0
    };

    if (!productData.name || productData.price === 0 || !productData.description || productData.quantity === 0) {
      console.error('Invalid product data:', productData);
      return;
    }

    const product = await Product.create(productData);

    const salesData = {
      quantitySold: parseInt(findColumnData(entry, columnMappings.quantitySold), 10) || 0,
      sellingPrice: parseFloat(findColumnData(entry, columnMappings.sellingPrice)) || 0,
      salesDate: new Date(findColumnData(entry, columnMappings.salesDate)) || new Date(),
      productId: product.id
    };

    if (salesData.quantitySold === 0 || salesData.sellingPrice === 0 || isNaN(salesData.salesDate.getTime())) {
      console.error('Invalid sales data:', salesData);
      return;
    }

    await Sale.create(salesData);
  }));
}

function processCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        handleData(results).then(resolve).catch(reject);
      })
      .on('error', reject);
  });
}

module.exports = {
  processCSV
};
