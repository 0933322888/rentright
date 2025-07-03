import Application from '../models/applicationModel.js';
import Property from '../models/propertyModel.js';
import Ticket from '../models/ticketModel.js';
import Payment from '../models/paymentModel.js';
import User from '../models/userModel.js';

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id)
      .populate('property')
      .populate('tenant', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if the landlord owns the property
    if (application.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Prevent updating viewing applications
    if (application.status === 'viewing') {
      return res.status(400).json({ 
        message: 'Cannot update application status while viewing is pending. Please wait for the viewing to be completed.' 
      });
    }

    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Update application status
    application.status = status;
    await application.save();

    // Update property's applications array
    const property = await Property.findById(application.property._id);
    const applicationIndex = property.applications.findIndex(
      app => app.tenant.toString() === application.tenant._id.toString()
    );

    if (applicationIndex !== -1) {
      property.applications[applicationIndex].status = status;
      await property.save();
    }

    // If approved, update property status and tenant
    if (status === 'approved') {
      property.tenant = application.tenant._id;
      property.available = false;
      property.status = 'rented';
      await property.save();

      // Cancel all other applications for this tenant with status 'viewing' or 'pending'
      await Application.updateMany(
        {
          tenant: application.tenant._id,
          _id: { $ne: application._id }, // Exclude the current application
          status: { $in: ['viewing', 'pending'] }
        },
        {
          status: 'cancelled',
          updatedAt: Date.now()
        }
      );

      // Also reject all other applications for this specific property
      await Application.updateMany(
        {
          property: property._id,
          _id: { $ne: application._id },
          status: { $in: ['pending', 'viewing'] }
        },
        { status: 'rejected' }
      );

      // Update property's applications array for rejected applications
      await Property.updateMany(
        { _id: property._id },
        {
          $set: {
            'applications.$[elem].status': 'rejected'
          }
        },
        {
          arrayFilters: [
            {
              'elem.tenant': { $ne: application.tenant._id },
              'elem.status': { $in: ['pending', 'viewing'] }
            }
          ]
        }
      );
    }

    res.json({
      message: `Application ${status} successfully`,
      application
    });
  } catch (error) {
    console.error('Error in updateApplicationStatus:', error);
    res.status(400).json({ message: error.message });
  }
};

