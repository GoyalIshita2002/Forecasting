import pandas as pd
from statsmodels.tsa.statespace.sarimax import SARIMAX
import matplotlib.pyplot as plt
import sys
import warnings
from statsmodels.tools.sm_exceptions import ConvergenceWarning

# Suppress specific warnings
warnings.filterwarnings("ignore", category=UserWarning, module="statsmodels")
warnings.filterwarnings("ignore", category=ConvergenceWarning, module="statsmodels")

def main(csv_file_path):
    # Read the CSV file
    df = pd.read_csv(csv_file_path)
    
    # Convert 'Order Date' to datetime and set as index
    df['Order Date'] = pd.to_datetime(df['Order Date'], dayfirst=False, errors='coerce')
    df.set_index('Order Date', inplace=True)
    
    # Resample data to monthly frequency
    monthly_profit = df['Total Profit'].resample('M').sum()
    monthly_units_sold = df['Units Sold'].resample('M').sum()
    
    # Define and fit the SARIMAX model for Total Profit
    model_profit = SARIMAX(monthly_profit, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
    results_profit = model_profit.fit(disp=False)
    
    # Define and fit the SARIMAX model for Units Sold
    model_units_sold = SARIMAX(monthly_units_sold, order=(1, 1, 1), seasonal_order=(1, 1, 1, 12))
    results_units_sold = model_units_sold.fit(disp=False)
    
    # Forecast for the next 12 months
    forecast_profit = results_profit.get_forecast(steps=12)
    forecast_profit_df = forecast_profit.conf_int()
    forecast_profit_df['forecast'] = forecast_profit.predicted_mean
    
    forecast_units_sold = results_units_sold.get_forecast(steps=12)
    forecast_units_sold_df = forecast_units_sold.conf_int()
    forecast_units_sold_df['forecast'] = forecast_units_sold.predicted_mean
    
    # Get forecasted dates
    forecast_dates = forecast_profit_df.index
    
    # Combine forecast data into a single DataFrame
    forecast_combined_df = pd.DataFrame({
        'Forecast Date': forecast_dates,
        'Total Profit Lower CI': forecast_profit_df.iloc[:, 0],
        'Total Profit Upper CI': forecast_profit_df.iloc[:, 1],
        'Forecasted Total Profit': forecast_profit_df['forecast'],
        'Units Sold Lower CI': forecast_units_sold_df.iloc[:, 0],
        'Units Sold Upper CI': forecast_units_sold_df.iloc[:, 1],
        'Forecasted Units Sold': forecast_units_sold_df['forecast']
    })
    forecast_combined_df.to_csv('forecasted_data.csv', index=False)
    
    # Plot the forecast for Total Profit
    plt.figure(figsize=(10, 5))
    plt.plot(monthly_profit.index, monthly_profit.values, label='Historical Total Profit')
    plt.plot(forecast_profit_df.index, forecast_profit_df['forecast'], label='Forecasted Total Profit')
    plt.fill_between(forecast_profit_df.index,
                     forecast_profit_df.iloc[:, 0],
                     forecast_profit_df.iloc[:, 1],
                     color='pink', alpha=0.3)
    plt.title('Seasonal Forecasting of Total Profit')
    plt.xlabel('Date')
    plt.ylabel('Total Profit')
    plt.legend()
    plt.savefig('forecast_profit_plot.png')
    
    # Plot the forecast for Units Sold
    plt.figure(figsize=(10, 5))
    plt.plot(monthly_units_sold.index, monthly_units_sold.values, label='Historical Units Sold')
    plt.plot(forecast_units_sold_df.index, forecast_units_sold_df['forecast'], label='Forecasted Units Sold')
    plt.fill_between(forecast_units_sold_df.index,
                     forecast_units_sold_df.iloc[:, 0],
                     forecast_units_sold_df.iloc[:, 1],
                     color='lightblue', alpha=0.3)
    plt.title('Seasonal Forecasting of Units Sold')
    plt.xlabel('Date')
    plt.ylabel('Units Sold')
    plt.legend()
    plt.savefig('forecast_units_sold_plot.png')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python forecast.py <csv_file_path>")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    main(csv_file_path)
