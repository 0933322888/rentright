import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  path: String,
  filename: String,
  uploadedAt: Date,
  mimeType: String
});

const propertyDocumentSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  proofOfOwnership: [documentSchema],
  governmentId: [documentSchema],
  condoBoardRules: [documentSchema],
  utilityBills: [documentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index to ensure one document set per property
propertyDocumentSchema.index({ property: 1 }, { unique: true });

const PropertyDocument = mongoose.model('PropertyDocument', propertyDocumentSchema);

export default PropertyDocument; 