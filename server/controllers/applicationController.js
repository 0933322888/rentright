import Application from '../models/applicationModel.js';
import Property from '../models/propertyModel.js';

// Get all applications (filtered by user role)
export const getApplications = async (req, res) => {
  try {
    let query = {};
    
    // If user is a tenant, show only their applications
    if (req.user.role === 'tenant') {
      query.tenant = req.user._id;
    }
    // If user is a landlord, show applications for their properties
    else if (req.user.role === 'landlord') {
      const properties = await Property.find({ landlord: req.user._id });
      const propertyIds = properties.map(prop => prop._id);
      query.property = { $in: propertyIds };
    }

    const applications = await Application.find(query)
      .populate('property', 'title location price images')
      .populate('tenant', 'name email phone')
      .sort('-createdAt');

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single application
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('property', 'title location price images landlord')
      .populate('tenant', 'name email phone');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user has permission to view this application
    if (
      req.user.role === 'tenant' && application.tenant._id.toString() !== req.user._id.toString() ||
      req.user.role === 'landlord' && application.property.landlord.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new application
export const createApplication = async (req, res) => {
  try {
    const { propertyId } = req.body;

    // Check if property exists and is available
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (!property.available) {
      return res.status(400).json({ message: 'Property is not available' });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      property: propertyId,
      tenant: req.user._id
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this property' });
    }

    const application = new Application({
      property: propertyId,
      tenant: req.user._id,
      status: 'pending'
    });

    const savedApplication = await application.save();

    // Add application to property's applications array
    property.applications.push({
      tenant: req.user._id,
      status: 'pending'
    });
    await property.save();

    res.status(201).json(savedApplication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update application status
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('property', 'landlord available');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is the landlord of the property
    if (application.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    application.status = status;
    await application.save();

    res.json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('property', 'landlord');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only allow tenant to delete their own application
    if (application.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this application' });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 