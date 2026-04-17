import mongoose from 'mongoose';

const openHouseSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'Listing reference is required']
  },
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Agent ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    validate: {
      validator: function(time) {
        // Basic validation for HH:MM format
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'Start time must be in HH:MM format (e.g., 10:30)'
    }
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    validate: {
      validator: function(time) {
        // Basic validation for HH:MM format
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
      },
      message: 'End time must be in HH:MM format (e.g., 17:30)'
    }
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for common queries
openHouseSchema.index({ listing: 1, date: 1 });
openHouseSchema.index({ agentId: 1, date: 1 });

const OpenHouse = mongoose.model('OpenHouse', openHouseSchema, 'OpenHouses');

export default OpenHouse;