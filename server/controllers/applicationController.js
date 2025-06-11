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

    // Find the viewing date and time slot in the property
    const viewingDateObj = new Date(viewingDate);
    const [startTime] = viewingTime.split('-');
    
    const viewingDateEntry = propertyDoc.viewingDates.find(
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

    // Get tenant's scoring
    const tenant = await User.findById(req.user._id);
    const tenantScoring = tenant.tenantScoring || Math.floor(Math.random() * 100);

    const application = new Application({
      property,
      tenant: req.user._id,
      status: 'viewing',
      wantsViewing: true,
      viewingDate,
      viewingTime,
      tenantScoring
    });

    const savedApplication = await application.save();

    // Mark the time slot as booked
    timeSlot.isBooked = true;
    timeSlot.bookedBy = req.user._id;
    await propertyDoc.save();

    // Add application to property's applications array
    propertyDoc.applications.push({
      tenant: req.user._id,
      status: 'viewing',
      wantsViewing: true,
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

    // Remove application from the property's applications array
    await Property.findByIdAndUpdate(
      application.property._id,
      {
        $pull: {
          applications: {
            tenant: application.tenant._id
          }
        }
      }
    );

    // Delete the application document
    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get applications for a specific property
export const getPropertyApplications = async (req, res) => {
  try {
    const propertyId = req.params.id;
    
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
    const application = await Application.findById(req.params.id)
      .populate('property', 'viewingDates');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only allow tenant to update their own application
    if (application.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // If no new viewing details provided, return current application
    if (!viewingDate && !viewingTime) {
      return res.json(application);
    }

    const property = application.property;

    // Unbook the old time slot if it exists
    if (application.viewingDate && application.viewingTime) {
      const oldDate = new Date(application.viewingDate);
      const [oldStartTime] = application.viewingTime.split('-');
      
      const oldViewingDateEntry = property.viewingDates.find(
        date => date.date.toISOString().split('T')[0] === oldDate.toISOString().split('T')[0]
      );

      if (oldViewingDateEntry) {
        const oldTimeSlot = oldViewingDateEntry.timeSlots.find(
          slot => slot.startTime === oldStartTime.trim()
        );

        if (oldTimeSlot && oldTimeSlot.bookedBy?.toString() === req.user._id.toString()) {
          oldTimeSlot.isBooked = false;
          oldTimeSlot.bookedBy = null;
        }
      }
    }

    // Book the new time slot if provided
    if (viewingDate && viewingTime) {
      const newDate = new Date(viewingDate);
      const [newStartTime] = viewingTime.split('-');

      const newViewingDateEntry = property.viewingDates.find(
        date => date.date.toISOString().split('T')[0] === newDate.toISOString().split('T')[0]
      );

      if (!newViewingDateEntry) {
        return res.status(400).json({ message: 'Selected viewing date is not available' });
      }

      const newTimeSlot = newViewingDateEntry.timeSlots.find(
        slot => slot.startTime === newStartTime.trim()
      );

      if (!newTimeSlot) {
        return res.status(400).json({ message: 'Selected time slot is not available' });
      }

      if (newTimeSlot.isBooked && newTimeSlot.bookedBy?.toString() !== req.user._id.toString()) {
        return res.status(400).json({ message: 'This time slot is already booked by another tenant' });
      }

      // Book the new slot
      newTimeSlot.isBooked = true;
      newTimeSlot.bookedBy = req.user._id;

      // Update application with new viewing details
      application.viewingDate = viewingDate;
      application.viewingTime = viewingTime;
    } else if (viewingDate) {
      application.viewingDate = viewingDate;
    } else if (viewingTime) {
      application.viewingTime = viewingTime;
    }

    // Save both the property (with updated slots) and the application
    await Promise.all([
      property.save(),
      application.save()
    ]);

    res.json(application);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Promote application from viewing to pending status
export const promoteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('property')
      .populate('tenant', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only allow tenant to promote their own application
    if (application.tenant._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Only allow promoting from viewing status
    if (application.status !== 'viewing') {
      return res.status(400).json({ 
        message: 'Only applications in viewing status can be promoted to pending' 
      });
    }

    // Update application status
    application.status = 'pending';
    await application.save();

    // Update property's applications array
    const property = await Property.findById(application.property._id);
    const applicationIndex = property.applications.findIndex(
      app => app.tenant.toString() === application.tenant._id.toString()
    );

    if (applicationIndex !== -1) {
      property.applications[applicationIndex].status = 'pending';
      await property.save();
    }

    res.json({
      message: 'Application promoted to pending status successfully',
      application
    });
  } catch (error) {
    console.error('Error in promoteApplication:', error);
    res.status(400).json({ message: error.message });
  }
}; 