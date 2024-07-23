const { Sale, Product } = require('../../connection/connection.js');
const { Op } = require('sequelize');
const moment = require('moment');

const calculateMovingAverage = (sales, days) => {
    if (sales.length < days) {
        console.log("Not enough data to calculate the moving average for the specified number of days");
        return 0; 
    }
    const sortedSales = sales.sort((a, b) => new Date(a.salesDate) - new Date(b.salesDate));
    const movingAverages = [];
    for (let i = days - 1; i < sortedSales.length; i++) {
        let sum = 0;
        for (let j = 0; j < days; j++) {
            sum += sortedSales[i - j].quantitySold;
        }
        const average = sum / days;
        movingAverages.push(average);
    }
    const overallAverage = movingAverages.reduce((a, b) => a + b, 0) / movingAverages.length;
    return overallAverage;
};
  

// Helper function for exponential smoothing
const calculateExponentialSmoothing = (data, alpha) => {
  const result = [{ date: data[0].salesDate, value: data[0].quantitySold }];
  for (let i = 1; i < data.length; i++) {
    const smoothedValue = alpha * data[i].quantitySold + (1 - alpha) * result[i - 1].value;
    result.push({ date: data[i].salesDate, value: smoothedValue });
  }
  return result;
};

// Helper function for seasonal decomposition
const seasonalDecomposition = (data, period) => {
  const seasonal = [];
  const trend = [];
  const residual = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period || i >= data.length - period) {
      seasonal.push({ date: data[i].salesDate, value: null });
      trend.push({ date: data[i].salesDate, value: null });
      residual.push({ date: data[i].salesDate, value: null });
    } else {
      const seasonSum = [];
      for (let j = i - period; j < i + period; j++) {
        seasonSum.push(data[j].quantitySold);
      }
      const seasonAvg = seasonSum.reduce((acc, val) => acc + val, 0) / (2 * period);
      trend.push({ date: data[i].salesDate, value: seasonAvg });
      seasonal.push({ date: data[i].salesDate, value: data[i].quantitySold - seasonAvg });
      residual.push({ date: data[i].salesDate, value: data[i].quantitySold - seasonAvg - seasonal[seasonal.length - 1].value });
    }
  }
  return { seasonal, trend, residual };
};


const predictOutOfStockDate = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findByPk(productId);
  
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
  
        const productName = product.name;
        const products = await Product.findAll({
            where: { name: productName }
        });
  
        const totalQuantity = products.reduce((acc, product) => acc + product.quantity, 0);
        const productIds = products.map(product => product.id);
  
        const salesData = await Sale.findAll({
            where: {
                productId: {
                    [Op.in]: productIds
                }
            },
            attributes: ['quantitySold', 'salesDate'],
            order: [['salesDate', 'ASC']]
        });

        if (salesData.length === 0) {
            return res.status(200).json({ productName, message: "No sales data available to predict out-of-stock date" });
        }

        // Use moving average to calculate average daily sales more accurately
        const daysForMovingAverage = 1; // You can adjust this value based on typical sales cycle length
        const averageDailySales = calculateMovingAverage(salesData, daysForMovingAverage);

        if (averageDailySales === 0) {
            return res.status(200).json({ productName, message: "Insufficient sales data to predict an accurate out-of-stock date." });
        }

        const daysToOutOfStock = totalQuantity / averageDailySales;
        const outOfStockDate = new Date();
        outOfStockDate.setDate(outOfStockDate.getDate() + Math.ceil(daysToOutOfStock));
  
        return res.status(200).json({
            productName,
            outOfStockDate: outOfStockDate.toISOString().split('T')[0] // Format the date to YYYY-MM-DD
        });
    } catch (error) {
        return res.status(500).json({ message: "Error predicting out-of-stock date", error: error.message });
    }
};

