import Application from '../models/applicationModel.js';
import Property from '../models/propertyModel.js';
import TenantDocument from '../models/tenantDocumentModel.js';
import User from '../models/userModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { 
  getLeaseAgreementPath, 
  getLeaseAgreementUrl, 
  leaseAgreementExists,
  VALID_LOCATIONS 
} from '../utils/leaseAgreementUtils.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/lease-documents');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

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

    // If approved, update property.tenant and set available to false
    if (status === 'approved') {
      const property = await Property.findById(application.property._id);
      property.tenant = application.tenant;
      property.available = false;
      await property.save();
    }

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

export const terminateLease = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    // Set status to terminated
    application.status = 'terminated';
    await application.save();

    // Remove tenant from property if this application is the current tenant
    const property = await Property.findById(application.property);
    if (property && property.tenant && property.tenant.toString() === application.tenant.toString()) {
      property.tenant = null;
      property.available = true;
      await property.save();
    }

    res.json({ message: 'Lease terminated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const uploadTenantDocument = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    // Check if application exists and belongs to the tenant
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload documents for this application' });
    }

    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.document;
    
    // Validate file type
    if (!file.mimetype.includes('pdf')) {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.name);
    const baseName = path.basename(file.name, fileExt);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedName}${fileExt}`;
    
    const filepath = path.join(uploadsDir, filename);

    // Move file to uploads directory
    await file.mv(filepath);

    // Add document to application
    application.tenantDocuments.push({
      path: filepath,
      filename: filename,
      uploadedAt: new Date(),
      mimeType: file.mimetype,
      originalName: file.name
    });

    await application.save();

    // Format response with URL
    const document = application.tenantDocuments[application.tenantDocuments.length - 1];
    const response = {
      ...document.toObject(),
      url: `/uploads/lease-documents/${document.filename}`
    };

    res.json(response);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteTenantDocument = async (req, res) => {
  try {
    const { applicationId, documentId } = req.params;
    
    // Check if application exists and belongs to the tenant
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (application.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete documents for this application' });
    }

    // Find the document
    const document = application.tenantDocuments.id(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from filesystem
    const filepath = document.path;
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Remove document from application
    application.tenantDocuments.pull(documentId);
    await application.save();

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add lease agreement comment
export const addLeaseAgreementComment = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { text, parentCommentId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify user has access to this application
    if (userRole === 'tenant' && application.tenant.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to comment on this application' });
    }

    // If this is a reply, verify the parent comment exists
    if (parentCommentId) {
      const parentComment = application.leaseAgreement.comments.id(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    // Add comment
    const newComment = {
      user: userId,
      role: userRole,
      text,
      parentCommentId
    };
    application.leaseAgreement.comments.push(newComment);

    await application.save();

    // Populate user details for all comments
    await application.populate('leaseAgreement.comments.user', 'firstName lastName email');

    // Format comments as a tree structure
    const comments = application.leaseAgreement.comments;
    const commentMap = new Map();
    const rootComments = [];

    // First pass: create a map of all comments
    comments.forEach(comment => {
      commentMap.set(comment._id.toString(), {
        ...comment.toObject(),
        replies: []
      });
    });

    // Second pass: build the tree structure
    comments.forEach(comment => {
      const commentObj = commentMap.get(comment._id.toString());
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });

    res.json({
      ...application.leaseAgreement.toObject(),
      comments: rootComments
    });
  } catch (error) {
    console.error('Error adding lease agreement comment:', error);
    res.status(500).json({ message: 'Error adding comment to lease agreement' });
  }
};

// Update lease agreement status
export const updateLeaseAgreementStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { action } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify user has access to this application
    if (userRole === 'tenant' && application.tenant.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Handle different actions based on user role
    if (userRole === 'tenant' && action === 'approve') {
      application.leaseAgreement.status = 'tenant_approved';
      application.leaseAgreement.tenantApprovedAt = new Date();
    } else if (userRole === 'landlord' && action === 'approve') {
      application.leaseAgreement.status = 'landlord_approved';
      application.leaseAgreement.landlordApprovedAt = new Date();
    } else if (userRole === 'landlord' && action === 'request_changes') {
      application.leaseAgreement.status = 'pending';
      // Add a system comment about the change request
      application.leaseAgreement.comments.push({
        user: userId,
        role: userRole,
        text: 'Requested changes to the lease agreement'
      });
    } else {
      return res.status(400).json({ message: 'Invalid action for current role' });
    }

    await application.save();
    await application.populate('leaseAgreement.comments.user', 'firstName lastName email');

    res.json(application.leaseAgreement);
  } catch (error) {
    console.error('Error updating lease agreement status:', error);
    res.status(500).json({ message: 'Error updating lease agreement status' });
  }
};

// Get lease agreement status and comments
export const getLeaseAgreementDetails = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const application = await Application.findById(applicationId)
      .populate('leaseAgreement.comments.user', 'firstName lastName email')
      .populate('tenant', 'firstName lastName email')
      .populate('property.landlord', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify user has access to this application
    if (userRole === 'tenant' && application.tenant._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this application' });
    }

    res.json(application.leaseAgreement);
  } catch (error) {
    console.error('Error getting lease agreement details:', error);
    res.status(500).json({ message: 'Error retrieving lease agreement details' });
  }
};

// Upload standard lease document
export const uploadStandardLeaseDocument = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    // Check if application exists
    const application = await Application.findById(applicationId)
      .populate('property', 'landlord');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify user is the landlord of the property
    if (application.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to upload lease agreement for this application' });
    }

    if (!req.files || !req.files.document) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.document;
    
    // Validate file type
    if (!file.mimetype.includes('pdf')) {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.name);
    const baseName = path.basename(file.name, fileExt);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${uniqueSuffix}-${sanitizedName}${fileExt}`;
    
    const filepath = path.join(uploadsDir, filename);

    // Move file to uploads directory
    await file.mv(filepath);

    // Update application with standard lease document
    application.leaseAgreement.standardLeaseDocument = {
      path: filepath,
      filename: filename,
      uploadedAt: new Date(),
      mimeType: file.mimetype,
      originalName: file.name
    };

    // Reset status to pending when new document is uploaded
    application.leaseAgreement.status = 'pending';
    application.leaseAgreement.comments.push({
      user: req.user._id,
      role: 'landlord',
      text: 'Uploaded new standard lease agreement document'
    });

    await application.save();

    // Format response with URL
    const response = {
      ...application.leaseAgreement.standardLeaseDocument.toObject(),
      url: `/uploads/lease-documents/${filename}`
    };

    res.json(response);
  } catch (error) {
    console.error('Error uploading standard lease document:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get lease agreement document
export const getLeaseAgreementDocument = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findById(applicationId)
      .populate('property', 'location');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { countryCode, region } = application.property.location;
    
    if (!leaseAgreementExists(countryCode, region)) {
      return res.status(404).json({ 
        message: `No standard lease agreement available for ${countryCode}/${region}` 
      });
    }

    const filePath = getLeaseAgreementPath(countryCode, region);
    const url = getLeaseAgreementUrl(countryCode, region);

    // Update application with standard lease document info if not already set
    if (!application.leaseAgreement.standardLeaseDocument) {
      application.leaseAgreement.standardLeaseDocument = {
        path: filePath,
        filename: 'standard-lease-agreement.pdf',
        originalName: `Standard Lease Agreement - ${countryCode}/${region}.pdf`,
        mimeType: 'application/pdf',
        uploadedAt: new Date()
      };
      await application.save();
    }

    res.json({
      ...application.leaseAgreement.standardLeaseDocument.toObject(),
      url
    });
  } catch (error) {
    console.error('Error getting lease agreement document:', error);
    res.status(500).json({ message: error.message });
  }
};

