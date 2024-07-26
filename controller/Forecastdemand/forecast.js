const path = require('path');
const csv = require('csvtojson');
const express = require('express');

const getForecastData = async (req, res) => {
    const csvFilePath = path.join(__dirname, '../../forecasted_data.csv');
    try {
        const jsonArray = await csv().fromFile(csvFilePath);
        res.json(jsonArray);
    } catch (error) {
        res.status(500).json({ error: 'Failed to read CSV file' });
    }
};

const getForecastProfitPlot = (req, res) => {
    const imagePath = path.join(__dirname, '../../forecast_profit_plot.png');
    res.sendFile(imagePath, (err) => {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve forecast profit plot image' });
        }
    });
};

const getForecastUnitsSoldPlot = (req, res) => {
    const imagePath = path.join(__dirname, '../../forecast_units_sold_plot.png');
    res.sendFile(imagePath, (err) => {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve forecast units sold plot image' });
        }
    });
};

module.exports = {
    getForecastData,
    getForecastProfitPlot,
    getForecastUnitsSoldPlot
};
