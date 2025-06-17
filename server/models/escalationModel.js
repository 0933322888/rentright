import mongoose from 'mongoose';

const adminNoteSchema = new mongoose.Schema({
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const escalationSchema = new mongoose.Schema({
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
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_review', 'resolved', 'closed'],
    default: 'pending'
  },
  reason: {
    type: String,
    required: true,
    enum: ['missed_payment', 'late_payment', 'other']
  },
  description: {
    type: String,
    required: true
  },
  adminNotes: [adminNoteSchema],
  paymentHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  resolutionDate: {
    type: Date
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
escalationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
escalationSchema.index({ property: 1, tenant: 1, status: 1 });
escalationSchema.index({ landlord: 1, status: 1 });

const Escalation = mongoose.model('Escalation', escalationSchema);

export default Escalation; 