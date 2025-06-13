import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  path: String,
  filename: String,
  uploadedAt: Date,
  mimeType: String,
  originalName: String
});

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
    required: true,
    enum: ['viewing', 'pending', 'approved', 'rejected', 'cancelled', 'terminated'],
    default: 'pending'
  },
  wantsViewing: {
    type: Boolean,
    required: true,
    default: false
  },
  viewingDate: {
    type: Date
  },
  viewingTime: {
    type: String
  },
  tenantScoring: {
    type: Number,
    default: 0
  },
  tenantDocuments: [documentSchema],
  leaseAgreement: {
    status: {
      type: String,
      enum: ['pending', 'tenant_approved', 'landlord_approved', 'signed'],
      default: 'pending'
    },
    leaseStartDate: {
      date: {
        type: Date,
        required: true
      },
      setBy: {
        type: String,
        enum: ['tenant', 'landlord'],
        required: true
      },
      approvedBy: {
        type: String,
        enum: ['tenant', 'landlord', null],
        default: null
      },
      lastUpdatedAt: {
        type: Date,
        default: Date.now
      }
    },
    comments: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      role: {
        type: String,
        enum: ['tenant', 'landlord', 'admin'],
        required: true
      },
      text: {
        type: String,
        required: true
      },
      parentCommentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application.leaseAgreement.comments'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    tenantApprovedAt: Date,
    landlordApprovedAt: Date,
    signedAt: Date,
    standardLeaseDocument: {
      path: String,
      filename: String,
      originalName: String,
      mimeType: String,
      uploadedAt: Date
    }
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
applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index to prevent duplicate applications
applicationSchema.index({ property: 1, tenant: 1 }, { unique: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application; 