// Serve lease agreement file
export const serveLeaseAgreementFile = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    const application = await Application.findById(applicationId)
      .populate('property', 'location');
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const { location } = application.property;
    if (!location) {
      return res.status(400).json({ message: 'Property location information is missing' });
    }

    // Determine country code and region based on location data
    let countryCode, region;
    
    // Check if state is a valid US state code
    if (location.state && VALID_LOCATIONS.US.includes(location.state)) {
      countryCode = 'US';
      region = location.state;
    }
    // Check if province is a valid Canadian province code
    else if (location.province && VALID_LOCATIONS.CA.includes(location.province)) {
      countryCode = 'CA';
      region = location.province;
    }
    // If state/province is not in valid locations, try to determine country based on format
    else if (location.state && /^[A-Z]{2}$/.test(location.state)) {
      countryCode = 'US';
      region = location.state;
    }
    else if (location.province && /^[A-Z]{2}$/.test(location.province)) {
      countryCode = 'CA';
      region = location.province;
    }
    else {
      return res.status(400).json({ message: 'Invalid property location format' });
    }

    try {
      const filePath = getLeaseAgreementPath(countryCode, region);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ 
          message: `No standard lease agreement available for ${countryCode}/${region}` 
        });
      }

      // Set appropriate headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      
      res.sendFile(filePath);
    } catch (error) {
      if (error.message === 'Invalid location') {
        return res.status(400).json({ message: 'Invalid property location format' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error serving lease agreement file:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get tenant's active lease
export const getMyLease = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find the tenant's approved application
    const application = await Application.findOne({
      tenant: userId,
      status: 'approved'
    })
    .populate('property', 'title location price images landlord')
    .populate('tenant', 'firstName lastName email')
    .populate('leaseAgreement.comments.user', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({ message: 'No active lease found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error getting tenant lease:', error);
    res.status(500).json({ message: 'Error retrieving lease details' });
  }
};

// Update lease start date
export const updateLeaseStartDate = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { leaseStartDate, action } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Verify user has access to this application
    if (userRole === 'tenant' && application.tenant.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Handle different actions
    if (action === 'set_date') {
      // Validate the date
      const startDate = new Date(leaseStartDate);
      if (isNaN(startDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }

      // Ensure the date is in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        return res.status(400).json({ message: 'Lease start date must be in the future' });
      }

      // Update the lease start date
      application.leaseAgreement.leaseStartDate = {
        date: startDate,
        setBy: userRole,
        approvedBy: null, // Reset approval when date is changed
        lastUpdatedAt: new Date()
      };
      
      // Add a system comment about the date update
      application.leaseAgreement.comments.push({
        user: userId,
        role: userRole,
        text: `${userRole === 'tenant' ? 'Tenant' : 'Landlord'} set lease start date to ${startDate.toLocaleDateString()}`
      });
    } 
    else if (action === 'approve_date') {
      const currentDate = application.leaseAgreement.leaseStartDate;
      
      // Check if there's a date to approve
      if (!currentDate || !currentDate.date) {
        return res.status(400).json({ message: 'No lease start date set to approve' });
      }

      // Check if the user is the one who set the date
      if (currentDate.setBy === userRole) {
        return res.status(400).json({ message: 'You cannot approve a date that you set' });
      }

      // Check if the date is already approved
      if (currentDate.approvedBy) {
        return res.status(400).json({ message: 'Lease start date is already approved' });
      }

      // Approve the date
      application.leaseAgreement.leaseStartDate.approvedBy = userRole;
      
      // Add a system comment about the approval
      application.leaseAgreement.comments.push({
        user: userId,
        role: userRole,
        text: `${userRole === 'tenant' ? 'Tenant' : 'Landlord'} approved the lease start date of ${new Date(currentDate.date).toLocaleDateString()}`
      });
    }
    else {
      return res.status(400).json({ message: 'Invalid action' });
    }

    await application.save();
    await application.populate('leaseAgreement.comments.user', 'firstName lastName email');

    res.json(application.leaseAgreement);
  } catch (error) {
    console.error('Error updating lease start date:', error);
    res.status(500).json({ message: 'Error updating lease start date' });
  }
}; 