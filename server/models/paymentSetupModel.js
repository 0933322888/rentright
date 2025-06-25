import mongoose from 'mongoose';

const paymentSetupSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: true
  },
  paymentMethodId: {
    type: String,
    required: true
  },
  paymentMethodType: {
    type: String,
    enum: ['card', 'bank_account'],
    default: 'card'
  },
  paymentMethodDetails: {
    brand: String,
    last4: String,
    expMonth: Number,
    expYear: Number,
    country: String
  },
  isDefault: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  setupCompleted: {
    type: Boolean,
    default: false
  },
  setupCompletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for faster queries
paymentSetupSchema.index({ tenant: 1 });
paymentSetupSchema.index({ stripeCustomerId: 1 });

const PaymentSetup = mongoose.model('PaymentSetup', paymentSetupSchema);

export default PaymentSetup; 