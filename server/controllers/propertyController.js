import Property from '../models/propertyModel.js';
import mongoose from 'mongoose';
import Application from '../models/applicationModel.js';
import PropertyDocument from '../models/propertyDocumentModel.js';
import User from '../models/userModel.js';

const createProperty = async (req, res) => {
  try {
    // Handle images
    const images = req.files?.images ? req.files.images.map(file => file.path.replace(/\\/g, '/').split('uploads/')[1]) : [];

    // Create property with images
    const property = new Property({
      ...req.body,
      landlord: req.user._id,
      images: images
    });

    const createdProperty = await property.save();

    // Handle documents if any were uploaded
    if (req.files && Object.keys(req.files).some(key => key !== 'images')) {
      const propertyDocument = new PropertyDocument({
        property: createdProperty._id
      });

      // Process each document type
      ['proofOfOwnership', 'governmentId', 'condoBoardRules', 'utilityBills'].forEach(field => {
        if (req.files[field]) {
          const files = Array.isArray(req.files[field]) ? req.files[field] : [req.files[field]];
          propertyDocument[field] = files.map(file => ({
            path: file.path,
            filename: file.filename,
            uploadedAt: new Date(),
            mimeType: file.mimetype
          }));
        }
      });

      await propertyDocument.save();
    }

    res.status(201).json(createdProperty);
  } catch (error) {
    console.error('Error creating property:', error);
    res.status(400).json({ message: error.message });
  }
};

