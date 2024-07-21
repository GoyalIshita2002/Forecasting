const { Sale,Product } = require('../../connection/connection.js');
const { Sequelize, Op} = require('sequelize');
const moment = require('moment');

const SpecificSaleyearly = async (req, res) => {
    const { name, startYear, endYear } = req.query;

    if (!startYear || isNaN(startYear) || startYear.length !== 4 || !endYear || isNaN(endYear) || endYear.length !== 4) {
      return res.status(400).json({ message: "Invalid year range provided. Please provide valid start and end years." });
    }
  
    const start = parseInt(startYear);
    const end = parseInt(endYear);
  
    if (start > end) {
      return res.status(400).json({ message: "Start year cannot be greater than end year." });
    }
  
    try {
      let products;
      if (name) {
        products = await Product.findAll({ where: { name: name } });
        if (products.length === 0) {
          return res.status(404).json({ message: "No products found for this name" });
        }
      } else {
        products = await Product.findAll();
        if (products.length === 0) {
          return res.status(404).json({ message: "No products found" });
        }
      }
  
      const productIds = products.map(product => product.id);
  
      const sales = await Sale.findAll({
        where: {
          productId: productIds,
          salesDate: {
            [Op.between]: [`${start}-01-01`, `${end}-12-31`]
          }
        },
        attributes: [
          [Sequelize.fn('EXTRACT', Sequelize.literal('YEAR FROM "salesDate"')), 'year'],
          [Sequelize.fn('SUM', Sequelize.col('quantitySold')), 'totalQuantitySold']
        ],
        group: ['year'],
        order: [['year', 'ASC']]
      });
  
      const salesByYear = sales.reduce((acc, sale) => {
        acc[sale.dataValues.year] = sale.dataValues.totalQuantitySold;
        return acc;
      }, {});
  
      const yearlySales = [];
      for (let year = start; year <= end; year++) {
        yearlySales.push({
          year,
          totalQuantitySold: salesByYear[year] || 0
        });
      }
  
      return res.status(200).json({ yearlySales });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching sales", error: error.message });
    }
  };

  const SpecificSaleWeekly = async (req, res) => {
    const { name, year, month } = req.query;
  
    if (!year || isNaN(year) || year.length !== 4 || !month || isNaN(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid year or month provided. Please provide a valid year and month." });
    }
  
    try {
      let products;
      if (name) {
        products = await Product.findAll({ where: { name: name } });
        if (products.length === 0) {
          return res.status(404).json({ message: "No products found for this name" });
        }
      } else {
        products = await Product.findAll();
        if (products.length === 0) {
          return res.status(404).json({ message: "No products found" });
        }
      }
  
      const productIds = products.map(product => product.id);
  
      const sales = await Sale.findAll({
        where: {
          productId: productIds,
          salesDate: {
            [Op.between]: [
              moment(`${year}-${month}-01`).startOf('month').toDate(),
              moment(`${year}-${month}-01`).endOf('month').toDate()
            ]
          }
        },
        attributes: [
          [Sequelize.fn('EXTRACT', Sequelize.literal('WEEK FROM "salesDate"')), 'week'],
          [Sequelize.fn('SUM', Sequelize.col('quantitySold')), 'totalQuantitySold']
        ],
        group: ['week'],
        order: [['week', 'ASC']]
      });
  
      const salesByWeek = sales.reduce((acc, sale) => {
        acc[sale.dataValues.week] = sale.dataValues.totalQuantitySold;
        return acc;
      }, {});
  
      const weeks = getWeeksInMonth(year, month);
      const weeklySales = weeks.map(week => ({
        week: week.number,
        startDate: week.startDate,
        endDate: week.endDate,
        totalQuantitySold: salesByWeek[week.number] || 0
      }));
  
      return res.status(200).json({ weeklySales });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching sales", error: error.message });
    }
  };
  
  const getWeeksInMonth = (year, month) => {
    const startOfMonth = moment(`${year}-${month}-01`).startOf('month');
    const endOfMonth = moment(`${year}-${month}-01`).endOf('month');
    const weeks = [];
    let currentWeek = startOfMonth.isoWeek();
    let weekStart = startOfMonth.clone();
  
    while (weekStart.isBefore(endOfMonth)) {
      let weekEnd = weekStart.clone().endOf('isoWeek');
      if (weekEnd.isAfter(endOfMonth)) {
        weekEnd = endOfMonth;
      }
  
      weeks.push({
        number: currentWeek,
        startDate: weekStart.format('YYYY-MM-DD'),
        endDate: weekEnd.format('YYYY-MM-DD')
      });
  
      weekStart = weekEnd.clone().add(1, 'day');
      currentWeek = weekStart.isoWeek();
    }
  
    return weeks;
  };

module.exports = {
    SpecificSaleyearly,
    SpecificSaleWeekly
  };