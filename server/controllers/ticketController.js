import Ticket from '../models/ticketModel.js'; 
import Property from '../models/propertyModel.js';
import User from '../models/userModel.js';

// Create a new ticket
export const createTicket = async (req, res) => {
  try {
    const { propertyId, description } = req.body;
    const tenantId = req.user._id;

    console.log('Creating ticket for:', { propertyId, tenantId });

    // First find the property to check if user is the current tenant
    const property = await Property.findById(propertyId).populate('tenant');
    if (!property) {
      console.log('Property not found:', propertyId);
      return res.status(404).json({ message: 'Property not found' });
    }

    console.log('Property found:', {
      id: property._id,
      title: property.title,
      tenant: property.tenant
    });

    // Check if user is the current tenant of the property
    if (!property.tenant || property.tenant._id.toString() !== tenantId.toString()) {
      console.log('User is not the tenant of the property:', {
        propertyTenant: property.tenant,
        currentUser: tenantId
      });
      return res.status(403).json({ message: 'You must be the current tenant of the property to create a ticket' });
    }

    const ticket = new Ticket({
      property: propertyId,
      tenant: tenantId,
      description
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating ticket:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all tickets (admin only)
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate('property', 'title location')
      .populate('tenant', 'name email')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tenant's tickets
export const getTenantTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ tenant: req.user._id })
      .populate('property', 'title location')
      .populate('tenant', 'name email')
      .populate('comments.user', 'name email role')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update ticket status (admin only)
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!['new', 'review', 'approved', 'declined', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.status = status;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update ticket priority (admin only)
export const updateTicketPriority = async (req, res) => {
  try {
    const { priority } = req.body;
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.priority = priority;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId)
      .populate('property', 'title location')
      .populate('tenant', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user has permission to view this ticket
    if (req.user.role !== 'admin' && ticket.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add comment to ticket
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await Ticket.findById(req.params.ticketId);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.comments.push({
      user: req.user._id,
      text
    });

    await ticket.save();
    
    // Populate the user field in the new comment
    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('comments.user', 'name email role');

    res.json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get tickets by property ID
export const getPropertyTickets = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const tickets = await Ticket.find({ property: propertyId })
      .populate('property', 'title location')
      .populate('tenant', 'name email')
      .populate('comments.user', 'name email role')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete ticket (tenant only)
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.ticketId);
    
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is the tenant who created the ticket
    if (ticket.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this ticket' });
    }

    // Only allow deletion of new tickets
    if (ticket.status !== 'new') {
      return res.status(400).json({ message: 'Can only delete tickets with "new" status' });
    }

    await Ticket.findByIdAndDelete(req.params.ticketId);
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update ticket status (tenant only)
export const updateTenantTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (status !== 'resolved') {
      return res.status(400).json({ message: 'Tenants can only mark tickets as resolved' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Check if user is the tenant who created the ticket
    if (ticket.tenant.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    // Only allow marking approved tickets as resolved
    if (ticket.status !== 'approved') {
      return res.status(400).json({ message: 'Can only mark approved tickets as resolved' });
    }

    ticket.status = status;
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 