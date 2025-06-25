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

const tenantProfileSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Personal Information
  // Employment & Income
  employmentStatus: { 
    type: String, 
    enum: ['employed', 'self-employed', 'student', 'retired', 'unemployed', 'other'],
    default: 'employed'
  },
  employerName: { type: String, trim: true },
  jobTitle: { type: String, trim: true },
  monthlyNetIncome: { type: Number, min: 0 },
  monthlyDebtRepayment: { type: Number, min: 0, default: 0 },
  additionalIncomeAmount: { type: Number, min: 0, default: 0 },
  additionalIncomeSource: { type: String, trim: true },
  
  // Housing Preferences
  currentRentAmount: { type: Number, min: 0 },
  monthsAheadCanPay: { type: Number, min: 0, default: 1 },
  
  // Family & Occupants
  maritalStatus: { 
    type: String, 
    enum: ['single', 'married', 'divorced', 'widowed', 'other'],
    default: 'single'
  },
  childSupportAmount: { type: Number, min: 0, default: 0 },
  adultOccupants: { type: Number, min: 1, default: 1 },
  childOccupants: { type: Number, min: 0, default: 0 },
  
  // Pets & Smoking
  hasPets: { type: Boolean, default: false },
  petCount: { type: Number, min: 0, default: 0 },
  petTypes: [{ type: String, trim: true }],
  petSizes: [{ type: String, enum: ['small', 'medium', 'large'] }],
  smokingStatus: { 
    type: String, 
    enum: ['non-smoker', 'smoker', 'former-smoker'],
    default: 'non-smoker'
  },
  
  // Financial & Credit
  creditScore: { type: Number, min: 300, max: 1000 },
  bankruptcyHistory: { type: Boolean, default: false },
  evictionHistory: { type: Boolean, default: false },
  
  // Lease Guarantor
  hasGuarantor: { type: Boolean, default: false },
  guarantorName: { type: String, trim: true },
  guarantorRelationship: { type: String, trim: true },
  guarantorPhone: { type: String, trim: true },
  guarantorEmail: { type: String, trim: true },
  guarantorAddress: { type: String, trim: true },
  guarantorMonthlyIncome: { type: Number, min: 0 },
  guarantorEmployer: { type: String, trim: true },
  guarantorJobTitle: { type: String, trim: true },
  
  // Documents
  proofOfIdentity: [documentSchema],
  proofOfIncome: [documentSchema],
  creditHistory: [documentSchema],
  rentalHistory: [documentSchema],
  additionalDocuments: [documentSchema],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
tenantProfileSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Index to ensure one document set per tenant
tenantProfileSchema.index({ tenant: 1 }, { unique: true });

const TenantProfile = mongoose.model('TenantProfile', tenantProfileSchema);

export default TenantProfile;