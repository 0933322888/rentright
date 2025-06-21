import Property from '../models/propertyModel.js';
import mongoose from 'mongoose';
import Application from '../models/applicationModel.js';
import PropertyDocument from '../models/propertyDocumentModel.js';
import User from '../models/userModel.js';
import { geocodeAddressWithRetry } from '../utils/geocoding.js';
import { generatePriceSuggestion } from '../utils/aiPricingService.js';
import { generateListingContent } from '../utils/aiImageRecognition.js';
import { uploadFileToS3, generateS3Key } from '../utils/s3.js';
import fs from 'fs';

const createProperty = async (req, res) => {
  try {
    // Prepare property data (without images)
    const propertyData = {
      ...req.body,
      landlord: req.user._id,
      status: 'pending' // Set status to pending for admin approval
    };

    // Handle features field - it might be a JSON string that needs parsing
    if (req.body.features) {
      if (typeof req.body.features === 'string') {
        try {
          propertyData.features = JSON.parse(req.body.features);
        } catch (parseError) {
          console.error('Error parsing features JSON:', parseError);
          // Keep the original string if parsing fails
        }
      } else {
        propertyData.features = req.body.features;
      }
    }

       // Geocode the address to get coordinates
    if (req.body.location) {
      try {
        const coordinates = await geocodeAddressWithRetry(req.body.location);

        if (coordinates) {
          propertyData.location = {
            ...req.body.location,
            coordinates: coordinates
          };
        }
      } catch (geocodingError) {
        console.error('Geocoding failed, creating property without coordinates:', geocodingError.message);
        // Continue with property creation even if geocoding fails
      }
    }

    // Step 1: Create property without images
    const property = new Property(propertyData);
    const createdProperty = await property.save();

    // Step 2: Upload images to S3 using property ID as folder
    let images = [];
    if (req.files && req.files.images) {
      const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
      images = await Promise.all(files.map(async (file) => {
        // Read file data from disk since we're using disk storage
        const fileBuffer = fs.readFileSync(file.path);
        const key = `property-images/${createdProperty._id}/${file.originalname}`;
        const url = await uploadFileToS3(fileBuffer, key, file.mimetype);

        // Clean up the temporary file
        fs.unlinkSync(file.path);

        return url;
      }));
      // Step 3: Update property with image URLs
      createdProperty.images = images;
      await createdProperty.save();
    } else if (req.body.images) {
      images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      createdProperty.images = images;
      await createdProperty.save();
    }

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
      bathrooms,
      city,
      furnished,
      available,
      landlord
    } = req.query;

    // Only filter by status: 'active' if not querying by landlord
    const filter = {};
    if (!landlord) {
      filter.status = 'active';
    }

    if (type) filter.type = type;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (bedrooms) {
      const bedroomValues = bedrooms.split(',').map(v => v.trim()).filter(v => v);
      if (bedroomValues.length > 0) {
        const exactValues = bedroomValues.filter(v => v !== '4+').map(v => Number(v));
        const hasFourPlus = bedroomValues.includes('4+');

        if (exactValues.length > 0 && hasFourPlus) {
          filter['features.bedrooms'] = { $in: exactValues };
          filter.$or = [{ 'features.bedrooms': { $gte: 4 } }];
        } else if (exactValues.length > 0) {
          filter['features.bedrooms'] = { $in: exactValues };
        } else if (hasFourPlus) {
          filter['features.bedrooms'] = { $gte: 4 };
        }
      }
    }
    if (bathrooms) {
      const bathroomValues = bathrooms.split(',').map(v => v.trim()).filter(v => v);
      if (bathroomValues.length > 0) {
        const exactValues = bathroomValues.filter(v => v !== '4+').map(v => Number(v));
        const hasFourPlus = bathroomValues.includes('4+');

        if (exactValues.length > 0 && hasFourPlus) {
          // For exact values, use range queries to include decimals
          const bathroomConditions = exactValues.map(value => ({
            'features.bathrooms': { $gte: value, $lt: value + 1 }
          }));
          bathroomConditions.push({ 'features.bathrooms': { $gte: 4 } });
          filter.$or = bathroomConditions;
        } else if (exactValues.length > 0) {
          // For exact values, use range queries to include decimals
          const bathroomConditions = exactValues.map(value => ({
            'features.bathrooms': { $gte: value, $lt: value + 1 }
          }));
          filter.$or = bathroomConditions;
        } else if (hasFourPlus) {
          filter['features.bathrooms'] = { $gte: 4 };
        }
      }
    }
    if (furnished) filter['features.furnished'] = furnished === 'true';
    if (available) filter.available = available === 'true';
    if (landlord) {
      try {
        filter.landlord = new mongoose.Types.ObjectId(landlord);
      } catch (e) {
        // fallback to string if not a valid ObjectId
        filter.landlord = landlord;
      }
    }

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

    // Check if user is authorized to update this property
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    // Handle existing images - support both JSON and form data
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = typeof req.body.existingImages === 'string'
          ? JSON.parse(req.body.existingImages)
          : req.body.existingImages;
      } catch (error) {
        console.error('Error parsing existingImages:', error);
        existingImages = Array.isArray(req.body.existingImages) ?
          req.body.existingImages :
          [req.body.existingImages];
      }
    }

    // Handle new images from form data
    // Note: New images are now uploaded to S3 separately via the uploadPropertyImages endpoint
    // This endpoint only handles JSON updates, not file uploads
    const newImages = [];

    // Combine existing and new images, or use images from JSON
    const updatedImages = req.body.images || [...existingImages, ...newImages];

    // Prepare update data
    const updateData = {
      ...req.body,
      images: updatedImages
    };

    // Handle features field - support both JSON and string formats
    if (req.body.features) {
      if (typeof req.body.features === 'string') {
        try {
          updateData.features = JSON.parse(req.body.features);
        } catch (parseError) {
          console.error('Error parsing features JSON in update:', parseError);
          // Keep the original string if parsing fails
        }
      } else {
        updateData.features = req.body.features;
      }
    }

    // Geocode the address if location is being updated
    if (req.body.location) {
      try {
        const coordinates = await geocodeAddressWithRetry(req.body.location);

        if (coordinates) {
          updateData.location = {
            ...req.body.location,
            coordinates: coordinates
          };
        }
      } catch (geocodingError) {
        console.error('Geocoding failed during property update:', geocodingError.message);
        // Continue with property update even if geocoding fails
      }
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      req.params.id,
      updateData,
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
      tenantScoring,
      leaseAgreement: req.body.leaseAgreement
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
      bathrooms,
      city,
      furnished,
      location
    } = req.query;

    const filter = {
      available: true,
      status: 'active' // Only show approved properties
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
    if (bedrooms) {
      const bedroomValues = bedrooms.split(',').map(v => v.trim()).filter(v => v);
      if (bedroomValues.length > 0) {
        const exactValues = bedroomValues.filter(v => v !== '4+').map(v => Number(v));
        const hasFourPlus = bedroomValues.includes('4+');

        if (exactValues.length > 0 && hasFourPlus) {
          filter['features.bedrooms'] = { $in: exactValues };
          filter.$or = [{ 'features.bedrooms': { $gte: 4 } }];
        } else if (exactValues.length > 0) {
          filter['features.bedrooms'] = { $in: exactValues };
        } else if (hasFourPlus) {
          filter['features.bedrooms'] = { $gte: 4 };
        }
      }
    }
    if (bathrooms) {
      const bathroomValues = bathrooms.split(',').map(v => v.trim()).filter(v => v);
      if (bathroomValues.length > 0) {
        const exactValues = bathroomValues.filter(v => v !== '4+').map(v => Number(v));
        const hasFourPlus = bathroomValues.includes('4+');

        if (exactValues.length > 0 && hasFourPlus) {
          // For exact values, use range queries to include decimals
          const bathroomConditions = exactValues.map(value => ({
            'features.bathrooms': { $gte: value, $lt: value + 1 }
          }));
          bathroomConditions.push({ 'features.bathrooms': { $gte: 4 } });
          filter.$or = bathroomConditions;
        } else if (exactValues.length > 0) {
          // For exact values, use range queries to include decimals
          const bathroomConditions = exactValues.map(value => ({
            'features.bathrooms': { $gte: value, $lt: value + 1 }
          }));
          filter.$or = bathroomConditions;
        } else if (hasFourPlus) {
          filter['features.bathrooms'] = { $gte: 4 };
        }
      }
    }
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
    const { propertyInfo, imageUrls } = req.body;

    // Validate required fields
    if (!propertyInfo) {
      return res.status(400).json({
        message: 'Property info is required'
      });
    }

    const requiredFields = ['type', 'price', 'location', 'features', 'availableFrom'];
    const missingFields = requiredFields.filter(field => !propertyInfo[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Convert image URLs to base64 for AI analysis
    let imageBuffers = [];
    if (imageUrls && imageUrls.length > 0) {
      try {
        const { convertImageUrlsToBase64 } = await import('../utils/imageToBase64.js');
        imageBuffers = await convertImageUrlsToBase64(imageUrls);
      } catch (error) {
        console.warn('Failed to convert image URLs to base64:', error.message);
        // Continue without images if conversion fails
      }
    }

    // Use AI to generate listing content
    const aiResult = await generateListingContent(propertyInfo, imageBuffers);

    if (aiResult.error) {
      // Fallback to simple generation if AI fails
      console.warn('AI generation failed, using fallback:', aiResult.error);
      const fallbackResult = generateListingText(propertyInfo);
      res.json(fallbackResult);
    } else {
      res.json({
        title: aiResult.title,
        description: aiResult.description
      });
    }
  } catch (error) {
    console.error('Error generating property listing:', error);

    // Fallback to simple generation if AI fails
    try {
      const fallbackResult = generateListingText(req.body.propertyInfo || req.body);
      res.json(fallbackResult);
    } catch (fallbackError) {
      res.status(500).json({ message: 'Error generating property listing' });
    }
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

const updatePropertyCommissionStatus = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { commissionStatus } = req.body;

    if (!['pending', 'received', 'not_applicable'].includes(commissionStatus)) {
      return res.status(400).json({ message: 'Invalid commission status' });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.commissionStatus = commissionStatus;
    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Error updating property commission status:', error);
    res.status(400).json({ message: error.message });
  }
};

const generatePropertyPrice = async (req, res) => {
  try {
    const propertyData = req.body;

    // Validate required fields
    const requiredFields = ['propertyInfo', 'location'];
    const missingFields = requiredFields.filter(field => !propertyData[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    // Validate location data
    if (!propertyData.location.city || !propertyData.location.state) {
      return res.status(400).json({
        message: 'City and state are required for price calculation'
      });
    }

    // Validate features data
    if (!propertyData.propertyInfo.features.bedrooms || !propertyData.propertyInfo.features.bathrooms) {
      return res.status(400).json({
        message: 'Bedrooms and bathrooms are required for price calculation'
      });
    }

    // Generate price suggestion using AI service
    const priceSuggestion = await generatePriceSuggestion(propertyData.propertyInfo, propertyData.location);

    res.json(priceSuggestion);
  } catch (error) {
    console.error('Error generating price suggestion:', error);
    res.status(500).json({
      message: 'Error generating price suggestion',
      error: error.message
    });
  }
};

export const uploadPropertyImages = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    const files = Array.isArray(req.files) ? req.files : [req.files];
    const newImages = await Promise.all(files.map(async (file) => {
      // Read file data from disk since we're using disk storage
      const fileBuffer = fs.readFileSync(file.path);
      const key = `property-images/${property._id}/${file.originalname}`;
      const url = await uploadFileToS3(fileBuffer, key, file.mimetype);

      // Clean up the temporary file
      fs.unlinkSync(file.path);

      return url;
    }));

    property.images = property.images.concat(newImages);
    await property.save();

    res.json(property);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const uploadImages = (req, res) => {
  res.status(400).json({ message: 'Please use /api/properties/:id/images to upload property images.' });
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
  generatePropertyListing,
  generatePropertyPrice,
  updatePropertyCommissionStatus
}; 