// Get landlord dashboard statistics
export const getLandlordStatistics = async (req, res) => {
  try {
    const landlordId = req.user._id;

    // Get property statistics
    const [
      totalProperties,
      activeProperties,
      rentedProperties,
      pendingProperties
    ] = await Promise.all([
      Property.countDocuments({ landlord: landlordId }),
      Property.countDocuments({ landlord: landlordId, status: 'active' }),
      Property.countDocuments({ landlord: landlordId, status: 'rented' }),
      Property.countDocuments({ landlord: landlordId, status: 'pending' })
    ]);

    // Get application statistics
    const properties = await Property.find({ landlord: landlordId });
    const propertyIds = properties.map(p => p._id);
    
    const [
      totalApplications,
      pendingApplications,
      viewingApplications,
      approvedApplications
    ] = await Promise.all([
      Application.countDocuments({ property: { $in: propertyIds } }),
      Application.countDocuments({ property: { $in: propertyIds }, status: 'pending' }),
      Application.countDocuments({ property: { $in: propertyIds }, status: 'viewing' }),
      Application.countDocuments({ property: { $in: propertyIds }, status: 'approved' })
    ]);

    // Get ticket statistics
    const [
      totalTickets,
      openTickets,
      resolvedTickets
    ] = await Promise.all([
      Ticket.countDocuments({ property: { $in: propertyIds } }),
      Ticket.countDocuments({ property: { $in: propertyIds }, status: { $nin: ['closed', 'resolved'] } }),
      Ticket.countDocuments({ property: { $in: propertyIds }, status: 'resolved' })
    ]);

    // Get payment statistics
    const [
      totalPayments,
      pendingPayments,
      completedPayments,
      overduePayments
    ] = await Promise.all([
      Payment.countDocuments({ property: { $in: propertyIds } }),
      Payment.countDocuments({ property: { $in: propertyIds }, status: 'pending' }),
      Payment.countDocuments({ property: { $in: propertyIds }, status: 'completed' }),
      Payment.countDocuments({ 
        property: { $in: propertyIds }, 
        status: 'pending',
        dueDate: { $lt: new Date() }
      })
    ]);

    // Calculate total monthly rent
    const rentedPropertiesData = await Property.find({ 
      landlord: landlordId, 
      status: 'rented' 
    }).select('price');
    
    const totalMonthlyRent = rentedPropertiesData.reduce((total, property) => {
      return total + (property.price || 0);
    }, 0);

    // Calculate occupancy rate
    const occupancyRate = totalProperties > 0 ? Math.round((rentedProperties / totalProperties) * 100) : 0;

    res.json({
      // Property stats
      totalProperties,
      activeProperties,
      rentedProperties,
      pendingProperties,
      occupancyRate,
      
      // Application stats
      totalApplications,
      pendingApplications,
      viewingApplications,
      approvedApplications,
      
      // Ticket stats
      totalTickets,
      openTickets,
      resolvedTickets,
      
      // Payment stats
      totalPayments,
      pendingPayments,
      completedPayments,
      overduePayments,
      totalMonthlyRent,
      
      // Last updated
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error getting landlord statistics:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get landlord applications
export const getLandlordApplications = async (req, res) => {
  try {
    const landlordId = req.user._id;
    
    // Get all properties owned by the landlord
    const properties = await Property.find({ landlord: landlordId });
    const propertyIds = properties.map(p => p._id);
    
    // Get applications for these properties
    const applications = await Application.find({ property: { $in: propertyIds } })
      .populate('property', 'title location price images')
      .populate('tenant', 'name email phone')
      .sort('-createdAt')
      .limit(20);

    res.json(applications);
  } catch (error) {
    console.error('Error getting landlord applications:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get landlord payments
export const getLandlordPayments = async (req, res) => {
  try {
    const landlordId = req.user._id;
    
    // Get all properties owned by the landlord
    const properties = await Property.find({ landlord: landlordId });
    const propertyIds = properties.map(p => p._id);
    
    // Get payments for these properties
    const payments = await Payment.find({ property: { $in: propertyIds } })
      .populate('property', 'title')
      .populate('tenant', 'name email')
      .sort('-createdAt')
      .limit(20);

    res.json(payments);
  } catch (error) {
    console.error('Error getting landlord payments:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get landlord tickets
export const getLandlordTickets = async (req, res) => {
  try {
    const landlordId = req.user._id;
    
    // Get all properties owned by the landlord
    const properties = await Property.find({ landlord: landlordId });
    const propertyIds = properties.map(p => p._id);
    
    // Get tickets for these properties
    const tickets = await Ticket.find({ property: { $in: propertyIds } })
      .populate('property', 'title')
      .populate('tenant', 'name email')
      .sort('-createdAt')
      .limit(20);

    res.json(tickets);
  } catch (error) {
    console.error('Error getting landlord tickets:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update ticket status (landlord only)
export const updateLandlordTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, comment } = req.body;
    const landlordId = req.user._id;

    // Validate status
    if (!['review', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Landlords can only change status to review or declined' });
    }

    // Find the ticket and populate property to check ownership
    const ticket = await Ticket.findById(ticketId)
      .populate('property', 'landlord title')
      .populate('tenant', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if the landlord owns the property
    if (ticket.property.landlord.toString() !== landlordId.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    // Check if ticket is in 'new' status (only allow updates from 'new' status)
    if (ticket.status !== 'new') {
      return res.status(400).json({ message: 'Can only update tickets with "new" status' });
    }

    // If status is 'declined', require a comment
    if (status === 'declined' && (!comment || comment.trim().length === 0)) {
      return res.status(400).json({ message: 'Comment is required when declining a ticket' });
    }

    // Update ticket status
    ticket.status = status;
    
    // Add comment if provided (for declined tickets)
    if (comment && comment.trim().length > 0) {
      ticket.comments.push({
        user: landlordId,
        text: comment.trim(),
        createdAt: new Date()
      });
    }

    await ticket.save();

    // Populate the updated ticket
    const updatedTicket = await Ticket.findById(ticketId)
      .populate('property', 'title')
      .populate('tenant', 'name email')
      .populate('comments.user', 'name email role');

    res.json({
      message: `Ticket ${status} successfully`,
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ message: error.message });
  }
}; 