// 2. Demand on a specific date for all products
const demandOnSpecificDate = async (req, res) => {
    try {
      const { date } = req.query;  // Extract date from query parameters
  
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required." });
      }
  
      // Parse the date string with strict parsing
      const parsedDate = moment(date, 'DD-MM-YYYY', true);
  
      if (!parsedDate.isValid()) {
        return res.status(400).json({ message: "Invalid date format. Please use DD-MM-YYYY format." });
      }
  
      const formattedDate = parsedDate.format('YYYY-MM-DD');
  
      // Fetch sales data for the specified date
      const salesData = await Sale.findAll({
        where: {
          salesDate: {
            [Op.eq]: formattedDate
          }
        },
        include: [Product]
      });
  
      // Aggregate sales data by product name
      const demandMap = {};
      salesData.forEach(sale => {
        const { productId, quantitySold, Product: { name: productName } } = sale;
        if (!demandMap[productName]) {
          demandMap[productName] = {
            productName,
            productIds: new Set(),
            totalQuantitySold: 0
          };
        }
        demandMap[productName].productIds.add(productId);
        demandMap[productName].totalQuantitySold += quantitySold;
      });
  
      // Convert demandMap to an array
      const demand = Object.values(demandMap).map(d => ({
        productName: d.productName,
        productIds: Array.from(d.productIds),
        totalQuantitySold: d.totalQuantitySold
      }));
  
      return res.status(200).json({ demand });
    } catch (error) {
      console.error("Error fetching demand data:", error);
      return res.status(500).json({ message: "Error fetching demand data", error: error.message });
    }
  };

  const singleProductDemand = async (req, res) => {
    try {
      const { productId } = req.params;
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const productName = product.name;
      const allProducts = await Product.findAll({
        where: { name: productName }
      });
      const productIds = allProducts.map(item => item.id);
      const salesData = await Sale.findAll({
        where: {
          productId: {
            [Op.in]: productIds
          }
        },
        attributes: ['quantitySold', 'salesDate'],
        order: [['salesDate', 'ASC']]
      });
      if (salesData.length === 0) {
        return res.status(404).json({ message: "No sales data found for the specified product" });
      }
      return res.status(200).json({ salesData });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching sales data", error: error.message });
    }
  };
  

  const stockRequirementOnDate = async (req, res) => {
    try {
      const { productId } = req.params;
      const { date } = req.query;   
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }
      const parsedDate = moment(date, 'DD-MM-YYYY', true);
      if (!parsedDate.isValid()) {
        return res.status(400).json({ message: "Invalid date format. Please use DD-MM-YYYY format." });
      }
      const formattedDate = parsedDate.format('YYYY-MM-DD');
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      const allProducts = await Product.findAll({ where: { name: product.name } });
      if (!allProducts.length) {
        return res.status(404).json({ message: "No products found with the given name" });
      }
      const totalQuantity = allProducts.reduce((acc, item) => acc + item.quantity, 0);
      const productIds = allProducts.map(item => item.id);
      const salesData = await Sale.findAll({
        where: { productId: { [Op.in]: productIds } },
        attributes: ['quantitySold', 'salesDate'],
        order: [['salesDate', 'ASC']]
      });
  
      if (salesData.length === 0) {
        return res.status(200).json({
          productName: product.name,
          date: formattedDate,
          stockStatus: 'No sales data available'
        });
      }
      const averageDailySales = calculateMovingAverage(salesData, 1);
      const salesByDate = salesData.reduce((acc, sale) => {
        const saleDate = sale.salesDate.toISOString().split('T')[0];
        acc[saleDate] = (acc[saleDate] || 0) + sale.quantitySold;
        return acc;
      }, {});
      const daysToOutOfStock = totalQuantity / averageDailySales;
      const outOfStockDate = new Date();
      outOfStockDate.setDate(outOfStockDate.getDate() + Math.ceil(daysToOutOfStock));
      const formattedOutOfStockDate = outOfStockDate.toISOString().split('T')[0];
      if (formattedDate > formattedOutOfStockDate) {
        const additionalDays = moment(formattedDate).diff(moment(formattedOutOfStockDate), 'days');
        const requiredStock = additionalDays * averageDailySales;
        return res.status(200).json({
          productName: product.name,
          date: formattedDate,
          stockStatus: `Reorder required: ${Math.ceil(requiredStock)}`,
          averageDailySales
        });
      } else {
        const salesUpToDate = Object.keys(salesByDate)
          .filter(date => date <= formattedDate)
          .reduce((acc, date) => acc + salesByDate[date], 0); 
        const stockStatus = (totalQuantity - salesUpToDate <= 0) ? 'Insufficient' : 'Sufficient';
        return res.status(200).json({
          productName: product.name,
          date: formattedDate,
          stockStatus,
          averageDailySales
        });
      }
    } catch (error) {
      return res.status(500).json({ message: "Error determining stock requirement", error: error.message });
    }
  };
  
  

// 5. Seasonal forecasting
const seasonalForecasting = async (req, res) => {
  try {
    const { productId } = req.params;
    const salesData = await Sale.findAll({
      where: { productId },
      attributes: ['quantitySold', 'salesDate'],
      order: [['salesDate', 'ASC']]
    });
    const data = salesData.map(sale => ({
      quantitySold: sale.quantitySold,
      salesDate: sale.salesDate
    }));
    const period = 30; // monthly seasonality
    const { seasonal, trend, residual } = seasonalDecomposition(data, period);
    return res.status(200).json({ productId, trend, seasonal, residual });
  } catch (error) {
    return res.status(500).json({ message: "Error performing seasonal forecasting", error: error.message });
  }
};

const Forecastingoption = async (req, res) => {
    try {
      const { productId } = req.params;
      const { method = 'seasonal' } = req.query; // Default method is 'seasonal'
  
      const salesData = await Sale.findAll({
        where: { productId },
        attributes: ['quantitySold', 'salesDate'],
        order: [['salesDate', 'ASC']]
      });
  
      const data = salesData.map(sale => ({
        quantitySold: sale.quantitySold,
        salesDate: sale.salesDate
      }));
  
      let result;
      if (method === 'movingAverage') {
        const windowSize = 7; // Example window size
        result = calculateMovingAverage(data, windowSize);
      } else if (method === 'exponentialSmoothing') {
        const alpha = 0.5; // Example alpha value
        result = calculateExponentialSmoothing(data, alpha);
      } else {
        const period = 30; // monthly seasonality
        const { seasonal, trend, residual } = seasonalDecomposition(data, period);
        result = { trend, seasonal, residual };
      }
  
      return res.status(200).json({ productId, method, result });
    } catch (error) {
      return res.status(500).json({ message: "Error performing seasonal forecasting", error: error.message });
    }
  };

module.exports = {
  predictOutOfStockDate,
  demandOnSpecificDate,
  singleProductDemand,
  stockRequirementOnDate,
  seasonalForecasting,
  Forecastingoption
};
