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
  description: {
    type: String,
    trim: true
  },
  bedrooms: {
    type: Number,
    min: 0,
    required: false
  },
  bathrooms: {
    type: Number,
    min: 0,
    required: false
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
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: false // Optional for backward compatibility with existing listings
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: false
  },
  closingDate: {
    type: Date,
    required: false
  },
  finalSalePrice: {
    type: Number,
    required: false,
    min: [0, 'Final sale price must be a positive number']
  },
  daysOnMarket: {
    type: Number,
    required: false
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
    }
  },
  tags: {
    type: [String],
    default: [],
    validate: [
      {
        validator: function(tags) {
          return tags.length <= 20;
        },
        message: 'A listing may have at most 20 tags'
      },
      {
        validator: function(tags) {
          return tags.every(tag => tag.length <= 50);
        },
        message: 'Each tag must be 50 characters or fewer'
      }
    ]
  }
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

const DAY_IN_MS = 1000 * 60 * 60 * 24;

const calculateDaysOnMarket = (createdAt, closingDate) => {
  if (!createdAt || !closingDate) {
    return undefined;
  }

  const created = new Date(createdAt);
  const closing = new Date(closingDate);

  if (Number.isNaN(created.getTime()) || Number.isNaN(closing.getTime())) {
    return undefined;
  }

  // Compare calendar days in UTC to avoid time-of-day and local timezone drift.
  const createdUtc = Date.UTC(created.getUTCFullYear(), created.getUTCMonth(), created.getUTCDate());
  const closingUtc = Date.UTC(closing.getUTCFullYear(), closing.getUTCMonth(), closing.getUTCDate());
  const diffDays = Math.floor((closingUtc - createdUtc) / DAY_IN_MS);

  return Math.max(0, diffDays);
};

// Auto-calculate daysOnMarket from createdAt when closingDate is set.
listingSchema.pre('save', function() {
  if (this.closingDate) {
    const daysOnMarket = calculateDaysOnMarket(this.createdAt, this.closingDate);
    if (daysOnMarket !== undefined) {
      this.daysOnMarket = daysOnMarket;
    }
  }
});

listingSchema.pre('findOneAndUpdate', async function() {
  const update = this.getUpdate() || {};
  const set = update.$set || update;

  if (!set.closingDate) {
    return;
  }

  const existingListing = await this.model.findOne(this.getQuery()).select('createdAt');
  if (!existingListing?.createdAt) {
    return;
  }

  const daysOnMarket = calculateDaysOnMarket(existingListing.createdAt, set.closingDate);
  if (daysOnMarket === undefined) {
    return;
  }

  if (update.$set) {
    update.$set.daysOnMarket = daysOnMarket;
  } else {
    update.daysOnMarket = daysOnMarket;
  }

  this.setUpdate(update);
});

// Index for common queries
listingSchema.index({ zipCode: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ location: '2dsphere' }, { sparse: true });

const Listing = mongoose.model('Listing', listingSchema, 'Listings');

export default Listing;