const getProperties = async (req, res) => {
  try {
    const { 
      type, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      city, 
      furnished,
      available,
      landlord 
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (bedrooms) filter['features.bedrooms'] = Number(bedrooms);
    if (furnished) filter['features.furnished'] = furnished === 'true';
    if (available) filter.available = available === 'true';
    if (landlord) filter.landlord = landlord;

    const properties = await Property.find(filter)
      .populate('landlord', 'name email phone')
      .populate('tenant', 'name email phone')
      .sort('-createdAt');

    res.json(properties);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getPropertyById = async (req, res) => {
  try {
    // Check if the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid property ID format' });
    }

    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name email phone')
      .populate('tenant', 'name email phone')
      .populate('applications.tenant', 'name email phone');

    if (property) {
      res.json(property);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    console.error('Error in getPropertyById:', error);
    res.status(400).json({ message: error.message });
  }
};

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    // Handle existing images
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
      } catch (error) {
        console.error('Error parsing existingImages:', error);
        existingImages = Array.isArray(req.body.existingImages) ? 
          req.body.existingImages : 
          [req.body.existingImages];
      }
    }

    // Handle new images
    const newImages = req.files?.images ? 
      (Array.isArray(req.files.images) ? req.files.images : [req.files.images])
        .map(file => file.path.replace(/\\/g, '/').split('uploads/')[1]) 
      : [];

    // Combine existing and new images
    const updatedImages = [...existingImages, ...newImages];

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        images: updatedImages
      },
      { new: true }
    );

    res.json(updatedProperty);
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(400).json({ message: error.message });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const applyForProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (!property.available) {
      return res.status(400).json({ message: 'Property is not available' });
    }

    const alreadyApplied = property.applications.find(
      app => app.tenant.toString() === req.user._id.toString()
    );

    if (alreadyApplied) {
      return res.status(400).json({ message: 'Already applied to this property' });
    }

    const { wantsViewing, viewingDate, viewingTime } = req.body;

    // Validate viewing details if tenant wants to view the property
    if (wantsViewing) {
      if (!viewingDate || !viewingTime) {
        return res.status(400).json({ 
          message: 'Viewing date and time are required when requesting a viewing' 
        });
      }

      // Find the viewing date and time slot in the property
      const viewingDateObj = new Date(viewingDate);
      const [startTime] = viewingTime.split('-');
      
      const viewingDateEntry = property.viewingDates.find(
        date => date.date.toISOString().split('T')[0] === viewingDateObj.toISOString().split('T')[0]
      );

      if (!viewingDateEntry) {
        return res.status(400).json({ message: 'Selected viewing date is not available' });
      }

      const timeSlot = viewingDateEntry.timeSlots.find(
        slot => slot.startTime === startTime.trim()
      );

      if (!timeSlot) {
        return res.status(400).json({ message: 'Selected time slot is not available' });
      }

      if (timeSlot.isBooked) {
        return res.status(400).json({ message: 'This time slot is already booked' });
      }

      // Mark the time slot as booked
      timeSlot.isBooked = true;
      timeSlot.bookedBy = req.user._id;
    }

    // Get tenant's scoring
    const tenant = await User.findById(req.user._id);
    const tenantScoring = tenant.tenantScoring || Math.floor(Math.random() * 100);

    // Create application document
    const application = new Application({
      property: property._id,
      tenant: req.user._id,
      status: wantsViewing ? 'viewing' : 'pending',
      wantsViewing,
      viewingDate: wantsViewing ? viewingDate : undefined,
      viewingTime: wantsViewing ? viewingTime : undefined,
      tenantScoring
    });

    // Update property's applications array
    property.applications.push({
      tenant: req.user._id,
      status: wantsViewing ? 'viewing' : 'pending',
      wantsViewing,
      viewingDate: wantsViewing ? viewingDate : undefined,
      viewingTime: wantsViewing ? viewingTime : undefined,
      tenantScoring
    });

    // Save both the application and the updated property
    await Promise.all([
      application.save(),
      property.save()
    ]);

    res.status(201).json({ 
      message: wantsViewing 
        ? 'Application submitted with viewing request' 
        : 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Error in applyForProperty:', error);
    res.status(400).json({ message: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const property = await Property.findById(req.params.propertyId);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update applications' });
    }

    // Find the application in the Application collection
    const application = await Application.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log('Current property state:', {
      id: property._id,
      tenant: property.tenant,
      available: property.available,
      application: application
    });

    // Update application status
    application.status = status;
    await application.save();

    // Update property's tenant if application is approved
    if (status === 'approved') {
      property.available = false;
      property.tenant = application.tenant;
      
      // Update all other applications to rejected
      await Application.updateMany(
        { 
          property: property._id,
          _id: { $ne: application._id }
        },
        { status: 'rejected' }
      );

      console.log('After approval:', {
        id: property._id,
        tenant: property.tenant,
        available: property.available
      });
    } else if (status === 'declined') {
      // If the application is declined, remove the tenant if it was this application
      if (property.tenant && property.tenant.toString() === application.tenant.toString()) {
        property.tenant = null;
        property.available = true;
      }
    }

    // Save the property
    await property.save();

    // Verify the property was saved correctly
    const updatedProperty = await Property.findById(property._id).populate('tenant');
    console.log('Property after save:', {
      id: updatedProperty._id,
      tenant: updatedProperty.tenant,
      available: updatedProperty.available
    });

    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(400).json({ message: error.message });
  }
};

const getAvailableProperties = async (req, res) => {
  try {
    const { 
      type, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      city, 
      furnished,
      location 
    } = req.query;

    const filter = {
      available: true,
      status: { $ne: 'rented' }
    };

    if (type) filter.type = type;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (location) {
      filter['location.city'] = new RegExp(location, 'i');
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (bedrooms) filter['features.bedrooms'] = Number(bedrooms);
    if (furnished) filter['features.furnished'] = furnished === 'true';

    const properties = await Property.find(filter)
      .populate('landlord', 'name email phone')
      .sort('-createdAt');

    res.json(properties);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Mock AI generation function - replace with actual AI service later
const generateListingText = (propertyInfo) => {
  const {
    type,
    price,
    location,
    features,
    availableFrom
  } = propertyInfo;

  // Format the date
  const availableDate = new Date(availableFrom).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  // Generate a title
  const title = `${features.bedrooms} Bedroom ${type.charAt(0).toUpperCase() + type.slice(1)} in ${location.city}`;

  // Generate a description
  const description = `Welcome to this beautiful ${features.bedrooms}-bedroom, ${features.bathrooms}-bathroom ${type} located in the heart of ${location.city}, ${location.state}. This ${features.squareFootage} sq ft property offers a perfect blend of comfort and convenience.

Key Features:
• ${features.bedrooms} spacious bedrooms
• ${features.bathrooms} modern bathrooms
• ${features.squareFootage} square feet of living space
• ${features.furnished ? 'Fully furnished' : 'Unfurnished'}
• ${features.parking ? 'Parking available' : 'Street parking'}
• ${features.petsAllowed ? 'Pet-friendly' : 'No pets allowed'}

Location:
Situated in ${location.city}, ${location.state}, this property is perfectly located for easy access to local amenities, schools, and transportation.

Available from ${availableDate} at $${price}/month.

Don't miss out on this opportunity to make this ${type} your new home!`;

  return { title, description };
};

// Helper function to simulate delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generatePropertyListing = async (req, res) => {
  try {
    const propertyInfo = req.body;

    // Validate required fields
    const requiredFields = ['type', 'price', 'location', 'features', 'availableFrom'];
    const missingFields = requiredFields.filter(field => !propertyInfo[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Simulate AI processing time 
    const processingTime = Math.floor(Math.random() * 1000) + 3000; // Random time between 1-3 seconds
    await delay(processingTime);

    // Generate the listing text
    const { title, description } = generateListingText(propertyInfo);

    res.json({ title, description });
  } catch (error) {
    console.error('Error generating property listing:', error);
    res.status(500).json({ message: 'Error generating property listing' });
  }
};

// Get available viewing slots for a specific date
export const getViewingSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Find the viewing date entry
    const viewingDate = property.viewingDates.find(
      vd => vd.date.toISOString().split('T')[0] === date
    );

    if (!viewingDate) {
      return res.json({ timeSlots: [] });
    }

    // Filter out booked slots
    const availableSlots = viewingDate.timeSlots.filter(slot => !slot.isBooked);

    res.json({ timeSlots: availableSlots });
  } catch (error) {
    console.error('Error in getViewingSlots:', error);
    res.status(500).json({ 
      message: 'Error fetching viewing slots',
      error: error.message 
    });
  }
};

// Get available viewing dates for a property
export const getViewingDates = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Get all future dates that have at least one available slot
    const availableDates = property.viewingDates
      .filter(vd => {
        const date = new Date(vd.date);
        const hasAvailableSlots = vd.timeSlots.some(slot => !slot.isBooked);
        return date >= new Date() && hasAvailableSlots;
      })
      .map(vd => ({
        date: vd.date,
        availableSlots: vd.timeSlots.filter(slot => !slot.isBooked).length
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ dates: availableDates });
  } catch (error) {
    console.error('Error in getViewingDates:', error);
    res.status(500).json({ 
      message: 'Error fetching viewing dates',
      error: error.message 
    });
  }
};

export {
  createProperty,
  getProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  applyForProperty,
  updateApplicationStatus,
  getAvailableProperties,
  generatePropertyListing
}; 