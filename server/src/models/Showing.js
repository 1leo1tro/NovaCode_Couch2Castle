import mongoose from 'mongoose';

const showingSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing',
    required: [true, 'Listing reference is required']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name must not exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\d\s\-\(\)\+]+$/, 'Please provide a valid phone number']
  },
  preferredDate: {
    type: Date,
    required: [true, 'Preferred date is required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Preferred date must be in the future'
    }
  },
  message: {
    type: String,
    default: '',
    maxlength: [1000, 'Message must not exceed 1000 characters']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'confirmed', 'completed', 'cancelled'],
      message: 'Status must be one of: pending, confirmed, completed, cancelled'
    },
    default: 'pending'
  },
  feedback: {
    type: String,
    default: '',
    maxlength: [2000, 'Feedback must not exceed 2000 characters']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
showingSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt timestamp before updating
showingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Index for faster queries
showingSchema.index({ listing: 1, createdAt: -1 });
showingSchema.index({ status: 1 });

const Showing = mongoose.model('Showing', showingSchema);

export default Showing;
