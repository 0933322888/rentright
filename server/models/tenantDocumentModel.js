import mongoose from 'mongoose';

const tenantDocumentSchema = new mongoose.Schema({
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hasBeenEvicted: {
    type: String,
    enum: ['yes', 'no'],
    required: true
  },
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
  proofOfIdentity: {
    path: String,
    filename: String,
    uploadedAt: Date
  },
  proofOfIncome: {
    path: String,
    filename: String,
    uploadedAt: Date
  },
  creditHistory: {
    path: String,
    filename: String,
    uploadedAt: Date
  },
  rentalHistory: {
    path: String,
    filename: String,
    uploadedAt: Date
  },
  additionalDocuments: {
    path: String,
    filename: String,
    uploadedAt: Date
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

// Index to ensure one document set per tenant
tenantDocumentSchema.index({ tenant: 1 }, { unique: true });

const TenantDocument = mongoose.model('TenantDocument', tenantDocumentSchema);

export default TenantDocument; 