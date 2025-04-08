import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import './App.css';

// API base URL
const API_BASE_URL = 'http://localhost:5000/api/vehicles';

function App() {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState([]);
  const [vehicleTypeData, setVehicleTypeData] = useState([]);
  const [speedByVehicleData, setSpeedByVehicleData] = useState([]);
  const [weatherSpeedData, setWeatherSpeedData] = useState([]);
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    avgSpeed: 0,
    avgConfidence: 0,
    lowConfidenceCount: 0,
    weatherConditionTypes: 0,
    vehicleTypes: 0,
    dateRange: null
  });
  const [error, setError] = useState(null);

  // Fetch all data when component mounts
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all data in parallel for better performance
        const [
          hourlyResponse, 
          vehicleTypesResponse, 
          speedByVehicleResponse,
          weatherSpeedResponse, 
          summaryResponse
        ] = await Promise.all([
          axios.get(`${API_BASE_URL}/hourly-average`),
          axios.get(`${API_BASE_URL}/vehicle-types`),
          axios.get(`${API_BASE_URL}/speed-by-vehicle`),
          axios.get(`${API_BASE_URL}/weather-speed`),
          axios.get(`${API_BASE_URL}/summary`)
        ]);

        // Format hourly data for better display
        const formattedHourlyData = hourlyResponse.data.map(item => ({
          hour: `${String(item.hour).padStart(2, '0')}:00`,
          count: item.count,
          avgSpeed: item.avgSpeed
        }));

        // Set state with fetched data
        setHourlyData(formattedHourlyData);
        setVehicleTypeData(vehicleTypesResponse.data);
        setSpeedByVehicleData(speedByVehicleResponse.data);
        setWeatherSpeedData(weatherSpeedResponse.data);
        setSummaryStats(summaryResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load dashboard data. Please ensure your backend server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Traffic Monitoring Dashboard</h1>
        <p>Analysis of {summaryStats.total?.toLocaleString() || 0} vehicle detections</p>
        
        {summaryStats.dateRange && (
          <div className="date-range">
            <p>Data range: {formatDate(summaryStats.dateRange.start)} to {formatDate(summaryStats.dateRange.end)}</p>
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading dashboard data from MongoDB...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="card">
              <div className="card-content">
                <div className="card-icon car-icon"></div>
                <div>
                  <p className="card-label">Total Vehicles</p>
                  <p className="card-value">{summaryStats.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-content">
                <div className="card-icon speed-icon"></div>
                <div>
                  <p className="card-label">Avg Speed</p>
                  <p className="card-value">{summaryStats.avgSpeed} mph</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-content">
                <div className="card-icon weather-icon"></div>
                <div>
                  <p className="card-label">Weather Conditions</p>
                  <p className="card-value">{summaryStats.weatherConditionTypes} types</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="card-content">
                <div className="card-icon confidence-icon"></div>
                <div>
                  <p className="card-label">Avg Confidence</p>
                  <p className="card-value">{summaryStats.avgConfidence}%</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Dashboard Content */}
          <div className="dashboard-content">
            <div className="charts-container">
              <div className="chart-card">
                <h3>Average Traffic Volume by Hour</h3>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Vehicle Count" stroke="#0088FE" strokeWidth={2} />
                      <Line type="monotone" dataKey="avgSpeed" name="Avg Speed (mph)" stroke="#00C49F" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Vehicle Type Distribution</h3>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={vehicleTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {vehicleTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value.toLocaleString(), 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="charts-container">
              <div className="chart-card">
                <h3>Average Speed by Vehicle Type</h3>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={speedByVehicleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="vehicle" />
                      <YAxis label={{ value: 'Speed (mph)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value) => [`${value} mph`, 'Avg Speed']} />
                      <Legend />
                      <Bar dataKey="avgSpeed" name="Average Speed (mph)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="chart-card">
                <h3>Weather Impact on Vehicle Speed</h3>
                <div className="chart">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={weatherSpeedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="weather" />
                      <YAxis label={{ value: 'Speed (mph)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'avgSpeed') return [`${value} mph`, 'Avg Speed'];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Bar dataKey="avgSpeed" name="Average Speed (mph)" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
          
          <footer className="dashboard-footer">
            <p>Displaying data from {summaryStats.total.toLocaleString()} vehicle entries</p>
            <p>Database: mongodb://localhost:27017/trafficMonitoring</p>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;