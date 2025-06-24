import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  s3Key: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now, required: true },
  aiParsedData: { type: Object }, // AI extracted fields
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
    required: function () {
      return this.hasAdditionalIncome === 'yes';
    }
  },
  additionalIncomeAmount: {
    type: Number,
    min: 0,
    required: function () {
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
    required: function () {
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
    required: function () {
      return this.currentlyPaysRent === 'yes';
    }
  },

  // Financial Preparedness
  hasTwoMonthsRentSavings: {
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
    required: function () {
      return this.canPayMoreThanOneMonth === 'yes';
    }
  },

  // New fields for pets, smoking, occupants, and credit score
  hasPets: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  petCount: {
    type: Number,
    min: 0,
    required: function () {
      return this.hasPets === 'yes';
    }
  },
  petTypes: {
    type: String,
    required: function () {
      return this.hasPets === 'yes';
    }
  },
  smokes: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
  adultOccupants: {
    type: Number,
    min: 1,
    required: true
  },
  childOccupants: {
    type: Number,
    min: 0,
    required: true
  },
  creditScore: {
    type: Number,
    min: 300,
    max: 850,
    required: false
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
  },
});

// Update the updatedAt timestamp before saving
tenantDocumentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index to ensure one document set per tenant
tenantDocumentSchema.index({ tenant: 1 }, { unique: true });

const TenantDocument = mongoose.model('TenantDocument', tenantDocumentSchema);

export default TenantDocument; 