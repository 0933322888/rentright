import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  // Basic Information
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Fee Classification
  category: {
    type: String,
    enum: ['commission', 'monthly_fee', 'listing_fee', 'service_fee', 'processing_fee', 'late_fee', 'other'],
    required: true
  },
  
  // Fee Type (One-time vs Recurring)
  feeType: {
    type: String,
    enum: ['one_time', 'recurring'],
    required: true
  },
  
  // Amount Information
  baseAmount: {
    type: Number,
    required: true,
    min: 0
  },
  additionalFees: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Status and Lifecycle
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled', 'refunded', 'disputed'],
    default: 'pending'
  },
  
  // Dates
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // Recurring Fee Configuration (if applicable)
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    interval: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
      default: 'monthly'
    },
    nextDueDate: {
      type: Date
    },
    cycleNumber: {
      type: Number,
      default: 1
    },
    parentFeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fee'
    }
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'bank_transfer', 'cash', 'check', 'other'],
      default: 'stripe'
    },
    transactionId: String,
    stripePaymentIntentId: String,
    stripeChargeId: String,
    failureReason: String,
    retryCount: {
      type: Number,
      default: 0
    }
  },
  
  // Description and Notes
  description: {
    type: String,
    required: true
  },
  notes: String,
  adminNotes: String,
  
  // Related Data
  relatedApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  relatedLease: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lease'
  },
  
  // Audit Trail
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed', 'payment_received', 'cancelled', 'refunded']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    previousStatus: String,
    newStatus: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient queries
feeSchema.index({ property: 1, category: 1 });
feeSchema.index({ landlord: 1, status: 1 });
feeSchema.index({ dueDate: 1 });
feeSchema.index({ status: 1, dueDate: 1 });
feeSchema.index({ 'recurring.parentFeeId': 1 });
feeSchema.index({ category: 1, status: 1 });

// Virtual for calculating total amount
feeSchema.virtual('calculatedTotal').get(function() {
  return this.baseAmount + this.additionalFees;
});

// Pre-save middleware to update total amount and add to history
feeSchema.pre('save', function(next) {
  // Update total amount
  this.totalAmount = this.baseAmount + this.additionalFees;
  
  // Add to history if status changed
  if (this.isModified('status') && this.history.length > 0) {
    const previousStatus = this.history[this.history.length - 1].newStatus;
    if (previousStatus !== this.status) {
      this.history.push({
        action: 'status_changed',
        previousStatus,
        newStatus: this.status,
        details: `Status changed from ${previousStatus} to ${this.status}`
      });
    }
  }
  
  next();
});

// Static method to create recurring fee
feeSchema.statics.createRecurringFee = async function(parentFee, nextDueDate) {
  const recurringFee = new this({
    property: parentFee.property,
    landlord: parentFee.landlord,
    category: parentFee.category,
    feeType: 'recurring',
    baseAmount: parentFee.baseAmount,
    totalAmount: parentFee.baseAmount,
    status: 'pending',
    dueDate: nextDueDate,
    description: parentFee.description,
    recurring: {
      isRecurring: true,
      interval: parentFee.recurring.interval,
      nextDueDate: nextDueDate,
      cycleNumber: parentFee.recurring.cycleNumber + 1,
      parentFeeId: parentFee._id
    }
  });
  
  return await recurringFee.save();
};

// Instance method to mark as paid
feeSchema.methods.markAsPaid = async function(paymentMethod, transactionId, userId) {
  this.status = 'paid';
  this.paidDate = new Date();
  this.payment.method = paymentMethod;
  if (transactionId) this.payment.transactionId = transactionId;
  
  this.history.push({
    action: 'payment_received',
    userId,
    details: `Payment received via ${paymentMethod}`,
    newStatus: 'paid'
  });
  
  return await this.save();
};

// Instance method to calculate next due date for recurring fees
feeSchema.methods.calculateNextDueDate = function() {
  if (!this.recurring.isRecurring) return null;
  
  const nextDate = new Date(this.dueDate);
  switch (this.recurring.interval) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
};

const Fee = mongoose.model('Fee', feeSchema);

export default Fee; 