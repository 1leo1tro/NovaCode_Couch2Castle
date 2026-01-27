import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema({
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price must be a positive number']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  squareFeet: {
    type: Number,
    required: [true, 'Square footage is required'],
    min: [0, 'Square footage must be a positive number']
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(images) {
        return Array.isArray(images);
      },
      message: 'Images must be an array of strings'
    }
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: {
      values: ['active', 'pending', 'sold', 'inactive'],
      message: 'Status must be one of: active, pending, sold, inactive'
    },
    default: 'active'
  },
  zipCode: {
    type: String,
    required: [true, 'ZIP code is required'],
    trim: true,
    validate: {
      validator: function(zip) {
        // US ZIP code validation (5 digits or 5+4 format)
        return /^\d{5}(-\d{4})?$/.test(zip);
      },
      message: 'ZIP code must be a valid US ZIP code format (e.g., 35801 or 35801-1234)'
    }
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

// Index for common queries
listingSchema.index({ zipCode: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ price: 1 });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
