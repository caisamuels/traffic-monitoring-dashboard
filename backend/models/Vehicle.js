const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  vehicle_type: {
    type: String,
    required: true
  },
  detection_confidence: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  speed: {
    type: Number,
    required: true
  },
  weather_condition: {
    type: String,
    required: true
  }
}, { collection: 'vehicles' });

module.exports = mongoose.model('Vehicle', VehicleSchema);