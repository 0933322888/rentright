import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  path: String,
  filename: String,
  uploadedAt: Date
});

const tenantDocumentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Employment & Income
  isCurrentlyEmployed: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'self-employed', 'contractor', 'student', 'unemployed', 'retired'],
    required: true
  },
  monthlyNetIncome: {
    type: Number,
    min: 0,
    required: true
  },
  hasAdditionalIncome: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  additionalIncomeDescription: {
    type: String,
    required: function() {
      return this.hasAdditionalIncome === 'yes';
    }
  },

  // Expenses & Debts
  monthlyDebtRepayment: {
    type: Number,
    min: 0,
    required: true
  },
  paysChildSupport: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  childSupportAmount: {
    type: Number,
    min: 0,
    required: function() {
      return this.paysChildSupport === 'yes';
    }
  },

  // Rental History
  hasBeenEvicted: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  currentlyPaysRent: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  currentRentAmount: {
    type: Number,
    min: 0,
    required: function() {
      return this.currentlyPaysRent === 'yes';
    }
  },

  // Financial Preparedness
  hasTwoMonthsRentSavings: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  canShareFinancialDocuments: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },

  // Existing fields
  canPayMoreThanOneMonth: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  monthsAheadCanPay: {
    type: Number,
    min: 2,
    required: function() {
      return this.canPayMoreThanOneMonth === 'yes';
    }
  },

  // Document fields
  proofOfIdentity: [documentSchema],
  proofOfIncome: [documentSchema],
  creditHistory: [documentSchema],
  rentalHistory: [documentSchema],
  additionalDocuments: [documentSchema],
  
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
tenantDocumentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index to ensure one document set per tenant
tenantDocumentSchema.index({ tenant: 1 }, { unique: true });

const TenantDocument = mongoose.model('TenantDocument', tenantDocumentSchema);

export default TenantDocument; 