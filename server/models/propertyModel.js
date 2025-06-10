import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['apartment', 'house', 'condo', 'townhouse', 'commercial']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  availableFrom: {
    type: Date,
    required: true
  },
  amenities: [{
    type: String
  }],
  location: {
    street: String,
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere',
      default: undefined
    }
  },
  features: {
    bedrooms: Number,
    bathrooms: Number,
    squareFootage: Number,
    parking: Boolean,
    furnished: Boolean,
    petsAllowed: Boolean,
    refrigerator: Boolean,
    dishwasher: Boolean,
    airConditioner: Boolean,
    balcony: Boolean,
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    required: true,
    enum: ['new', 'review', 'submitted', 'rented', 'active'],
    default: 'new'
  },
  adminComments: {
    type: String,
    default: ''
  },
  viewingDates: [{
    date: {
      type: Date,
      required: true
    },
    timeSlots: [{
      startTime: {
        type: String,
        required: true
      },
      endTime: {
        type: String,
        required: true
      },
      isBooked: {
        type: Boolean,
        default: false
      },
      bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
  }],
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applications: [{
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['viewing', 'pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending'
    },
    wantsViewing: {
      type: Boolean,
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
    }
  }],
  available: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Property = mongoose.model('Property', propertySchema);

export default Property; 