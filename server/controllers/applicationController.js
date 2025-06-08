import Application from '../models/applicationModel.js';
import Property from '../models/propertyModel.js';
import TenantDocument from '../models/tenantDocumentModel.js';
import User from '../models/userModel.js';

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
    const { property, viewingDate, viewingTime } = req.body;

    // Check if property exists and is available
    const propertyDoc = await Property.findById(property);
    if (!propertyDoc) {
      return res.status(404).json({ message: 'Property not found' });
    }
    if (!propertyDoc.available) {
      return res.status(400).json({ message: 'Property is not available' });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      property,
      tenant: req.user._id
    });
    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied to this property' });
    }

    // Validate viewing date and time
    if (!viewingDate || !viewingTime) {
      return res.status(400).json({ message: 'Viewing date and time are required' });
    }

    // Get tenant's scoring
    const tenant = await User.findById(req.user._id);
    const tenantScoring = tenant.tenantScoring || Math.floor(Math.random() * 100); // For now, use random number if not set

    const application = new Application({
      property,
      tenant: req.user._id,
      status: 'pending',
      viewingDate,
      viewingTime,
      tenantScoring
    });

    const savedApplication = await application.save();

    // Add application to property's applications array
    propertyDoc.applications.push({
      tenant: req.user._id,
      status: 'pending',
      viewingDate,
      viewingTime,
      tenantScoring
    });
    await propertyDoc.save();

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

// Get applications for a specific property
export const getPropertyApplications = async (req, res) => {
  try {
    const { propertyId } = req.params;
    
    // Check if property exists and belongs to the landlord
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Only allow landlord to view applications for their property
    if (property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ property: propertyId })
      .populate('tenant', 'name email phone tenantScoring')
      .sort('-createdAt');

    // Get tenant documents for each application
    const applicationsWithDocuments = await Promise.all(
      applications.map(async (application) => {
        const tenantDocument = await TenantDocument.findOne({ tenant: application.tenant._id });
        if (tenantDocument) {
          // Format the document data to include URLs
          const formattedDocument = tenantDocument.toObject();
          const documentFields = ['proofOfIdentity', 'proofOfIncome', 'creditHistory', 'rentalHistory', 'additionalDocuments'];
          
          documentFields.forEach(field => {
            if (formattedDocument[field] && Array.isArray(formattedDocument[field])) {
              formattedDocument[field] = formattedDocument[field].map(doc => ({
                ...doc,
                url: `/uploads/tenant-documents/${doc.filename}`,
                thumbnailUrl: `/uploads/tenant-documents/thumbnails/${doc.filename}`
              }));
            }
          });

          return {
            ...application.toObject(),
            tenantDocument: formattedDocument
          };
        }
        return application;
      })
    );

    res.json(applicationsWithDocuments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update application viewing date and time (tenant only)
export const updateApplicationViewing = async (req, res) => {
  try {
    const { viewingDate, viewingTime } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only allow tenant to update their own application
    if (application.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    if (viewingDate) application.viewingDate = viewingDate;
    if (viewingTime) application.viewingTime = viewingTime;
    await application.save();

    res.json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 