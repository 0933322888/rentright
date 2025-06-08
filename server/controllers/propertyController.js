import Property from '../models/propertyModel.js';
import mongoose from 'mongoose';
import Application from '../models/applicationModel.js';
import PropertyDocument from '../models/propertyDocumentModel.js';

export const createProperty = async (req, res) => {
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

export const getProperties = async (req, res) => {
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

export const getPropertyById = async (req, res) => {
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

export const updateProperty = async (req, res) => {
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
    const newImages = req.files ? req.files.map(file => file.path.replace(/\\/g, '/').split('uploads/')[1]) : [];

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

export const deleteProperty = async (req, res) => {
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

export const applyForProperty = async (req, res) => {
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

    // Create application document
    const application = new Application({
      property: property._id,
      tenant: req.user._id,
      moveInDate: req.body.moveInDate,
      message: req.body.message,
      status: 'pending'
    });

    await application.save();

    // Update property's applications array
    property.applications.push({
      tenant: req.user._id,
      status: 'pending',
      moveInDate: req.body.moveInDate,
      message: req.body.message
    });

    await property.save();
    res.status(201).json({ message: 'Application submitted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
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

export const getAvailableProperties = async (req, res) => {
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
      status: { $ne: 'Rented' }
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