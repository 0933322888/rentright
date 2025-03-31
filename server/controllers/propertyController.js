import Property from '../models/propertyModel.js';
import mongoose from 'mongoose';

export const createProperty = async (req, res) => {
  try {
    const property = new Property({
      ...req.body,
      landlord: req.user._id,
      images: req.files ? req.files.map(file => file.path.replace(/\\/g, '/').split('uploads/')[1]) : []
    });

    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
  } catch (error) {
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
    const existingImages = req.body.existingImages ? 
      (Array.isArray(req.body.existingImages) ? req.body.existingImages : [req.body.existingImages]) : 
      [];

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

    property.applications.push({
      tenant: req.user._id,
      status: 'pending'
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

    const application = property.applications.id(req.params.applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = status;
    if (status === 'approved') {
      property.available = false;
      property.applications.forEach(app => {
        if (app._id.toString() !== req.params.applicationId) {
          app.status = 'rejected';
        }
      });
    }

    await property.save();
    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 