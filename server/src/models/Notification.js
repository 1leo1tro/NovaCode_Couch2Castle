import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: [true, 'Recipient is required'],
    index: true
  },
  type: {
    type: String,
    required: [true, 'Notification type is required'],
    enum: {
      values: ['showing_request'],
      message: 'Type must be one of: showing_request'
    }
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [500, 'Message must not exceed 500 characters']
  },
  relatedShowing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Showing'
  },
  relatedListing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema, 'Notifications');

export default Notification;
