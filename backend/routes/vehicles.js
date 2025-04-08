const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// Route to get a small sample of raw data
router.get('/sample', async (req, res) => {
  try {
    const sample = await Vehicle.find().limit(10).sort({ timestamp: -1 });
    res.json(sample);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const total = await Vehicle.countDocuments();
    
    const avgSpeedResult = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          avgSpeed: { $avg: "$speed" }
        }
      }
    ]);
    
    const avgConfidenceResult = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$detection_confidence" }
        }
      }
    ]);
    
    const lowConfidenceCount = await Vehicle.countDocuments({
      detection_confidence: { $lt: 0.7 }
    });
    
    const uniqueWeatherConditions = await Vehicle.distinct("weather_condition");
    const uniqueVehicleTypes = await Vehicle.distinct("vehicle_type");
    
    // Get date range of the data
    const dateResult = await Vehicle.aggregate([
      {
        $group: {
          _id: null,
          minDate: { $min: "$timestamp" },
          maxDate: { $max: "$timestamp" }
        }
      }
    ]);
    
    const dateRange = dateResult.length > 0 ? {
      start: dateResult[0].minDate,
      end: dateResult[0].maxDate
    } : null;
    
    res.json({
      total,
      avgSpeed: avgSpeedResult.length > 0 ? avgSpeedResult[0].avgSpeed.toFixed(1) : 0,
      avgConfidence: avgConfidenceResult.length > 0 ? (avgConfidenceResult[0].avgConfidence * 100).toFixed(1) : 0,
      lowConfidenceCount,
      weatherConditionTypes: uniqueWeatherConditions.length,
      vehicleTypes: uniqueVehicleTypes.length,
      dateRange
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get average traffic volume by hour of day across all data
router.get('/hourly-average', async (req, res) => {
  try {
    // Aggregate data by hour of day, averaging across all available data
    const hourlyAverageData = await Vehicle.aggregate([
      {
        $group: {
          _id: { hour: { $hour: "$timestamp" } },
          totalVehicles: { $sum: 1 },
          avgSpeed: { $avg: "$speed" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          hour: "$_id.hour",
          count: "$totalVehicles",
          avgSpeed: { $round: ["$avgSpeed", 1] }
        }
      },
      {
        $sort: { hour: 1 }
      }
    ]);
    
    res.json(hourlyAverageData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get vehicle type distribution
router.get('/vehicle-types', async (req, res) => {
  try {
    const vehicleTypes = await Vehicle.aggregate([
      {
        $group: {
          _id: "$vehicle_type",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: "$count"
        }
      }
    ]);
    
    res.json(vehicleTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get average speed by vehicle type
router.get('/speed-by-vehicle', async (req, res) => {
  try {
    const results = await Vehicle.aggregate([
      {
        $group: {
          _id: "$vehicle_type",
          avgSpeed: { $avg: "$speed" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          vehicle: "$_id",
          avgSpeed: { $round: ["$avgSpeed", 1] },
          count: 1
        }
      },
      {
        $sort: { vehicle: 1 }
      }
    ]);
    
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weather impact on vehicle speed
router.get('/weather-speed', async (req, res) => {
  try {
    const weatherSpeedData = await Vehicle.aggregate([
      {
        $group: {
          _id: "$weather_condition",
          avgSpeed: { $avg: "$speed" },
          count: { $sum: 1 },
          minSpeed: { $min: "$speed" },
          maxSpeed: { $max: "$speed" }
        }
      },
      {
        $project: {
          _id: 0,
          weather: "$_id",
          avgSpeed: { $round: ["$avgSpeed", 1] },
          count: 1,
          minSpeed: { $round: ["$minSpeed", 1] },
          maxSpeed: { $round: ["$maxSpeed", 1] }
        }
      },
      {
        $sort: { avgSpeed: -1 }
      }
    ]);
    
    res.json(weatherSpeedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;