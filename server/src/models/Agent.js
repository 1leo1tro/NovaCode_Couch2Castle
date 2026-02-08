import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const agentSchema = new mongoose.Schema({
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
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // Basic email validation regex
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please provide a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in queries by default
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        // Optional: US phone number format (10 digits)
        if (!phone) return true; // Phone is optional
        return /^\d{10}$/.test(phone.replace(/\D/g, ''));
      },
      message: 'Please provide a valid 10-digit phone number'
    }
  },
  licenseNumber: {
    type: String,
    trim: true,
    sparse: true, // Allow multiple null values but unique non-null values
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Hash password before saving to database
agentSchema.pre('save', async function() {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return;
  }

  // Generate salt with 10 rounds (good balance of security and performance)
  const salt = await bcrypt.genSalt(10);

  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password for login
agentSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    // this.password is the hashed password stored in DB
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Method to get public agent data (without sensitive info)
agentSchema.methods.toPublicJSON = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    licenseNumber: this.licenseNumber,
    isActive: this.isActive,
    createdAt: this.createdAt
  };
};

const Agent = mongoose.model('Agent', agentSchema, 'Agents');

export default Agent;
