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
    enum: ['pending', 'approved', 'declined', 'expired'],
    default: 'pending'
  },
  viewingDate: {
    type: Date,
    required: true
  },
  viewingTime: {
    type: String,
    required: true
  },
  tenantScoring: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to prevent duplicate applications
applicationSchema.index({ property: 1, tenant: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application; 