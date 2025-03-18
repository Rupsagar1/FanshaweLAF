const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Electronics', 'Clothing', 'Documents', 'Accessories', 'Other']
  },
  status: {
    type: String,
    required: true,
    enum: ['lost', 'found', 'claimed', 'returned'],
    default: 'lost'
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  images: [{
    type: String
  }],
  reporter: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
  },
  claimant: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    verificationCode: String,
    claimDate: Date,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  qrCode: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
});

// Update the updatedAt timestamp before saving
itemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Item', itemSchema); 