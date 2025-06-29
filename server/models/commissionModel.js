import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema({
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  type: {
    type: String,
    enum: ['listing_fee', 'commission', 'service_fee', 'processing_fee', 'monthly_fee'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'bank_transfer', 'cash', 'check', 'other'],
    default: 'stripe'
  },
  transactionId: {
    type: String
  },
  stripePaymentIntentId: {
    type: String
  },
  notes: {
    type: String
  },
  adminNotes: {
    type: String
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringInterval: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  nextDueDate: {
    type: Date
  },
  lateFees: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
commissionSchema.index({ landlord: 1, status: 1 });
commissionSchema.index({ property: 1 });
commissionSchema.index({ dueDate: 1 });
commissionSchema.index({ status: 1, dueDate: 1 });

// Virtual for calculating total amount including late fees
commissionSchema.virtual('calculatedTotal').get(function() {
  return this.amount + this.lateFees;
});

// Pre-save middleware to update total amount
commissionSchema.pre('save', function(next) {
  this.totalAmount = this.amount + this.lateFees;
  next();
});

const Commission = mongoose.model('Commission', commissionSchema);

export default Commission; 