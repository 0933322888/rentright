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
    enum: ['Apartment', 'House', 'Condo', 'Studio']
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
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
    zipCode: String
  },
  features: {
    bedrooms: Number,
    bathrooms: Number,
    squareFootage: Number,
    parking: Boolean,
    furnished: Boolean,
    petsAllowed: Boolean
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    required: true,
    enum: ['New', 'Review', 'Submitted', 'Rented'],
    default: 'New'
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  landlord: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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