import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';
import Application from '../models/applicationModel.js';
import TenantDocument from '../models/tenantDocumentModel.js';
import PropertyDocument from '../models/propertyDocumentModel.js';
import { generateViewingTimeSlots } from '../utils/timeSlotGenerator.js';
import {
  getAvailableLeaseAgreements,
  uploadLeaseAgreement,
  deleteLeaseAgreement,
  getLeaseAgreementPath,
  getValidLocations
} from '../utils/leaseAgreementUtils.js';
import { geocodeExistingProperties } from '../utils/geocoding.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import Escalation from '../models/escalationModel.js';
import Ticket from '../models/ticketModel.js';

// Get all properties for admin
export const getAllProperties = async (req, res) => {
  try {
    const properties = await Property.find()
      .populate('landlord', 'name email')
      .populate('tenant', 'name email')
      .sort('-createdAt');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve property
export const approveProperty = async (req, res) => {
  try {
    const { comments } = req.body;
    const property = req.property; // Using the property from middleware
    
    // Only allow approval if property is in 'pending' status
    if (property.status !== 'pending') {
      return res.status(400).json({ message: 'Property can only be approved when in pending status' });
    }

    property.status = 'active';
    if (comments) {
      property.adminComments = comments;
    }
    await property.save();

    res.json({ 
      message: 'Property approved and listed successfully', 
      property 
    });
  } catch (error) {
    console.error('Error in approveProperty:', error);
    res.status(500).json({ 
      message: 'Error approving property',
      error: error.message 
    });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all landlords for admin
export const getAllLandlords = async (req, res) => {
  try {
    const landlords = await User.find({ role: 'landlord' })
      .select('-password')
      .sort('-createdAt');

    // Get property counts for each landlord
    const landlordsWithPropertyCount = await Promise.all(
      landlords.map(async (landlord) => {
        const propertyCount = await Property.countDocuments({ landlord: landlord._id });
        return {
          ...landlord.toObject(),
          propertyCount
        };
      })
    );

    res.json(landlordsWithPropertyCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all tenants for admin
export const getAllTenants = async (req, res) => {
  try {
    const tenants = await User.find({ role: 'tenant' })
      .select('-password')
      .sort('-createdAt');

    // Get application counts and tenant documents for each tenant
    const tenantsWithDetails = await Promise.all(
      tenants.map(async (tenant) => {
        const [applicationCount, tenantDocument] = await Promise.all([
          Application.countDocuments({ tenant: tenant._id }),
          TenantDocument.findOne({ tenant: tenant._id })
        ]);
        
        return {
          ...tenant.toObject(),
          applicationCount,
          tenantDocument: tenantDocument || null
        };
      })
    );

    res.json(tenantsWithDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all applications for admin
export const getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('property', 'title location price')
      .populate('tenant', 'name email rating')
      .sort('-createdAt');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete application
export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await Application.findByIdAndDelete(req.params.id);
    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete tenant and their applications
export const deleteTenant = async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'User is not a tenant' });
    }

    // Delete all applications associated with this tenant
    await Application.deleteMany({ tenant: tenant._id });

    // Delete the tenant
    await User.findByIdAndDelete(tenant._id);

    res.json({ message: 'Tenant and their applications deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single tenant
export const getTenantById = async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'User is not a tenant' });
    }

    // Get tenant document
    const tenantDocument = await TenantDocument.findOne({ tenant: tenant._id });

    // Get application count
    const applicationCount = await Application.countDocuments({ tenant: tenant._id });

    res.json({
      ...tenant.toObject(),
      applicationCount,
      tenantDocument: tenantDocument || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update tenant
export const updateTenant = async (req, res) => {
  try {
    const tenant = await User.findById(req.params.id);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (tenant.role !== 'tenant') {
      return res.status(400).json({ message: 'User is not a tenant' });
    }

    // Update tenant fields
    tenant.name = req.body.name || tenant.name;
    tenant.email = req.body.email || tenant.email;
    tenant.phone = req.body.phone || tenant.phone;
    tenant.hasProfile = req.body.hasProfile !== undefined ? req.body.hasProfile : tenant.hasProfile;
    tenant.rating = req.body.rating !== undefined ? Number(req.body.rating) : tenant.rating;

    const updatedTenant = await tenant.save();
    res.json(updatedTenant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add viewing dates to property
export const addViewingDates = async (req, res) => {
  try {
    const { dates } = req.body;
    console.log('Received dates:', JSON.stringify(dates, null, 2));

    // Validate dates array
    if (!Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ message: 'Please provide at least one viewing date' });
    }

    // Process each date
    const processedDates = await Promise.all(dates.map(async dateData => {
      const { date, startTime, endTime } = dateData;
      
      // Validate required fields
      if (!date || !startTime || !endTime) {
        throw new Error('Each date must have a date, start time, and end time');
      }

      // Convert date to Date object and validate it's in the future
      const viewingDate = new Date(date);
      if (viewingDate < new Date()) {
        throw new Error('Viewing dates must be in the future');
      }

      try {
        // Generate 30-minute time slots
        const timeSlots = generateViewingTimeSlots(startTime, endTime);
        
        return {
          date: viewingDate,
          timeSlots
        };
      } catch (error) {
        throw new Error(`Invalid time range for date ${date}: ${error.message}`);
      }
    }));

    // Update property with all viewing dates
    const updatedProperty = await Property.findByIdAndUpdate(
      req.property._id,
      { 
        $push: { 
          viewingDates: { 
            $each: processedDates 
          } 
        },
        status: 'active' // Set status to active when adding viewing dates
      },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    console.log('Updated property:', updatedProperty);
    res.json({ 
      message: 'Viewing dates added successfully',
      property: updatedProperty 
    });
  } catch (error) {
    console.error('Error in addViewingDates:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Error adding viewing dates',
      error: error.message 
    });
  }
};

// Update property status to review
export const submitForReview = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Only allow submission if property is in 'new' status
    if (property.status !== 'new') {
      return res.status(400).json({ message: 'Property can only be submitted for review when in new status' });
    }

    property.status = 'review';
    await property.save();

    res.json({ message: 'Property submitted for review successfully', property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get property details for review
export const getPropertyForReview = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('landlord', 'name email phone')
      .populate('tenant', 'name email phone')
      .populate('applications.tenant', 'name email phone');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Get property documents
    const propertyDocuments = await PropertyDocument.findOne({ property: property._id });

    res.json({
      property,
      documents: propertyDocuments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject property with comments
export const rejectProperty = async (req, res) => {
  try {
    const { comments } = req.body;
    const property = await Property.findById(req.params.id);
    
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Only allow rejection if property is in 'pending' status
    if (property.status !== 'pending') {
      return res.status(400).json({ message: 'Property can only be rejected when in pending status' });
    }

    property.status = 'new';
    property.adminComments = comments;
    await property.save();

    res.json({ message: 'Property rejected successfully', property });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete viewing date
export const deleteViewingDate = async (req, res) => {
  try {
    const { dateId } = req.params;
    const property = req.property;

    // Find and remove the viewing date
    const updatedProperty = await Property.findByIdAndUpdate(
      property._id,
      { 
        $pull: { 
          viewingDates: { _id: dateId } 
        } 
      },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.json({ 
      message: 'Viewing date deleted successfully',
      property: updatedProperty 
    });
  } catch (error) {
    console.error('Error in deleteViewingDate:', error);
    res.status(500).json({ 
      message: 'Error deleting viewing date',
      error: error.message 
    });
  }
};

// Update a viewing date
export const updateViewingDate = async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    const { dateId } = req.params;
    console.log('Update request:', { dateId, date, startTime, endTime });

    // Validate date
    if (!date) {
      return res.status(400).json({ 
        message: 'Please provide a valid date' 
      });
    }

    // Convert date to Date object and validate it's in the future
    const viewingDate = new Date(date);
    if (viewingDate < new Date()) {
      return res.status(400).json({ 
        message: 'Viewing date must be in the future' 
      });
    }

    // Find the viewing date in the property's viewingDates array
    const viewingDateIndex = req.property.viewingDates.findIndex(
      vd => vd._id.toString() === dateId
    );

    if (viewingDateIndex === -1) {
      return res.status(404).json({ 
        message: 'Viewing date not found' 
      });
    }

    console.log('Found viewing date at index:', viewingDateIndex);
    console.log('Current viewing date:', req.property.viewingDates[viewingDateIndex]);

    const existingDate = req.property.viewingDates[viewingDateIndex];
    const hasBookedSlots = existingDate.timeSlots.some(slot => slot.isBooked);

    // If startTime and endTime are provided, update the time slots
    if (startTime && endTime) {
      try {
        console.log('Generating time slots for:', { startTime, endTime });
        // Generate new time slots
        const timeSlots = generateViewingTimeSlots(startTime, endTime);
        console.log('Generated time slots:', timeSlots);

        let updatedTimeSlots;
        if (hasBookedSlots) {
          // If there are booked slots, we need to preserve them
          const bookedSlots = existingDate.timeSlots.filter(slot => slot.isBooked);
          console.log('Preserving booked slots:', bookedSlots);
          
          // Combine booked slots with new unbooked slots
          updatedTimeSlots = [
            ...bookedSlots,
            ...timeSlots.filter(newSlot => 
              !bookedSlots.some(bookedSlot => 
                bookedSlot.startTime === newSlot.startTime && 
                bookedSlot.endTime === newSlot.endTime
              )
            )
          ];
        } else {
          updatedTimeSlots = timeSlots;
        }

        console.log('Final time slots to update:', updatedTimeSlots);

        // Update the property with new time slots
        const updatedProperty = await Property.findByIdAndUpdate(
          req.property._id,
          {
            $set: {
              [`viewingDates.${viewingDateIndex}.date`]: viewingDate,
              [`viewingDates.${viewingDateIndex}.timeSlots`]: updatedTimeSlots
            }
          },
          { new: true, runValidators: true }
        );

        if (!updatedProperty) {
          return res.status(404).json({ message: 'Property not found' });
        }

        console.log('Updated property viewing dates:', updatedProperty.viewingDates[viewingDateIndex]);
        res.json({ 
          message: 'Viewing date and time slots updated successfully',
          property: updatedProperty 
        });
      } catch (error) {
        console.error('Error generating time slots:', error);
        return res.status(400).json({ 
          message: 'Invalid time range',
          details: error.message 
        });
      }
    } else {
      // If only updating the date, keep existing time slots
      const updatedProperty = await Property.findByIdAndUpdate(
        req.property._id,
        {
          $set: {
            [`viewingDates.${viewingDateIndex}.date`]: viewingDate
          }
        },
        { new: true, runValidators: true }
      );

      if (!updatedProperty) {
        return res.status(404).json({ message: 'Property not found' });
      }

      console.log('Updated property (date only):', updatedProperty.viewingDates[viewingDateIndex]);
      res.json({ 
        message: 'Viewing date updated successfully',
        property: updatedProperty 
      });
    }
  } catch (error) {
    console.error('Error in updateViewingDate:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        details: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Error updating viewing date',
      error: error.message 
    });
  }
};

export const getLeaseAgreements = async (req, res) => {
  try {
    const agreements = getAvailableLeaseAgreements();
    const validLocations = getValidLocations();
    
    res.json({
      agreements,
      validLocations
    });
  } catch (error) {
    console.error('Error getting lease agreements:', error);
    res.status(500).json({ message: 'Failed to get lease agreements' });
  }
};

export const uploadLeaseAgreementFile = async (req, res) => {
  try {
    const { countryCode, region } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    
    // Validate file type
    if (!file.mimetype.includes('pdf')) {
      return res.status(400).json({ message: 'Only PDF files are allowed' });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ message: 'File size must be less than 10MB' });
    }

    const result = await uploadLeaseAgreement(countryCode, region, file);
    res.json(result);
  } catch (error) {
    console.error('Error uploading lease agreement:', error);
    if (error.message === 'Invalid location') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to upload lease agreement' });
    }
  }
};

export const deleteLeaseAgreementFile = async (req, res) => {
  try {
    const { countryCode, region } = req.params;
    
    await deleteLeaseAgreement(countryCode, region);
    res.json({ message: 'Lease agreement deleted successfully' });
  } catch (error) {
    console.error('Error deleting lease agreement:', error);
    if (error.message === 'Invalid location') {
      res.status(400).json({ message: error.message });
    } else if (error.message === 'Lease agreement not found') {
      res.status(404).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to delete lease agreement' });
    }
  }
};

export const getLeaseAgreementFile = async (req, res) => {
  try {
    const { countryCode, region } = req.params;
    
    // Get token from either query parameter or Authorization header
    let token;
    if (req.query.token) {
      token = req.query.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    console.log('Token received:', token ? 'Present' : 'Missing'); // Debug log

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded:', decoded); // Debug log
      
      // Get user from database to verify role
      const user = await User.findById(decoded.id);
      console.log('User found:', user ? `Role: ${user.role}` : 'Not found'); // Debug log

      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized, admin access required' });
      }

      const filePath = getLeaseAgreementPath(countryCode, region);
      console.log('File path:', filePath); // Debug log
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Lease agreement not found' });
      }

      // Set appropriate headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      
      res.sendFile(filePath);
    } catch (error) {
      console.error('Token verification error:', error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error getting lease agreement file:', error);
    if (error.message === 'Invalid location') {
      res.status(400).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Failed to get lease agreement file' });
    }
  }
};

export const geocodeProperties = async (req, res) => {
  try {
    console.log('Admin triggered geocoding process for existing properties...');
    
    const result = await geocodeExistingProperties(Property);
    
    console.log('Geocoding process completed:', result);
    
    res.json({
      message: 'Geocoding process completed successfully',
      summary: result
    });
  } catch (error) {
    console.error('Error in geocoding properties:', error);
    res.status(500).json({ 
      message: 'Failed to geocode properties',
      error: error.message 
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get application statistics
    const [
      totalApplications,
      approvedApplications,
      declinedApplications,
      pendingApplications
    ] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: 'approved' }),
      Application.countDocuments({ status: 'declined' }),
      Application.countDocuments({ status: 'pending' })
    ]);

    // Get user statistics
    const [
      totalLandlords,
      totalTenants
    ] = await Promise.all([
      User.countDocuments({ role: 'landlord' }),
      User.countDocuments({ role: 'tenant' })
    ]);

    // Get property and ticket statistics
    const [
      totalProperties,
      pendingProperties,
      openTickets
    ] = await Promise.all([
      Property.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      Ticket.countDocuments({ status: { $nin: ['closed', 'resolved'] } })
    ]);

    // Get escalation statistics
    const [
      escalations,
      newEscalations,
      urgentEscalations,
      recentEscalations
    ] = await Promise.all([
      Escalation.countDocuments(),
      Escalation.countDocuments({ status: 'new' }),
      Escalation.countDocuments({ status: 'new', priority: 'urgent' }),
      Escalation.find()
        .populate('property', 'title location')
        .populate('tenant', 'name email phone')
        .sort('-createdAt')
        .limit(5)
    ]);

    res.json({
      // User stats
      totalLandlords,
      totalTenants,
      
      // Property stats
      totalProperties,
      pendingProperties,
      
      // Application stats
      totalApplications,
      approvedApplications,
      declinedApplications,
      pendingApplications,
      
      // Escalation stats
      escalations,
      newEscalations,
      urgentEscalations,
      recentEscalations,
      
      // Ticket stats
      openTickets,
      
      // Last updated timestamp
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: error.message });
  }
}; 