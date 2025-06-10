import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['viewing', 'pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending'
  },
  wantsViewing: {
    type: Boolean,
    required: true,
    default: false
  },
  viewingDate: {
    type: Date
  },
  viewingTime: {
    type: String
  },
  tenantScoring: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index to prevent duplicate applications
applicationSchema.index({ property: 1, tenant: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application; 